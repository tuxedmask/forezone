import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import TwitchProvider from "next-auth/providers/twitch";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function makeAppUserId() {
  return crypto.randomUUID();
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function findLinkedAccount(provider: string, providerAccountId: string) {
  const { data, error } = await supabase
    .from("user_accounts")
    .select("user_id")
    .eq("provider", provider)
    .eq("provider_account_id", providerAccountId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function createUser(params: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const id = makeAppUserId();

  const { error } = await supabase.from("users").insert({
    id,
    name: params.name ?? null,
    email: params.email ?? null,
    image: params.image ?? null,
  });

  if (error) throw new Error(error.message);

  return { id };
}

async function linkAccount(params: {
  userId: string;
  provider: string;
  providerAccountId: string;
  email?: string | null;
}) {
  const { error } = await supabase.from("user_accounts").insert({
    user_id: params.userId,
    provider: params.provider,
    provider_account_id: params.providerAccountId,
    email: params.email ?? null,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (!msg.includes("duplicate") && !msg.includes("unique")) {
      throw new Error(error.message);
    }
  }
}

async function updateUserProfile(params: {
  userId: string;
  provider?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("name, email, image")
    .eq("id", params.userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const updates: Record<string, string | null> = {};

  if (params.name && !existingUser?.name) {
    updates.name = params.name;
  }

  if (params.email && !existingUser?.email) {
    updates.email = params.email;
  }

  if (params.provider === "discord" && params.image) {
    updates.image = params.image;
  } else if (!existingUser?.image && params.image) {
    updates.image = params.image;
  }

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", params.userId);

  if (error) throw new Error(error.message);
}

async function getPendingLinkToken() {
  const cookieStore = await cookies();
  return cookieStore.get("fz_link_token")?.value ?? null;
}

async function clearPendingLinkToken() {
  const cookieStore = await cookies();

  cookieStore.set("fz_link_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

async function getValidLinkToken(linkToken: string) {
  const serviceSupabase = getServiceSupabase();

  const { data, error } = await serviceSupabase
    .from("account_link_tokens")
    .select("*")
    .eq("id", linkToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return data;
}

async function markLinkTokenUsed(linkToken: string) {
  const serviceSupabase = getServiceSupabase();

  const { error } = await serviceSupabase
    .from("account_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", linkToken);

  if (error) throw new Error(error.message);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      try {
        const provider = account.provider;
        const providerAccountId = account.providerAccountId;

        const pendingLinkToken = await getPendingLinkToken();

        if (pendingLinkToken) {
          const tokenRow = await getValidLinkToken(pendingLinkToken);

          if (!tokenRow) {
            await clearPendingLinkToken();
            return "/profile?linkError=invalid-token";
          }

          if (tokenRow.target_provider !== provider) {
            await clearPendingLinkToken();
            return "/profile?linkError=provider-mismatch";
          }

          const existingLinked = await findLinkedAccount(provider, providerAccountId);

          if (existingLinked && existingLinked.user_id !== tokenRow.user_id) {
            await clearPendingLinkToken();
            await markLinkTokenUsed(pendingLinkToken);
            return "/profile?linkError=already-linked";
          }

          if (!existingLinked) {
            await linkAccount({
              userId: tokenRow.user_id,
              provider,
              providerAccountId,
              email: user.email,
            });
          }

          await updateUserProfile({
            userId: tokenRow.user_id,
            provider,
            name: user.name,
            email: user.email,
            image: user.image,
          });

          await markLinkTokenUsed(pendingLinkToken);
          await clearPendingLinkToken();

          return true;
        }

        const linked = await findLinkedAccount(provider, providerAccountId);

        if (!linked) {
          const newUser = await createUser({
            name: user.name,
            email: user.email,
            image: user.image,
          });

          await linkAccount({
            userId: newUser.id,
            provider,
            providerAccountId,
            email: user.email,
          });
        }

        return true;
      } catch (error) {
        console.error("signIn error:", error);

        try {
          await clearPendingLinkToken();
        } catch {}

        return false;
      }
    },

    async jwt({ token, account, user }) {
      try {
        if (account) {
          const provider = account.provider;
          const providerAccountId = account.providerAccountId;

          const linked = await findLinkedAccount(provider, providerAccountId);

          if (linked?.user_id) {
            token.appUserId = linked.user_id;
          }

          token.provider = provider;
          token.providerAccountId = providerAccountId;

          if (linked?.user_id) {
            await updateUserProfile({
              userId: linked.user_id,
              provider,
              name: user?.name ?? null,
              email: user?.email ?? null,
              image: user?.image ?? null,
            });
          }
        }

        return token;
      } catch (error) {
        console.error("jwt error:", error);
        return token;
      }
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).appUserId = token.appUserId
          ? String(token.appUserId)
          : undefined;

        (session.user as any).provider = token.provider
          ? String(token.provider)
          : undefined;

        (session.user as any).providerAccountId = token.providerAccountId
          ? String(token.providerAccountId)
          : undefined;
      }

      return session;
    },
  },
};