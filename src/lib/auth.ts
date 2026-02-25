import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (!user || !user.attivo) return null;

                const passwordValid = await bcrypt.compare(password, user.password_hash);
                if (!passwordValid) return null;

                // Update last_login
                await db
                    .update(users)
                    .set({ last_login: new Date() })
                    .where(eq(users.id, user.id));

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.nome} ${user.cognome}`,
                    ruolo: user.ruolo,
                    organization_id: user.organization_id,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.ruolo = (user as any).ruolo;
                token.organization_id = (user as any).organization_id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                (session.user as any).ruolo = token.ruolo;
                (session.user as any).organization_id = token.organization_id;
            }
            return session;
        },
    },
});
