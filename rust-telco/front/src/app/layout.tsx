import type { Metadata } from "next";
import Header from "@/components/Header";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Northwind Admin - Gestión Profesional",
  description: "Sistema de gestión de clientes y pedidos Northwind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50`}
      >
        <CartProvider>
          <Header />
          <main>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
