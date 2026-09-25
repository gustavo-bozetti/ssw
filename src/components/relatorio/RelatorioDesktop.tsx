"use client"

import { useState, useMemo } from "react"
import { useEntregas } from "@/hooks/useEntregas"
import type { Entrega, StatusEntrega } from "@/lib/storage/types"
import { Download, FileSpreadsheet } from "lucide-react"

const STATUS_LABEL: Record<StatusEntrega, string> = {
  CRIADA:      "Pendente",
  COLETADA:    "Coletada",
  EM_TRANSITO: "Em rota",
  ENTREGUE:    "Entregue",
  CANCELADA:   "Cancelada",
}

const STATUS_BADGE: Record<StatusEntrega, { bg: string; text: string }> = {
  CRIADA:      { bg: "bg-amber-50",   text: "text-amber-700"   },
  COLETADA:    { bg: "bg-blue-50",    text: "text-blue-700"    },
  EM_TRANSITO: { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  ENTREGUE:    { bg: "bg-emerald-50", text: "text-emerald-700" },
  CANCELADA:   { bg: "bg-red-50",     text: "text-red-700"     },
}

type Periodo = "mes_atual" | "mes_anterior" | "semana" | "custom"

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function periodoRange(periodo: Periodo, customInicio: string, customFim: string): [Date, Date] {
  const hoje = new Date()
  if (periodo === "semana") {
    const seg = startOfDay(hoje)
    seg.setDate(hoje.getDate() - hoje.getDay() + (hoje.getDay() === 0 ? -6 : 1))
    const dom = new Date(seg); dom.setDate(seg.getDate() + 6)
    return [seg, dom]
  }
  if (periodo === "mes_atual") {
    return [new Date(hoje.getFullYear(), hoje.getMonth(), 1), new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)]
  }
  if (periodo === "mes_anterior") {
    const y = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear()
    const m = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1
    return [new Date(y, m, 1), new Date(y, m + 1, 0)]
  }
  // custom
  const ini = customInicio ? new Date(customInicio + "T00:00:00") : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fim = customFim    ? new Date(customFim    + "T23:59:59") : hoje
  return [ini, fim]
}

function exportarExcel(entregas: Entrega[], label: string) {
  import("xlsx").then(({ utils, writeFile }) => {
    const rows = entregas.map((e) => ({
      "Data":              fmtDate(e.createdAt),
      "Destinatário":      e.nomeDestinatario,
      "CNPJ/CPF":          e.cnpjDestinatario || e.cpfDestinatario || "",
      "CEP":               e.cepEntrega,
      "Endereço":          e.enderecoEntrega || "",
      "Status":            STATUS_LABEL[e.status],
      "Coleta SSW":        e.numeroColeta || "",
      "Remetente":         e.nomeRemetente || "",
      "CNPJ Remetente":    e.cnpjRemetente || "",
      "Veículo":           e.tipoVeiculo,
      "Peso (kg)":         e.peso,
      "Volumes":           e.quantidade,
      "Valor Mercadoria":  e.valorMercadoria ?? "",
      "Tipo Pagamento":    e.tipoPagamento === "O" ? "CIF (Origem)" : "FOB (Destino)",
      "Chave NF-e":        e.chaveNfe || "",
      "Nº NF":             e.numeroNf || "",
      "Pedido":            e.pedido || "",
      "Solicitante":       e.solicitante,
      "Observação":        e.observacao || "",
    }))

    const ws = utils.json_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Entregas")

    // largura das colunas
    const cols = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length, 14) }))
    ws["!cols"] = cols

    writeFile(wb, `entregas_${label}.xlsx`)
  })
}

export default function RelatorioDesktop() {
  const { entregas, loading } = useEntregas()
  const [periodo, setPeriodo] = useState<Periodo>("mes_atual")
  const [customInicio, setCustomInicio] = useState("")
  const [customFim, setCustomFim] = useState("")

  const [inicio, fim] = periodoRange(periodo, customInicio, customFim)

  const filtradas = useMemo(() =>
    entregas.filter((e) => {
      const d = new Date(e.createdAt)
      return d >= startOfDay(inicio) && d <= fim
    }),
    [entregas, inicio, fim]
  )

  const total     = filtradas.length
  const entregues = filtradas.filter((e) => e.status === "ENTREGUE").length
  const emRota    = filtradas.filter((e) => e.status === "EM_TRANSITO" || e.status === "COLETADA").length
  const pendentes = filtradas.filter((e) => e.status === "CRIADA").length
  const canceladas = filtradas.filter((e) => e.status === "CANCELADA").length
  const taxa      = total > 0 ? Math.round((entregues / total) * 100) : 0

  const labelArquivo = `${inicio.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "_")}`

  const PERIODOS: { value: Periodo; label: string }[] = [
    { value: "semana",        label: "Esta semana"   },
    { value: "mes_atual",     label: "Este mês"      },
    { value: "mes_anterior",  label: "Mês anterior"  },
    { value: "custom",        label: "Personalizado" },
  ]

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Relatório de Entregas</span>
          <button
            onClick={() => exportarExcel(filtradas, labelArquivo)}
            disabled={filtradas.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download strokeWidth={2} className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">
        {/* filtro de período */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest shrink-0">Período</span>
          <div className="flex gap-1.5">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodo === p.value
                    ? "bg-navy text-white"
                    : "text-gray-500 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodo === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customInicio}
                onChange={(e) => setCustomInicio(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                value={customFim}
                onChange={(e) => setCustomFim(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              />
            </div>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {inicio.toLocaleDateString("pt-BR")} – {fim.toLocaleDateString("pt-BR")}
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-6 gap-4">
          <KpiCard label="Total"     value={total}     color="text-ink" />
          <KpiCard label="Entregues" value={entregues} color="text-emerald-600" />
          <KpiCard label="Em rota"   value={emRota}    color="text-indigo-600" />
          <KpiCard label="Pendentes" value={pendentes} color="text-amber-600"  />
          <KpiCard label="Canceladas" value={canceladas} color="text-red-500" />
          <KpiCard label="Taxa entrega" value={`${taxa}%`} color={taxa >= 80 ? "text-emerald-600" : taxa >= 50 ? "text-amber-600" : "text-red-500"} />
        </div>

        {/* tabela */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-3">
            <FileSpreadsheet strokeWidth={1} className="w-12 h-12 text-gray-200" />
            <p className="font-semibold text-gray-400">Nenhuma entrega neste período</p>
          </div>
        )}

        {!loading && filtradas.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Destinatário</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Coleta SSW</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Peso</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Volumes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtradas.map((e) => {
                    const badge = STATUS_BADGE[e.status]
                    return (
                      <tr key={e.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap tabular-nums">{fmtDate(e.createdAt)}</td>
                        <td className="px-5 py-3.5 max-w-[260px]">
                          <p className="font-medium text-ink truncate leading-tight">{e.nomeDestinatario}</p>
                          {e.enderecoEntrega && <p className="text-xs text-gray-400 truncate mt-0.5">{e.enderecoEntrega}</p>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {STATUS_LABEL[e.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {e.numeroColeta
                            ? <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">#{e.numeroColeta}</span>
                            : <span className="text-xs text-gray-300">—</span>
                          }
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-gray-600 tabular-nums whitespace-nowrap">{e.peso} kg</td>
                        <td className="px-5 py-3.5 text-right text-sm text-gray-600 tabular-nums">{e.quantidade}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
              {filtradas.length} {filtradas.length === 1 ? "entrega" : "entregas"} no período
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest leading-none mb-2">{label}</p>
      <p className={`text-2xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
    </div>
  )
}
