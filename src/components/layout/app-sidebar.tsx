"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  Compass,
  Download,
  Flame,
  Heart,
  Home,
  ListVideo,
  Phone,
  Settings,
  Tv2,
  Upload,
  Users,
  WalletCards,
} from "lucide-react";
import { cn } from "@/utils/cn";

const primaryItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/subscription", label: "Subscriptions", icon: Tv2 },
];

const youItems = [
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
  { href: "/liked", label: "Liked videos", icon: Heart },
  { href: "/downloads", label: "Downloads", icon: Download },
];

const featureItems = [
  { href: "/browse", label: "Browse", icon: Flame },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/pricing", label: "Premium", icon: WalletCards },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  if (collapsed) {
    return (
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-18 shrink-0 overflow-y-auto bg-white py-3 px-1 lg:flex lg:flex-col items-center gap-1 border-r border-[#e5e5e5]">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/home" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 w-16 py-3 rounded-xl text-[10px] transition",
                active
                  ? "bg-[#f2f2f2] font-semibold text-[#0f0f0f]"
                  : "text-[#0f0f0f] hover:bg-[#f2f2f2]",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto bg-white p-3 pr-4 lg:block select-none">
      <nav className="space-y-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/home" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-5 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-[#f2f2f2] font-bold text-[#0f0f0f]"
                  : "text-[#0f0f0f] hover:bg-[#f2f2f2] font-normal",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="my-3 border-t border-[#e5e5e5]" />

      <div className="px-3 py-1">
        <p className="text-sm font-semibold text-[#0f0f0f]">You</p>
      </div>

      <nav className="space-y-1">
        {youItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-5 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-[#f2f2f2] font-bold text-[#0f0f0f]"
                  : "text-[#0f0f0f] hover:bg-[#f2f2f2] font-normal",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="my-3 border-t border-[#e5e5e5]" />

      <div className="px-3 py-1">
        <p className="text-sm font-semibold text-[#0f0f0f]">More from YouTube</p>
      </div>

      <nav className="space-y-1">
        {featureItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-5 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-[#f2f2f2] font-bold text-[#0f0f0f]"
                  : "text-[#0f0f0f] hover:bg-[#f2f2f2] font-normal",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
