import { CartProvider } from '@/context/CartContext'
import Navbar from '@/components/store/Navbar'
import CartSidebar from '@/components/store/CartSidebar'
import Footer from '@/components/store/Footer'
import type { ReactNode } from 'react'

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-noir focus:text-cream focus:text-sm focus:tracking-wide"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Saltar para o conteúdo
      </a>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
      </div>
      <CartSidebar />
    </CartProvider>
  )
}
