"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Mic,
  MicOff,
  PhoneOff,
  SwitchCamera,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useWebRtcCall } from "@/hooks/use-webrtc-call";
import { apiFetch } from "@/lib/api/client";
import { getSignalingSocket } from "@/lib/websocket/client";
import { useAuthStore } from "@/stores/auth-store";

type CallDetails = {
  id: string;
  status: string;
  caller: { id: string; name: string; username: string } | null;
  receiver: { id: string; name: string; username: string } | null;
};

export default function CallRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const callQuery = useQuery({
    queryKey: ["call", params.id],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ call: CallDetails }>(`/api/calls/${params.id}`),
  });

  const call = callQuery.data?.call;
  const isCaller = call?.caller?.id === user?.id;
  const peer = isCaller ? call?.receiver : call?.caller;

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiFetch(`/api/calls/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  });

  useEffect(() => {
    if (!user || !call || !peer) return;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const socket = await getSignalingSocket();

      if (isCaller) {
        const onAccept = (payload: { callId: string }) => {
          if (payload.callId !== call.id) return;
          setReady(true);
          void statusMutation.mutateAsync("connected");
        };
        const onReject = (payload: { callId: string }) => {
          if (payload.callId !== call.id) return;
          void statusMutation.mutateAsync("ended");
          router.push("/friends");
        };
        socket.on("call:accept", onAccept);
        socket.on("call:reject", onReject);
        cleanup = () => {
          socket.off("call:accept", onAccept);
          socket.off("call:reject", onReject);
        };
      } else {
        setReady(true);
      }
    })();

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, call?.id, peer?.id, isCaller]);

  const {
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
  } = useWebRtcCall({
    callId: params.id,
    selfId: user?.id ?? "",
    peerId: peer?.id ?? "",
    isCaller: Boolean(isCaller),
    enabled: Boolean(user && peer && ready),
  });

  const title = useMemo(() => {
    if (!peer) return "Video Call";
    return `Call with ${peer.name}`;
  }, [peer]);

  if (isLoadingAuth || !user || callQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!call || !peer) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Call not found. <Link href="/friends" className="underline font-bold">Back to friends</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] pb-3">
        <div>
          <h1 className="text-xl font-bold text-[#0f0f0f] md:text-2xl">{title}</h1>
          <p className="text-xs text-[#606060]">
            Status: {status}
            {isCaller && !ready ? " · Ringing…" : ""}
          </p>
        </div>
        <Link href="/friends" className="text-xs font-semibold text-[#065fd4] hover:underline">
          ← Friends
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="relative grid flex-1 gap-3 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-[#e5e5e5] bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="aspect-video h-full w-full object-cover"
          />
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            {peer.name}
          </span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#e5e5e5] bg-black md:absolute md:bottom-4 md:right-4 md:w-44 lg:w-56 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
            You
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm">
        <Button
          variant="secondary"
          size="icon"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => toggleMute()}
        >
          {muted ? <MicOff /> : <Mic />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label={cameraOff ? "Camera on" : "Camera off"}
          onClick={() => toggleCamera()}
        >
          {cameraOff ? <VideoOff /> : <Video />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Switch camera"
          onClick={() => void switchCamera()}
        >
          <SwitchCamera />
        </Button>
        <Button
          variant="danger"
          className="rounded-full px-5"
          onClick={async () => {
            endCall();
            await statusMutation.mutateAsync("ended");
            router.push("/friends");
          }}
        >
          <PhoneOff className="h-4 w-4" />
          End Call
        </Button>
      </div>
    </div>
  );
}
