"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/nba", label: "NBA" },
  { href: "/soccer", label: "Soccer" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const profileImage = useMemo(() => {
    return session?.user?.image || "/default-avatar.png";
  }, [session]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0b14]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="group flex items-center gap-3 text-white transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 shadow-lg shadow-indigo-500/25 transition group-hover:scale-105">
              <span className="text-sm font-black tracking-wide text-white">
                FZ
              </span>
            </div>

            <div className="hidden sm:block">
              <div className="text-lg font-semibold tracking-tight">Fore Zone</div>
              <div className="text-xs text-white/45">Daily picks platform</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-white/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.20)]"
                      : "text-white/65 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!session ? (
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-indigo-400/40 hover:bg-indigo-500/10"
            >
              Login
            </Link>
          ) : (
            <Link
              href="/profile"
              className="group relative block overflow-hidden rounded-2xl border border-white/10 transition hover:border-indigo-400/40"
            >
              <Image
                src={profileImage}
                alt="Profile"
                width={42}
                height={42}
                className="h-[42px] w-[42px] object-cover"
              />
              <div className="pointer-events-none absolute inset-0 ring-0 ring-indigo-400/40 transition group-hover:ring-2" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}