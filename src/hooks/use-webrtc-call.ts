"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSignalingSocket } from "@/lib/websocket/client";

type PeerUser = { id: string; username: string; name: string };

type UseWebRtcCallOptions = {
  callId: string;
  selfId: string;
  peerId: string;
  isCaller: boolean;
  enabled: boolean;
};

export function useWebRtcCall(options: UseWebRtcCallOptions) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "ended" | "failed"
  >("idle");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  useEffect(() => {
    if (!options.enabled) return;
    let active = true;

    async function start() {
      try {
        setStatus("connecting");
        const socket = await getSignalingSocket();
        if (!active) return;
        socketRef.current = socket;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0] ?? null;
          }
        };

        pc.onicecandidate = (event) => {
          if (!event.candidate) return;
          socket.emit("webrtc:ice", {
            peerId: options.peerId,
            callId: options.callId,
            candidate: event.candidate.toJSON(),
          });
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setStatus("connected");
          if (
            pc.connectionState === "failed" ||
            pc.connectionState === "disconnected"
          ) {
            setStatus("failed");
          }
        };

        const onOffer = async (payload: {
          callId: string;
          from: PeerUser;
          sdp: RTCSessionDescriptionInit;
        }) => {
          if (payload.callId !== options.callId) return;
          await pc.setRemoteDescription(payload.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc:answer", {
            peerId: options.peerId,
            callId: options.callId,
            sdp: answer,
          });
        };

        const onAnswer = async (payload: {
          callId: string;
          sdp: RTCSessionDescriptionInit;
        }) => {
          if (payload.callId !== options.callId) return;
          await pc.setRemoteDescription(payload.sdp);
        };

        const onIce = async (payload: {
          callId: string;
          candidate: RTCIceCandidateInit;
        }) => {
          if (payload.callId !== options.callId) return;
          try {
            await pc.addIceCandidate(payload.candidate);
          } catch {
            // ignore late candidates
          }
        };

        const onEnd = (payload: { callId: string }) => {
          if (payload.callId !== options.callId) return;
          setStatus("ended");
          cleanup();
        };

        const createAndSendOffer = async () => {
          if (!options.isCaller || pc.signalingState !== "stable") return;
          if (pc.localDescription) return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", {
            peerId: options.peerId,
            callId: options.callId,
            sdp: offer,
          });
        };

        const onPeerReady = async (payload: { callId: string }) => {
          if (payload.callId !== options.callId) return;
          await createAndSendOffer();
        };

        socket.on("webrtc:offer", onOffer);
        socket.on("webrtc:answer", onAnswer);
        socket.on("webrtc:ice", onIce);
        socket.on("webrtc:ready", onPeerReady);
        socket.on("call:end", onEnd);

        // Announce readiness so the caller can send the offer after both peers are listening.
        socket.emit("webrtc:ready", {
          peerId: options.peerId,
          callId: options.callId,
        });

        if (options.isCaller) {
          // Retry in case the peer's ready arrived before our listener attached.
          window.setTimeout(() => {
            void createAndSendOffer();
          }, 800);
        }

        return () => {
          socket.off("webrtc:offer", onOffer);
          socket.off("webrtc:answer", onAnswer);
          socket.off("webrtc:ice", onIce);
          socket.off("webrtc:ready", onPeerReady);
          socket.off("call:end", onEnd);
        };
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to start media devices.",
        );
        setStatus("failed");
      }
    }

    const disposerPromise = start();

    return () => {
      active = false;
      void disposerPromise.then((dispose) => dispose?.());
      cleanup();
    };
  }, [
    cleanup,
    options.callId,
    options.enabled,
    options.isCaller,
    options.peerId,
  ]);

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  }

  async function switchCamera() {
    const stream = localStreamRef.current;
    const pc = pcRef.current;
    if (!stream || !pc) return;

    const current = stream.getVideoTracks()[0];
    const facingMode =
      current?.getSettings().facingMode === "environment"
        ? "user"
        : "environment";

    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      const nextTrack = next.getVideoTracks()[0];
      if (!nextTrack) return;

      const sender = pc.getSenders().find((item) => item.track?.kind === "video");
      await sender?.replaceTrack(nextTrack);
      current?.stop();
      stream.removeTrack(current);
      stream.addTrack(nextTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      setError("Camera switch is not supported on this device.");
    }
  }

  function endCall() {
    socketRef.current?.emit("call:end", {
      callId: options.callId,
      peerId: options.peerId,
    });
    setStatus("ended");
    cleanup();
  }

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    muted,
    cameraOff,
    error,
    toggleMute,
    toggleCamera,
    switchCamera,
    endCall,
  };
}
