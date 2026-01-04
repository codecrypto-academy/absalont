import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Comprar EuroToken',
  description: 'Compra EuroTokens con tarjeta de crédito',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body>{children}</body>
    </html>
  )
}
