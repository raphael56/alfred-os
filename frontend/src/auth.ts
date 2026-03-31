import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import crypto from "crypto";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = process.env.AUTH_USERNAME;
        const passwordHash = process.env.AUTH_PASSWORD_HASH;

        if (!credentials?.username || !credentials?.password) return null;
        if (!username || !passwordHash) return null;
        if (credentials.username !== username) return null;
        if (sha256(credentials.password as string) !== passwordHash) return null;

        return { id: "1", name: username };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});
