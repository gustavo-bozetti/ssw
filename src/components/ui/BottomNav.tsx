"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Package, Plus, Search, MoreHorizontal, Calculator, FileText, FileCheck, MapPin, ScrollText } from "lucide-react"
import BottomSheet from "./BottomSheet"

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [maisOpen, setMaisOpen] = useState(false)

  const isEntregas = pathname === "/" || pathname.startsWith("/entregas")
  const isBuscar = pathname.startsWith("/consultas")
  const isMais = ["/cotacao", "/notfis", "/cte"].some((p) => pathname.startsWith(p))

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#2D3940] safe-area-pb">
        <div className="max-w-lg mx-auto flex items-end justify-around px-2 pt-2 pb-3">
          <NavTab href="/entregas" active={isEntregas} icon={<Package strokeWidth={1.5} className="w-6 h-6" />} label="Entregas" />

          <button
            onClick={() => router.push("/entregas/nova")}
            className="flex flex-col items-center -mt-4 mb-1"
            aria-label="Nova entrega"
          >
            <span className="w-12 h-12 rounded-full bg-[#FF6900] flex items-center justify-center shadow-md shadow-orange-400/30 active:scale-95 transition-transform">
              <Plus strokeWidth={2.5} className="w-6 h-6 text-white" />
            </span>
            <span className="text-[10px] text-white/70 mt-1">Nova</span>
          </button>

          <NavTab href="/consultas" active={isBuscar} icon={<Search strokeWidth={1.5} className="w-6 h-6" />} label="Buscar" />

          <button
            onClick={() => setMaisOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 px-3 min-w-[56px] ${isMais ? "text-white" : "text-white/50"}`}
          >
            <MoreHorizontal strokeWidth={1.5} className="w-6 h-6" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>

      <BottomSheet open={maisOpen} onClose={() => setMaisOpen(false)}>
        <p className="text-sm font-semibold text-[#2D3940] mb-4">Ferramentas</p>
        <div className="space-y-1">
          <SheetLink href="/cotacao"   Icon={Calculator}  label="Simular frete"        desc="Calcule o custo antes de criar"         onClose={() => setMaisOpen(false)} />
          <SheetLink href="/notfis"    Icon={FileText}    label="Enviar NF"             desc="Transmitir nota fiscal para SSW"        onClose={() => setMaisOpen(false)} />
          <SheetLink href="/cte"       Icon={FileCheck}   label="Enviar CT-e"           desc="Transmitir conhecimento de transporte"  onClose={() => setMaisOpen(false)} />
          <SheetLink href="/consultas" Icon={MapPin}      label="Consultar entrega"     desc="Por destinatário, pagador ou CPF"       onClose={() => setMaisOpen(false)} />
          <SheetLink href="/logs"      Icon={ScrollText}  label="Logs SSW"              desc="Histórico de chamadas e erros"          onClose={() => setMaisOpen(false)} />
        </div>
      </BottomSheet>
    </>
  )
}

function NavTab({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 py-1 px-3 min-w-[56px] transition-colors ${active ? "text-white" : "text-white/50"}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

function SheetLink({ href, Icon, label, desc, onClose }: { href: string; Icon: React.ElementType; label: string; desc: string; onClose: () => void }) {
  const router = useRouter()
  return (
    <button
      onClick={() => { onClose(); router.push(href) }}
      className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-gray-50 text-left"
    >
      <span className="w-10 h-10 rounded-xl bg-[#F3F3F3] flex items-center justify-center shrink-0">
        <Icon strokeWidth={1.5} className="w-5 h-5 text-[#2EA3F2]" />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#1F1F1F]">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </button>
  )
}
