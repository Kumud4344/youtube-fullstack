import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#0f0f0f] flex flex-col justify-between">
      <header className="px-6 py-4 border-b border-[#e5e5e5] bg-white">
        <Link href="/home" className="flex items-center gap-1 w-fit select-none">
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
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      <footer className="px-6 py-4 text-center text-xs text-[#606060] border-t border-[#e5e5e5] bg-white">
        <p>© 2026 YouTube Clone. All rights reserved.</p>
      </footer>
    </div>
  );
}
