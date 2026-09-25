"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import type { Entrega, StatusEntrega } from "@/lib/storage/types"

const STATUS_BADGE: Record<StatusEntrega, { bg: string; text: string; dot: string; label: string }> = {
  CRIADA:      { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Pendente"   },
  COLETADA:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400",    label: "Coletada"   },
  EM_TRANSITO: { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-400",  label: "Em rota"    },
  ENTREGUE:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Entregue"   },
  CANCELADA:   { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400",     label: "Cancelada"  },
}

const FILTERS: { label: string; value: StatusEntrega | "TODOS" }[] = [
  { label: "Todos",      value: "TODOS"       },
  { label: "Pendentes",  value: "CRIADA"      },
  { label: "Em rota",    value: "EM_TRANSITO" },
  { label: "Entregues",  value: "ENTREGUE"    },
  { label: "Canceladas", value: "CANCELADA"   },
]

function shortDate(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1)
  if (d.toDateString() === hoje.toDateString()) return "Hoje"
  if (d.toDateString() === ontem.toDateString()) return "Ontem"
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function localidade(e: Entrega) {
  if (e.enderecoEntrega) {
    const parts = e.enderecoEntrega.split(",").map((s) => s.trim())
    const cidade = parts.find((p) => p.length > 0 && !/^\d/.test(p) && p.length < 40)
    if (cidade) return cidade
  }
  return `CEP ${e.cepEntrega}`
}

export default function EntregaTable({
  entregas,
  onSelect,
}: {
  entregas: Entrega[]
  onSelect: (e: Entrega) => void
}) {
  const [filtro, setFiltro] = useState<StatusEntrega | "TODOS">("TODOS")
  const [busca, setBusca] = useState("")
  const [buscaAberta, setBuscaAberta] = useState(false)

  const porStatus = filtro === "TODOS" ? entregas : entregas.filter((e) => e.status === filtro)
  const lista = busca.trim()
    ? porStatus.filter((e) =>
        e.nomeDestinatario.toLowerCase().includes(busca.toLowerCase()) ||
        (e.numeroColeta && String(e.numeroColeta).includes(busca))
      )
    : porStatus

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
      {/* toolbar: filtros + busca */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          {FILTERS.map((f) => {
            const count = f.value === "TODOS"
              ? entregas.length
              : entregas.filter((e) => e.status === f.value).length
            const ativo = filtro === f.value
            const badge = f.value !== "TODOS" ? STATUS_BADGE[f.value as StatusEntrega] : null
            return (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  ativo
                    ? "bg-gray-100 text-ink font-semibold"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 font-medium"
                }`}
              >
                {badge && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />}
                {f.label}
                <span className={`text-xs tabular-nums ${ativo ? "text-gray-500" : "text-gray-300"}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* busca */}
        <div className={`flex items-center gap-2 transition-all duration-200 ${buscaAberta ? "w-52" : "w-8"}`}>
          {buscaAberta && (
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onBlur={() => { if (!busca) setBuscaAberta(false) }}
              placeholder="Destinatário ou coleta…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            />
          )}
          {!buscaAberta && (
            <button
              onClick={() => setBuscaAberta(true)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Search strokeWidth={1.5} className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Destinatário</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Coleta SSW</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                  {busca ? "Nenhum resultado para esta busca" : `Nenhuma entrega${filtro !== "TODOS" ? " neste status" : ""}`}
                </td>
              </tr>
            )}
            {lista.map((e) => {
              const badge = STATUS_BADGE[e.status]
              return (
                <tr
                  key={e.id}
                  onClick={() => onSelect(e)}
                  className="group hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  {/* destinatário */}
                  <td className="px-5 py-4 max-w-[300px]">
                    <p className="font-semibold text-ink truncate leading-tight">{e.nomeDestinatario}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5 leading-tight">{localidade(e)}</p>
                  </td>

                  {/* status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </td>

                  {/* coleta SSW */}
                  <td className="px-5 py-4">
                    {e.numeroColeta
                      ? <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">#{e.numeroColeta}</span>
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>

                  {/* data */}
                  <td className="px-5 py-4 text-right text-xs text-gray-400 whitespace-nowrap tabular-nums group-hover:text-gray-600">
                    {shortDate(e.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {lista.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
          {lista.length} {lista.length === 1 ? "entrega" : "entregas"}
        </div>
      )}
    </div>
  )
}
