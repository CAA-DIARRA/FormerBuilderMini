import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: { label: "Email" }, password: { label: "Password", type: "password" } },
      async authorize(creds) {
        const user = await prisma.user.findUnique({ where: { email: creds!.email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(creds!.password, user.passwordHash);
        return ok ? { id: user.id, email: user.email, name: user.name } : null;
      }
    })
  ],
  session: { strategy: "jwt" }
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
