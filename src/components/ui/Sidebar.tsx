"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Plus, Search, Calculator, FileText, FileCheck, MapPin, ScrollText, Truck, BarChart2, ChevronRight, Receipt } from "lucide-react"

const NAV = [
  { href: "/entregas",      icon: Package,   label: "Entregas"     },
  { href: "/entregas/nova", icon: Plus,      label: "Nova Entrega" },
  { href: "/faturas",       icon: Receipt,   label: "Faturas"      },
  { href: "/relatorio",     icon: BarChart2, label: "Relatório"    },
  { href: "/consultas",     icon: Search,    label: "Buscar"       },
]

type Tool =
  | { href: string; icon: React.ElementType; label: string }
  | { icon: React.ElementType; label: string; items: { href: string; icon: React.ElementType; label: string }[] }

const TOOLS: Tool[] = [
  { href: "/cotacao",   icon: Calculator, label: "Simular Frete" },
  {
    icon: FileText,
    label: "Enviar Documento",
    items: [
      { href: "/notfis", icon: FileText,  label: "Enviar NF"    },
      { href: "/cte",    icon: FileCheck, label: "Enviar CT-e"  },
    ],
  },
  { href: "/consultas", icon: MapPin,     label: "Consultar"    },
  { href: "/logs",      icon: ScrollText, label: "Logs SSW"     },
]

export default function Sidebar() {
  const pathname = usePathname()
  const active = (href: string) =>
    href === "/entregas"
      ? pathname === "/" || (pathname.startsWith("/entregas") && !pathname.startsWith("/entregas/nova"))
      : pathname.startsWith(href)

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-navy shrink-0 sticky top-0 h-screen z-30">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Truck strokeWidth={1} className="w-5 h-5 text-orange mb-2" />
        <p className="text-white font-bold text-base leading-tight">Logística</p>
        <p className="text-white/40 text-xs mt-0.5">LE Serviços</p>
      </div>

      <nav className="flex-1 py-3 space-y-5 px-3">
        <Group label="">
          {NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} Icon={Icon} label={label} active={active(href)} />
          ))}
        </Group>
        <Group label="Ferramentas">
          {TOOLS.map((item) =>
            "items" in item ? (
              <ExpandItem
                key={item.label}
                Icon={item.icon}
                label={item.label}
                items={item.items}
                anyActive={item.items.some((c) => active(c.href))}
                active={active}
              />
            ) : (
              <NavItem key={item.href} href={item.href} Icon={item.icon} label={item.label} active={active(item.href)} />
            )
          )}
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

function NavItem({ href, Icon, label, active }: {
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
          ? "bg-orange/10 ring-1 ring-orange/20 text-orange"
          : "text-white/50"
      }`}
    >
      <Icon strokeWidth={1.5} className="w-[18px] h-[18px] shrink-0" />
      {label}
    </Link>
  )
}

function ExpandItem({ Icon, label, items, anyActive, active }: {
  Icon: React.ElementType
  label: string
  items: { href: string; icon: React.ElementType; label: string }[]
  anyActive: boolean
  active: (href: string) => boolean
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const open = pos !== null

  const abrir = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const alturaEstimada = items.length * 40 + 12
    setPos({
      top: Math.min(r.top, window.innerHeight - alturaEstimada - 12),
      left: r.right + 8,
    })
  }

  useEffect(() => {
    if (!open) return
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (!boxRef.current?.contains(alvo) && !btnRef.current?.contains(alvo)) setPos(null)
    }
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setPos(null) }
    const fechar = () => setPos(null)

    document.addEventListener("mousedown", fora)
    document.addEventListener("keydown", tecla)
    window.addEventListener("resize", fechar)
    return () => {
      document.removeEventListener("mousedown", fora)
      document.removeEventListener("keydown", tecla)
      window.removeEventListener("resize", fechar)
    }
  }, [open])

  return (
    <div>
      <button
        ref={btnRef}
        onClick={() => (open ? setPos(null) : abrir())}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          anyActive || open
            ? "bg-orange/10 ring-1 ring-orange/20 text-orange"
            : "text-white/50"
        }`}
      >
        <Icon strokeWidth={1.5} className="w-[18px] h-[18px] shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5 opacity-40 shrink-0" />
      </button>

      {pos && (
        <div
          ref={boxRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-48 p-1.5 rounded-xl bg-navy border border-white/[0.08] shadow-xl shadow-black/40"
        >
          {items.map(({ href, icon: CIcon, label: clabel }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setPos(null)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active(href) ? "text-orange" : "text-white/60 hover:text-white"
              }`}
            >
              <CIcon strokeWidth={1.5} className="w-[16px] h-[16px] shrink-0" />
              {clabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
