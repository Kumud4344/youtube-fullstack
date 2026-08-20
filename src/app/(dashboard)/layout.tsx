"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#0f0f0f]">
      <AppHeader onToggleSidebar={() => setCollapsed((v) => !v)} />
      <div className="flex w-full">
        <AppSidebar collapsed={collapsed} />
        <main className="min-w-0 flex-1 px-4 sm:px-6 py-4 pb-24 lg:pb-8 max-w-[1920px]">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
