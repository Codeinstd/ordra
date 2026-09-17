import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_API_BASE = process.env.BACKEND_API_BASE ?? "http://localhost:4000/api";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(`${BACKEND_API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
        if (!res.ok) return null; // NextAuth turns a null return into a rejected sign-in

        const { token, user } = await res.json();

        console.log("[auth] user found:", !!user);
console.log("[auth] has password:", !!user?.passwordHash);
        // Everything returned here lands in the `user` param of the jwt
        // callback below on first sign-in.
        return { id: user.id, name: user.name, email: user.email, backendToken: token };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials sign-in: backendToken came straight from authorize().
      if (user && "backendToken" in user) {
        token.backendToken = (user as { backendToken: string }).backendToken;
        token.userId = user.id;
      }

      // Google sign-in: exchange Google's ID token for our own backend JWT
      // so both auth methods end up producing the same kind of token that
      // the Express API already knows how to verify.
      if (account?.provider === "google" && account.id_token) {
        const res = await fetch(`${BACKEND_API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account.id_token }),
        });
        if (res.ok) {
          const { token: backendToken, user: backendUser } = await res.json();
          token.backendToken = backendToken;
          token.userId = backendUser.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Exposed to the client so lib/api.ts can attach it as a bearer
      // token on calls to the Express API.
      session.backendToken = token.backendToken;
      if (session.user) session.user.id = token.userId;
      return session;
    },
  },
};
