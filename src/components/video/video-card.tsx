import Link from "next/link";
import { MoreVertical } from "lucide-react";
import type { PublicVideo } from "@/types/video";
import { formatDuration, formatViews, timeAgo } from "@/utils/video";

export function VideoCard({ video }: { video: PublicVideo }) {
  return (
    <article className="group flex flex-col cursor-pointer">
      <Link href={`/watch/${video.id}`} className="block relative">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#e5e5e5]">
          {video.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f0f0f0] text-[#909090] text-sm">
              No thumbnail
            </div>
          )}
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white tracking-wide">
            {formatDuration(video.duration || 0)}
          </span>
        </div>
      </Link>
      <div className="mt-3 flex gap-3">
        <Link
          href={`/channel/${video.channel.username}`}
          className="shrink-0"
          title={video.channel.name}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#cc0000] text-sm font-semibold text-white">
            {video.channel.name.slice(0, 1).toUpperCase()}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <Link href={`/watch/${video.id}`} className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-[#0f0f0f] group-hover:text-[#0f0f0f]">
                {video.title}
              </h3>
            </Link>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-[#606060] hover:bg-[#f2f2f2] hover:text-[#0f0f0f] transition"
              aria-label="Video options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-[#606060]">
            <Link
              href={`/channel/${video.channel.username}`}
              className="hover:text-[#0f0f0f]"
            >
              {video.channel.name}
            </Link>
          </p>
          <p className="text-xs text-[#606060]">
            {formatViews(video.views)} views · {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
