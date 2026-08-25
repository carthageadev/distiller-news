import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";

const authSchema = {
  user: schema.users,
  session: schema.sessions,
  account: schema.accounts,
  verification: schema.verifications
};

function createAuth() {
  const siteUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://distiller.attafii.dev";
  const normalizedSiteOrigin = (() => {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return siteUrl.replace(/\/+$/, "");
    }
  })();

  const authOptions: Parameters<typeof betterAuth>[0] = {
    baseURL: normalizedSiteOrigin,
    trustedOrigins: [
      normalizedSiteOrigin,
      "http://localhost:3000"
    ],
    database: db
      ? drizzleAdapter(db, { provider: "pg", schema: authSchema })
      : undefined,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        // Better Auth generates /reset-password/{token} but our page is at /auth/reset-password
        // Extract token from the URL and redirect to our custom page
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split("/");
        const token = pathParts[pathParts.length - 1];
        const customUrl = `${normalizedSiteOrigin}/auth/reset-password?token=${token}`;

        const email = buildPasswordResetEmail(customUrl);
        await sendEmail({ to: user.email, subject: email.subject, html: email.html });
      }
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirectURI: `${normalizedSiteOrigin}/api/auth/callback/google`
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
        redirectURI: `${normalizedSiteOrigin}/api/auth/callback/github`
      }
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60
      }
    },
    rateLimit: {
      window: 60,
      max: 100
    },
    advanced: {
      cookies: {
        state: {
          attributes: {
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/"
          }
        },
        session_token: {
          attributes: {
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/"
          }
        }
      }
    },
    secret: process.env.BETTER_AUTH_SECRET
  };

  return betterAuth(authOptions);
}

export const auth = createAuth();
export const handler = auth.handler;

/**
 * Session shape expected by the landing Nav (ported from the static landing).
 * Resolves the better-auth session and the user's plan from subscriptions.
 */
export type NavSessionUser = {
  email: string;
  name: string | null;
  plan: "free" | "pro";
};

export async function getSessionUser(): Promise<NavSessionUser | null> {
  try {
    if (!db) return null;
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) return null;

    let plan: "free" | "pro" = "free";
    try {
      if (db) {
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(schema.subscriptions.userId, session.user.id)
        });
        if (subscription?.plan === "pro") plan = "pro";
      }
    } catch {
      // subscription lookup is best-effort
    }

    return {
      email: session.user.email,
      name: session.user.name ?? null,
      plan
    };
  } catch {
    return null;
  }
}