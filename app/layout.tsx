import type { Metadata } from 'next'
import { Cormorant_Garamond, Montserrat, EB_Garamond, Inter } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Kima Kyami',
    default: 'Kima Kyami',
  },
  description: 'Kima Kyami — Sapatos de luxo femininos com inspiração africana contemporânea. Saltos, sandálias e mules exclusivos, criados em Angola.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? 'https://kimakyami.com'),
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    siteName: 'Kima Kyami',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt"
      className={`${cormorant.variable} ${montserrat.variable} ${ebGaramond.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
