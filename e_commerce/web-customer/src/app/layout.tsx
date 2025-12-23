import './globals.css'
import Header from '@/components/Header'
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata = {
  title: 'E-Commerce - Blockchain Shopping',
  description: 'Compra productos con criptomonedas de forma segura',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={jakarta.className}>
      <body className="antialiased bg-slate-50">
        <Header />
        <main className="pt-24">
          {children}
        </main>
      </body>
    </html>
  )
}
