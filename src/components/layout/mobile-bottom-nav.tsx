"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Home,
  PlusCircle,
  Tv2,
  User,
} from "lucide-react";
import { cn } from "@/utils/cn";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/upload", label: "Create", icon: PlusCircle },
  { href: "/subscription", label: "Subscriptions", icon: Tv2 },
  { href: "/profile", label: "You", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e5e5] bg-white lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/home" && pathname === "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] transition",
                  active
                    ? "font-semibold text-[#0f0f0f]"
                    : "text-[#606060] hover:text-[#0f0f0f]",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
