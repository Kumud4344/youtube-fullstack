"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Compass,
  Home,
  LogOut,
  Menu,
  Mic,
  Plus,
  Search,
  Tv2,
  Upload,
  User,
  Video,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/utils/cn";

export function AppHeader({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [userDropdown, setUserDropdown] = useState(false);

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    clear();
    router.push("/login");
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[#e5e5e5] bg-white px-4">
      {/* Left section: Hamburger menu & YouTube logo with IN badge */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#0f0f0f] hover:bg-[#f2f2f2] transition"
          aria-label="Toggle menu"
          onClick={() => {
            if (onToggleSidebar) {
              onToggleSidebar();
            } else {
              setMobileOpen((v) => !v);
            }
          }}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/home" className="flex items-center gap-1 select-none">
          <div className="flex h-6 w-8 items-center justify-center rounded-[6px] bg-[#ff0000] text-white">
            <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tighter text-[#0f0f0f] font-sans">
            YouTube
          </span>
          <span className="text-[10px] font-medium text-[#606060] -top-2 relative ml-0.5">
            IN
          </span>
        </Link>
      </div>

      {/* Middle section: YouTube Search Bar & Mic */}
      <div className="hidden flex-1 max-w-2xl items-center justify-center px-4 sm:flex">
        <form onSubmit={onSearch} className="flex w-full max-w-[600px] items-center">
          <div className="flex w-full items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-10 w-full rounded-l-full border border-[#cccccc] bg-white px-4 text-sm text-[#0f0f0f] placeholder-[#606060] focus:border-[#065fd4] focus:outline-none focus:ring-1 focus:ring-[#065fd4]"
              aria-label="Search"
            />
            <button
              type="submit"
              className="flex h-10 w-16 items-center justify-center rounded-r-full border border-l-0 border-[#cccccc] bg-[#f8f8f8] hover:bg-[#f0f0f0] text-[#0f0f0f] transition"
              aria-label="Search button"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] hover:bg-[#e5e5e5] text-[#0f0f0f] transition"
            title="Search with your voice"
          >
            <Mic className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Right section: Actions / Sign in */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#0f0f0f] hover:bg-[#f2f2f2] transition sm:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {user ? (
          <>
            <Link
              href="/upload"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#f2f2f2] hover:bg-[#e5e5e5] px-3.5 py-1.5 text-sm font-medium text-[#0f0f0f] transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </Link>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#0f0f0f] hover:bg-[#f2f2f2] transition"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdown((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cc0000] text-sm font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-[#065fd4]"
                aria-label="User menu"
              >
                {user.name.slice(0, 1)}
              </button>

              {userDropdown ? (
                <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-[#e5e5e5] bg-white p-2 shadow-lg text-[#0f0f0f]">
                  <div className="border-b border-[#e5e5e5] p-3">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-[#606060]">@{user.username}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href={`/channel/${user.username}`}
                      onClick={() => setUserDropdown(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-[#0f0f0f] hover:bg-[#f2f2f2]"
                    >
                      View your channel
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdown(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-[#0f0f0f] hover:bg-[#f2f2f2]"
                    >
                      Your Profile & Plan
                    </Link>
                    <Link
                      href="/upload"
                      onClick={() => setUserDropdown(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-[#0f0f0f] hover:bg-[#f2f2f2]"
                    >
                      Upload Video
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserDropdown(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-[#0f0f0f] hover:bg-[#f2f2f2]"
                    >
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-[#e5e5e5] pt-1">
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#cc0000] hover:bg-[#f2f2f2]"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-[#0f0f0f] bg-[#0f0f0f] hover:bg-[#272727] text-white px-4 py-1.5 text-sm font-semibold transition"
          >
            <User className="h-4 w-4" />
            <span>Sign in</span>
          </Link>
        )}
      </div>

      {/* Mobile search & menu overlay */}
      {mobileOpen ? (
        <div className="absolute inset-x-0 top-14 z-50 border-b border-[#e5e5e5] bg-white p-4 shadow-md sm:hidden">
          <form onSubmit={onSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search YouTube"
              className="h-10 w-full rounded-full border border-[#cccccc] bg-white px-4 text-sm text-[#0f0f0f]"
              autoFocus
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
