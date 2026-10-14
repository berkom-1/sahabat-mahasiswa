import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const providers: NextAuthOptions["providers"] = [];

// Hanya aktifkan GoogleProvider jika Client ID dan Secret sudah diisi (mencegah Server Configuration Crash)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Credentials provider untuk login langsung email kampus & Google fallback instan
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Mahasiswa / Google Email",
    credentials: {
      email: { label: "Email", type: "email" },
      name: { label: "Nama", type: "text" },
      provider: { label: "Provider", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;
      return {
        id: credentials.email,
        email: credentials.email,
        name: credentials.name || credentials.email.split("@")[0],
        image: null,
      };
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
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
