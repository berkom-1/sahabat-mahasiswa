import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { query, execute } from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password?: string;
  avatar_url?: string;
}

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
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
        // Find existing user in MySQL
        const users = await query<UserRow[]>(
          "SELECT id, name, email, password, avatar_url FROM users WHERE LOWER(email) = ? LIMIT 1",
          [cleanEmail]
        );

        if (users.length > 0) {
          const user = users[0];
          // User exists with password: password check is mandatory
          if (user.password) {
            if (!credentials.password) {
              return null;
            }
            const normalized = user.password.replace(/^\$2y\$/, "$2a$");
            const match = await bcrypt.compare(credentials.password, normalized);
            if (!match) return null;
          }
          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            image: user.avatar_url || null,
          };
        }

        // If user does not exist yet (e.g. Google email or quick student registration)
        const name = credentials.name || cleanEmail.split("@")[0];
        const isCampus =
          cleanEmail.includes(".ac.id") ||
          cleanEmail.includes("kampus.uc.id") ||
          cleanEmail.includes(".edu");

        const userPassword = credentials.password || (credentials.provider === "google" ? "google-auth-student" : "");
        if (!userPassword) {
          return null;
        }

        const dummyHash = await bcrypt.hash(userPassword, 10);
        const res = await execute(
          `INSERT INTO users (name, email, password, student_email, student_verified, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [name, cleanEmail, dummyHash, isCampus ? cleanEmail : null, isCampus ? 1 : 0]
        );

        return {
          id: String(res.insertId),
          email: cleanEmail,
          name: name,
          image: null,
        };
      } catch (err) {
        console.error("NextAuth MySQL authorize error:", err);
        return null;
      }
    },
  })
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
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
        (session.user as { id?: string }).id = token.sub;
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
