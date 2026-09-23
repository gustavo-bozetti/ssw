import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import BottomNav from "@/components/ui/BottomNav"
import Sidebar from "@/components/ui/Sidebar"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: "Logística",
  description: "Gestão de entregas",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#F3F3F3] lg:bg-[#F5F6FA] font-[family-name:var(--font-geist)] antialiased pb-24 lg:pb-0 lg:flex lg:h-screen lg:overflow-hidden lg:gap-0">
        <Sidebar />
        {/* conteúdo principal ocupa o restante e rola internamente no desktop */}
        <div className="lg:flex-1 lg:overflow-y-auto lg:min-w-0">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
