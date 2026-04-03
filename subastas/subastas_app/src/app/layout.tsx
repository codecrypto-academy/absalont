import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { GlobalProvider } from "@/context/GlobalContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Solana Auctions | Premium Decentralized Marketplace",
  description: "Experience the future of decentralized auctions on the high-performance Solana blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#020617] text-slate-50 antialiased selection:bg-blue-500/30">
        {/* Decorative background elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse [animation-delay:2s]" />
          <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-400/5 blur-[100px] animate-pulse [animation-delay:4s]" />
        </div>
        
        <GlobalProvider>
          <div className="relative min-h-screen flex flex-col">
            {children}
          </div>
        </GlobalProvider>
      </body>
    </html>
  );
}
