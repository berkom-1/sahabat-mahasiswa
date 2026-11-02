/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Mahasiswa / Google Email",
    credentials: {
      email: { label: "Email", type: "email" },
      name: { label: "Nama", type: "text" },
      password: { label: "Password", type: "password" },
      provider: { label: "Provider", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;
      const cleanEmail = credentials.email.trim().toLowerCase();

      try {
        const user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (user) {
          if (credentials.password && user.password) {
            const normalized = user.password.replace(/^\$2y\$/, "$2a$");
            const match = await bcrypt.compare(credentials.password, normalized);
            if (!match) return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.nama,
            image: user.avatar_url || null,
          };
        }

        const nameInput = credentials.name || cleanEmail.split("@")[0];
        const isCampus =
          cleanEmail.includes(".ac.id") ||
          cleanEmail.includes("kampus.uc.id") ||
          cleanEmail.includes(".edu");

        const dummyHash = await bcrypt.hash(
          credentials.password || "student123",
          10
        );

        const newUser = await prisma.user.create({
          data: {
            nama: nameInput,
            email: cleanEmail,
            password: dummyHash,
            student_email: isCampus ? cleanEmail : null,
            student_verified: isCampus,
            auth_provider: credentials.provider || "email",
          },
        });

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.nama,
          image: newUser.avatar_url || null,
        };
      } catch (err) {
        console.error("NextAuth Prisma authorize error:", err);
        return null;
      }
    },
  }),
);

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET || "sahabat-mahasiswa-secret-fallback-key-2026",
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture as string | null | undefined;
        // Inject custom ID secara aman tanpa memicu error tipe NextAuth
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        if (user.image) token.picture = user.image;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };