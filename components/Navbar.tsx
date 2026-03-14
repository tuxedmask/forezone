"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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

  const links = [
    { href: "/submit-pick", label: "Submit Pick" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/nols", label: "NoLs" },
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
            const isActive = pathname === link.href;

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

      <div className="navbar-desktop-right" ref={profileMenuRef}>
        {session?.user?.image ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              onMouseEnter={() => setHovered("profile")}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Image
                src={session.user.image}
                alt="Profile"
                width={38}
                height={38}
                unoptimized
                style={{
                  borderRadius: "999px",
                  objectFit: "cover",
                  border: "1px solid rgba(129,140,248,0.28)",
                  transition: "0.2s ease",
                  boxShadow:
                    hovered === "profile" || menuOpen
                      ? "0 0 12px rgba(129,140,248,0.7)"
                      : "0 0 0 rgba(0,0,0,0)",
                }}
              />
            </button>

            <div
              style={{
                position: "absolute",
                right: 20,
                top: 62,
                width: 210,
                background: "rgba(19,16,33,0.98)",
                border: "1px solid #31294c",
                borderRadius: 16,
                padding: 10,
                boxShadow: "0 16px 34px rgba(0,0,0,0.45)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen
                  ? "translateY(0) scale(1)"
                  : "translateY(-8px) scale(0.98)",
                transformOrigin: "top right",
                pointerEvents: menuOpen ? "auto" : "none",
                transition: "opacity 0.18s ease, transform 0.18s ease",
                zIndex: 1000,
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "6px 10px",
                  color: "#c7d2fe",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  height: 1,
                  background: "#31294c",
                  margin: "4px 0 6px 0",
                }}
              />

              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  background: pathname === "/profile" ? "#262047" : "transparent",
                }}
              >
                Profile
              </Link>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#262047",
                  color: "#fca5a5",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <Link
            href="/login"
            onMouseEnter={() => setHovered("signin")}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              padding: "11px 16px",
              borderRadius: 14,
              background:
                hovered === "signin"
                  ? "linear-gradient(180deg, #7377f5, #5b5fe8)"
                  : "linear-gradient(180deg, #6366f1, #5558df)",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              border: "1px solid rgba(129,140,248,0.35)",
              boxShadow:
                hovered === "signin"
                  ? "0 0 18px rgba(99,102,241,0.32)"
                  : "0 0 12px rgba(99,102,241,0.20)",
              transition: "0.18s ease",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "999px",
                background: "rgba(255,255,255,0.14)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                lineHeight: 1,
              }}
            >
              ✦
            </span>
            Sign In
          </Link>
        )}
      </div>

      <div className="navbar-mobile-right" ref={mobileMenuRef}>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            border: "1px solid #31294c",
            background: "#1a1630",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
          aria-label="Open menu"
        >
          <span
            style={{
              position: "absolute",
              width: 18,
              height: 2,
              borderRadius: 999,
              background: "#c7d2fe",
              transform: mobileMenuOpen
                ? "translateY(0) rotate(45deg)"
                : "translateY(-6px) rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
          <span
            style={{
              position: "absolute",
              width: 18,
              height: 2,
              borderRadius: 999,
              background: "#c7d2fe",
              opacity: mobileMenuOpen ? 0 : 1,
              transform: "translateY(0)",
              transition: "opacity 0.18s ease",
            }}
          />
          <span
            style={{
              position: "absolute",
              width: 18,
              height: 2,
              borderRadius: 999,
              background: "#c7d2fe",
              transform: mobileMenuOpen
                ? "translateY(0) rotate(-45deg)"
                : "translateY(6px) rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>

        <div
          style={{
            position: "absolute",
            right: 20,
            top: 62,
            width: 230,
            background: "rgba(19,16,33,0.98)",
            border: "1px solid #31294c",
            borderRadius: 16,
            padding: 10,
            boxShadow: "0 16px 34px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            opacity: mobileMenuOpen ? 1 : 0,
            transform: mobileMenuOpen
              ? "translateY(0) scale(1)"
              : "translateY(-8px) scale(0.98)",
            transformOrigin: "top right",
            pointerEvents: mobileMenuOpen ? "auto" : "none",
            transition: "opacity 0.18s ease, transform 0.18s ease",
            zIndex: 1000,
            backdropFilter: "blur(10px)",
          }}
        >
          {session ? (
            <>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "6px 10px",
                  color: "#c7d2fe",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  height: 1,
                  background: "#31294c",
                  margin: "4px 0 6px 0",
                }}
              />
            </>
          ) : null}

          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: isActive ? "#c7d2fe" : "white",
                  fontSize: 14,
                  fontWeight: 600,
                  background: isActive ? "#262047" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {session ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: pathname === "/profile" ? "#c7d2fe" : "white",
                  fontSize: 14,
                  fontWeight: 600,
                  background: pathname === "/profile" ? "#262047" : "transparent",
                  marginTop: 4,
                }}
              >
                Profile
              </Link>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#262047",
                  color: "#fca5a5",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: "#c7d2fe",
                fontSize: 14,
                fontWeight: 700,
                background: "#262047",
                marginTop: 4,
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .navbar-desktop-links,
        .navbar-desktop-right {
          display: none;
        }

        .navbar-mobile-right {
          display: flex;
        }

        @media (min-width: 900px) {
          nav {
            padding: 18px 32px;
          }

          .navbar-desktop-links {
            display: flex;
            gap: 22px;
            align-items: center;
          }

          .navbar-desktop-right {
            display: flex;
            align-items: center;
          }

          .navbar-mobile-right {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}