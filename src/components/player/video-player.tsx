"use client";

import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/video";

type VideoPlayerProps = {
  src: string;
  poster?: string;
  title: string;
  initialTime?: number;
  maxWatchSeconds?: number | null;
  onLimitReached?: () => void;
  onProgress?: (payload: {
    position: number;
    watchedSeconds: number;
    completed: boolean;
  }) => void;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  src,
  poster,
  title,
  initialTime = 0,
  maxWatchSeconds = null,
  onLimitReached,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const lastTick = useRef<number | null>(null);

  const emitProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;
    onProgress({
      position: video.currentTime,
      watchedSeconds,
      completed: duration > 0 && video.currentTime / duration >= 0.9,
    });
  }, [duration, onProgress, watchedSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialTime) return;
    const onLoaded = () => {
      video.currentTime = initialTime;
    };
    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [initialTime]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (playing) emitProgress();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [emitProgress, playing]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
      lastTick.current = performance.now();
    } else {
      video.pause();
      setPlaying(false);
      emitProgress();
      lastTick.current = null;
    }
  }

  function onTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    if (
      typeof maxWatchSeconds === "number" &&
      maxWatchSeconds >= 0 &&
      video.currentTime >= maxWatchSeconds
    ) {
      video.currentTime = maxWatchSeconds;
      video.pause();
      setPlaying(false);
      setCurrentTime(maxWatchSeconds);
      onLimitReached?.();
      emitProgress();
      return;
    }

    setCurrentTime(video.currentTime);
    if (playing && lastTick.current !== null) {
      const now = performance.now();
      const delta = (now - lastTick.current) / 1000;
      if (delta > 0 && delta < 2) {
        setWatchedSeconds((value) => value + delta);
      }
      lastTick.current = now;
    }
  }

  function seek(ratio: number) {
    const video = videoRef.current;
    if (!video || !duration) return;
    video.currentTime = Math.min(Math.max(ratio, 0), 1) * duration;
    setCurrentTime(video.currentTime);
  }

  function onSeekBarPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seek(ratio);
  }

  async function toggleFullscreen() {
    const node = containerRef.current;
    if (!node) return;
    if (!document.fullscreenElement) {
      await node.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-black"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="aspect-video w-full bg-black"
        playsInline
        onClick={togglePlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => {
          setPlaying(true);
          lastTick.current = performance.now();
        }}
        onPause={() => {
          setPlaying(false);
          lastTick.current = null;
        }}
        onEnded={() => {
          setPlaying(false);
          emitProgress();
        }}
        aria-label={title}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 space-y-2 p-3 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <div
          className="pointer-events-auto h-1.5 cursor-pointer rounded-full bg-white/20"
          onPointerDown={onSeekBarPointer}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(currentTime)}
          tabIndex={0}
        >
          <div
            className="h-full rounded-full bg-cyan-400"
            style={{
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="pointer-events-auto flex items-center gap-2 text-white">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/10"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/10"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = !video.muted;
              setMuted(video.muted);
            }}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            aria-label="Volume"
            className="w-20 accent-cyan-400"
            onChange={(event) => {
              const next = Number(event.target.value);
              const video = videoRef.current;
              setVolume(next);
              setMuted(next === 0);
              if (video) {
                video.volume = next;
                video.muted = next === 0;
              }
            }}
          />

          <span className="text-xs text-slate-200">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="relative ml-auto flex items-center gap-1">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Settings"
              onClick={() => setShowSettings((value) => !value)}
            >
              <Settings2 className="h-5 w-5" />
            </button>
            {showSettings ? (
              <div className="absolute bottom-12 right-0 min-w-40 rounded-xl border border-slate-700 bg-slate-950/95 p-2 text-sm shadow-xl">
                <p className="px-2 py-1 text-xs uppercase tracking-wide text-slate-500">
                  Speed
                </p>
                {SPEEDS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "block w-full rounded-lg px-2 py-1.5 text-left hover:bg-slate-800",
                      speed === value && "text-cyan-300",
                    )}
                    onClick={() => {
                      const video = videoRef.current;
                      setSpeed(value);
                      if (video) video.playbackRate = value;
                      setShowSettings(false);
                    }}
                  >
                    {value}x
                  </button>
                ))}
                <p className="mt-2 px-2 py-1 text-xs uppercase tracking-wide text-slate-500">
                  Quality
                </p>
                <p className="px-2 py-1 text-slate-400">Auto (source)</p>
                <p className="mt-2 px-2 py-1 text-xs uppercase tracking-wide text-slate-500">
                  Captions
                </p>
                <p className="px-2 py-1 text-slate-400">Unavailable</p>
              </div>
            ) : null}
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-white/10"
              onClick={() => void toggleFullscreen()}
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
