import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import BottomNav from "@/components/ui/BottomNav"

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
      <body className="min-h-full bg-[#F3F3F3] font-[family-name:var(--font-geist)] antialiased pb-24">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
