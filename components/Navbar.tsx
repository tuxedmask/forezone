"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const ADMIN_EMAILS = ["sjohaadien82@gmail.com"];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [soccerOpen, setSoccerOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);

  const profileImage = useMemo(() => {
    return session?.user?.image || "/default-avatar.png";
  }, [session]);

  const isAdmin = useMemo(() => {
    const email = session?.user?.email?.toLowerCase() || "";
    return ADMIN_EMAILS.includes(email);
  }, [session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function isSubActive(href: string) {
    if (!pathname) return false;

    if (href === "/soccer") {
      return pathname === "/soccer";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function toggleSoccer() {
    setSoccerOpen((prev) => {
      const next = !prev;
      if (next) setAdminOpen(false);
      return next;
    });
  }

  function toggleAdmin() {
    setAdminOpen((prev) => {
      const next = !prev;
      if (next) setSoccerOpen(false);
      return next;
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#060915]/90 backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-3 text-white transition"
          >
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 shadow-[0_10px_28px_rgba(59,130,246,0.28)] transition duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_12px_34px_rgba(99,102,241,0.38)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_45%)]" />
              <span className="relative text-sm font-black tracking-wide text-white">
                FZ
              </span>
            </div>

            <div className="leading-none">
              <div className="text-[1.35rem] font-black tracking-tight text-white">
                Fore Zone
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSoccer}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                soccerOpen
                  ? "border-indigo-300/25 bg-white/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.18)]"
                  : "border-transparent bg-white/[0.04] text-white/70 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              Soccer
            </button>

            {isAdmin ? (
              <button
                type="button"
                onClick={toggleAdmin}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  adminOpen
                    ? "border-emerald-300/25 bg-emerald-500/10 text-white shadow-[0_0_20px_rgba(16,185,129,0.18)]"
                    : "border-transparent bg-white/[0.04] text-white/70 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                Admin
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!session ? (
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400/35 hover:bg-indigo-500/10"
            >
              Login
            </Link>
          ) : (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-200 hover:border-indigo-400/40 hover:shadow-[0_0_18px_rgba(99,102,241,0.18)]"
              >
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-cover"
                />
                <div className="pointer-events-none absolute inset-0 ring-0 ring-indigo-400/40 transition group-hover:ring-2" />
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/95 shadow-2xl backdrop-blur-xl">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {soccerOpen ? (
        <div className="border-t border-white/5 bg-gradient-to-b from-white/[0.03] to-white/[0.015]">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <SubNavLink
              href="/soccer"
              label="Home Zone"
              active={isSubActive("/soccer")}
              onClick={() => setSoccerOpen(false)}
            />
            <SubNavLink
              href="/soccer/predictions/premier-league"
              label="Pick Zone"
              active={isSubActive("/soccer/predictions")}
              onClick={() => setSoccerOpen(false)}
            />
            <SubNavLink
              href="/soccer/leaderboard"
              label="Lead Zone"
              active={isSubActive("/soccer/leaderboard")}
              onClick={() => setSoccerOpen(false)}
            />
          <a
  href="https://soccer-sim--TuxD.replit.app"
  target="_blank"
  rel="noopener noreferrer"
  onClick={() => setSoccerOpen(false)}
  className="group relative shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/72 transition duration-200 hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
>
  <span className="relative z-10 flex items-center gap-2">
    Striker
    <span className="rounded-md bg-emerald-500/20 px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide text-emerald-300">
      Beta
    </span>
  </span>

  <div className="pointer-events-none absolute left-3 right-3 bottom-1 h-[2px] scale-x-0 rounded-full bg-cyan-300/70 opacity-0 transition duration-200 group-hover:scale-x-100 group-hover:opacity-100" />
</a>

          </div>
        </div>
      ) : null}

      {adminOpen && isAdmin ? (
  <div className="border-t border-white/5 bg-gradient-to-b from-emerald-500/[0.07] to-white/[0.015]">
    <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
      <SubNavLink
        href="/soccer/admin/bet365-odds"
        label="Set Odds"
        active={isSubActive("/soccer/admin/bet365-odds")}
        onClick={() => setAdminOpen(false)}
      />

      <SubNavLink
        href="/soccer/admin/results"
        label="Results"
        active={isSubActive("/soccer/admin/results")}
        onClick={() => setAdminOpen(false)}
      />
    </div>
  </div>
) : null}
    </header>
  );
}

function SubNavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative shrink-0 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-200 ${
        active
          ? "border-indigo-400/30 bg-indigo-500 text-white shadow-[0_0_18px_rgba(99,102,241,0.42)]"
          : "border-white/10 bg-white/[0.04] text-white/72 hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      <span className="relative z-10">{label}</span>

      {active ? (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_55%)]" />
          <div className="pointer-events-none absolute left-3 right-3 bottom-1 h-[2px] rounded-full bg-cyan-300/80 blur-[0.5px]" />
        </>
      ) : (
        <div className="pointer-events-none absolute left-3 right-3 bottom-1 h-[2px] scale-x-0 rounded-full bg-cyan-300/70 opacity-0 transition duration-200 group-hover:scale-x-100 group-hover:opacity-100" />
      )}
    </Link>
  );
}