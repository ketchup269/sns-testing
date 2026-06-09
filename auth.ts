import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { validateEmail } from "@/lib/validation"

import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
        Facebook({
            clientId: process.env.FACEBOOK_APP_ID!,
            clientSecret: process.env.FACEBOOK_APP_SECRET!,
            allowDangerousEmailAccountLinking: true,
            // instagram_basic was shut down by Meta on Dec 4, 2024 (EOL).
            // Other Instagram scopes require App Review — handle in a separate
            // post-login "Connect Instagram Account" flow.
            authorization: {
                params: {
                    scope: "public_profile",
                },
            },
            profile(profile) {
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email || `${profile.id}@facebook.com`,
                    image: profile.picture?.data?.url,
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                // Early exit for invalid email formats
                const { valid } = validateEmail(credentials.email as string)
                if (!valid) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!user) {
                    return null
                }

                if (!user.password_hash) {
                    return null
                }

                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.password_hash
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            }
        })
    ],
})
