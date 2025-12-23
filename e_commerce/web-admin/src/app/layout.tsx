import './globals.css'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AdminPro - Crypto E-Commerce',
  description: 'Pro Dashboard for Marketplace Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-slate-50">
        <Sidebar />
        <div className="pl-64">
          <Navbar />
          <main className="pt-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
