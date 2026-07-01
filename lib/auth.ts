import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password

        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        const admin = await db.admin.findUnique({ where: { email } })
        if (!admin) return null

        const senhaValida = await bcrypt.compare(password, admin.password)
        if (!senhaValida) return null

        return {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
          role: admin.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ''
        token.role = (user as { id: string; nome: string; email: string; role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
})
