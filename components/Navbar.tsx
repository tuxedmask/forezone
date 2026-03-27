"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  external?: boolean;
};

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [hovered, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin =
    (session?.user as any)?.provider === "discord" &&
    (session?.user as any)?.providerAccountId === "392829792216547359";

  const links: NavLink[] = [
    { href: "/submit-pick", label: "Submit Pick" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/nols", label: "NoLs" },
    {
      href: "https://soccer-guess-master--tuxdmask.replit.app",
      label: "Game",
      external: true,
    },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const displayName = session?.user?.name || "User";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      style={{
        width: "100%",
        padding: "18px 20px",
        borderBottom: "1px solid #31294c",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#201a3d",
        boxShadow: "0 4px 20px rgba(99,102,241,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link
          href="/"
          onMouseEnter={() => setHovered("logo")}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: hovered === "logo" ? "#c7d2fe" : "white",
            fontWeight: 800,
            fontSize: 18,
            transition: "0.2s ease",
            textShadow:
              hovered === "logo"
                ? "0 0 10px rgba(129,140,248,0.65)"
                : "none",
            whiteSpace: "nowrap",
          }}
        >
          <Image
            src="/forezone-logo.png"
            alt="Fore Zone"
            width={28}
            height={28}
          />
          Fore Zone
        </Link>

        <div className="navbar-desktop-links">
          {links.map((link) => {
            const isHovered = hovered === link.href;
            const isActive = !link.external && pathname === link.href;

            if (link.external) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHovered(link.href)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    textDecoration: "none",
                    color: isHovered ? "#c7d2fe" : "#ddd6fe",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "0.2s ease",
                    textShadow: isHovered
                      ? "0 0 8px rgba(129,140,248,0.55)"
                      : "none",
                    position: "relative",
                    paddingBottom: 6,
                  }}
                >
                  {link.label}

                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: 0,
                      height: 2,
                      width: "100%",
                      background: "#6366f1",
                      borderRadius: 999,
                      boxShadow: isHovered
                        ? "0 0 8px rgba(129,140,248,0.75)"
                        : "none",
                      transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: "left",
                      transition:
                        "transform 0.22s ease, box-shadow 0.22s ease",
                    }}
                  />
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHovered(link.href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  textDecoration: "none",
                  color: isHovered || isActive ? "#c7d2fe" : "#ddd6fe",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "0.2s ease",
                  textShadow:
                    isHovered || isActive
                      ? "0 0 8px rgba(129,140,248,0.55)"
                      : "none",
                  position: "relative",
                  paddingBottom: 6,
                }}
              >
                {link.label}

                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    height: 2,
                    width: "100%",
                    background: "#6366f1",
                    borderRadius: 999,
                    boxShadow:
                      isHovered || isActive
                        ? "0 0 8px rgba(129,140,248,0.75)"
                        : "none",
                    transform:
                      isHovered || isActive ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition:
                      "transform 0.22s ease, box-shadow 0.22s ease",
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* rest of your file stays EXACT same */}
    </nav>
  );
}