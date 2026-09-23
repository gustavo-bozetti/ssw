"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Plus, Search, Calculator, FileText, FileCheck, MapPin, ScrollText, Truck } from "lucide-react"

const NAV = [
  { href: "/entregas",      icon: Package,     label: "Entregas" },
  { href: "/entregas/nova", icon: Plus,        label: "Nova Entrega" },
  { href: "/consultas",     icon: Search,      label: "Buscar" },
]
const TOOLS = [
  { href: "/cotacao",   icon: Calculator, label: "Simular Frete" },
  { href: "/notfis",    icon: FileText,   label: "Enviar NF" },
  { href: "/cte",       icon: FileCheck,  label: "Enviar CT-e" },
  { href: "/consultas", icon: MapPin,     label: "Consultar" },
  { href: "/logs",      icon: ScrollText, label: "Logs SSW" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const active = (href: string) =>
    href === "/entregas"
      ? pathname === "/" || (pathname.startsWith("/entregas") && !pathname.startsWith("/entregas/nova"))
      : pathname.startsWith(href)

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[#2D3940] shrink-0 fixed left-0 top-0 bottom-0 z-30">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Truck strokeWidth={1} className="w-5 h-5 text-[#2EA3F2] mb-2" />
        <p className="text-white font-bold text-base leading-tight">Logística</p>
        <p className="text-white/40 text-xs mt-0.5">LE Serviços</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 space-y-5 px-3">
        <Group label="">
          {NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} Icon={Icon} label={label} active={active(href)} />
          ))}
        </Group>
        <Group label="Ferramentas">
          {TOOLS.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} Icon={Icon} label={label} active={active(href)} />
          ))}
        </Group>
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-white/30 text-xs">SSW Logística</p>
      </div>
    </aside>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">{label}</p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavItem({
  href,
  Icon,
  label,
  active,
}: {
  href: string
  Icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-white/[0.12] ring-1 ring-white/10 text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white/90"
      }`}
    >
      <Icon strokeWidth={1.5} className="w-[18px] h-[18px] shrink-0" />
      {label}
    </Link>
  )
}
