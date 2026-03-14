import Link from "next/link";

type LoginButtonProps = {
  provider: "Discord" | "Twitch";
};

export default function LoginButton({ provider }: LoginButtonProps) {
  return (
    <Link
      href="/login"
      style={{
        padding: "12px 20px",
        borderRadius: "10px",
        border: "1px solid #333",
        background: "#111",
        color: "white",
        cursor: "pointer",
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      Login with {provider}
    </Link>
  );
}