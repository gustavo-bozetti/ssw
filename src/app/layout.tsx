import type { Metadata, Viewport } from "next"
import { Barlow, Heebo } from "next/font/google"
import "./globals.css"
import BottomNav from "@/components/ui/BottomNav"
import Sidebar from "@/components/ui/Sidebar"

const barlow = Barlow({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["400", "600", "700"],
  display: "swap",
})

const heebo = Heebo({
  subsets: ["latin"],
  variable: "--font-heebo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

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
    <html lang="pt-BR" className={`${barlow.variable} ${heebo.variable} h-full`}>
      <body className="min-h-full bg-surface font-sans antialiased pb-24 lg:pb-0 lg:flex lg:h-screen lg:overflow-hidden lg:gap-0">
        <Sidebar />
        <div className="lg:flex-1 lg:overflow-y-auto lg:min-w-0">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
