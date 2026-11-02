import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";

// Perluas tipe Session bawaan NextAuth agar mengenali id dan role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

// Normalisasi URL jika pengguna memasukkan domain tanpa protokol (misal: 'boedi.my.id')
if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith("http://") && !process.env.NEXTAUTH_URL.startsWith("https://")) {
  process.env.NEXTAUTH_URL = `https://${process.env.NEXTAUTH_URL.trim()}`;
}
if (process.env.AUTH_URL && !process.env.AUTH_URL.startsWith("http://") && !process.env.AUTH_URL.startsWith("https://")) {
  process.env.AUTH_URL = `https://${process.env.AUTH_URL.trim()}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata Sandi", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const user = await db.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("Gagal memverifikasi kredensial pengguna:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        token.role = user.role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        if (typeof token.id === "string") {
          session.user.id = token.id;
        } else if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }
        if (token.role) {
          session.user.role = token.role as Role;
        }
      }
      return session;
    },
  },
});
