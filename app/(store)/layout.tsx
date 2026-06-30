import { CartProvider } from '@/context/CartContext'
import Navbar from '@/components/store/Navbar'
import CartSidebar from '@/components/store/CartSidebar'
import Footer from '@/components/store/Footer'
import type { ReactNode } from 'react'

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CartSidebar />
    </CartProvider>
  )
}
