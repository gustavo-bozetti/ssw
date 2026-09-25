"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, ExternalLink, Search, TrendingUp, Clock, AlertCircle } from "lucide-react"
import { linkServico } from "@/lib/ssw/links"

const linkReemissao = linkServico("reemissaoFatura")

type FaturaStatus = "EMITIDA" | "LIQUIDADA" | "CANCELADA"

interface Fatura {
  id: string
  numeroFatura: number
  nomeDevedor?: string | null
  cnpjDevedor?: string | null
  dataEmissao?: string | null
  dataVencimento?: string | null
  dataLiquidacao?: string | null
  valorTotal: number
  urlImpressao?: string | null
  status: FaturaStatus
  ctrc: { numero?: number | null }[]
  nfs:  { numero?: number | null }[]
}

const STATUS_BADGE: Record<FaturaStatus, { bg: string; text: string; dot: string; label: string }> = {
  EMITIDA:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Em aberto"  },
  LIQUIDADA: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Liquidada"  },
  CANCELADA: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     label: "Cancelada"  },
}

const FILTERS: { label: string; value: FaturaStatus | "TODAS" }[] = [
  { label: "Todas",      value: "TODAS"     },
  { label: "Em aberto",  value: "EMITIDA"   },
  { label: "Liquidadas", value: "LIQUIDADA" },
  { label: "Canceladas", value: "CANCELADA" },
]

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function isVencida(f: Fatura) {
  if (f.status !== "EMITIDA" || !f.dataVencimento) return false
  return new Date(f.dataVencimento) < new Date()
}

export default function FaturasDesktop() {
  const [faturas, setFaturas]         = useState<Fatura[]>([])
  const [loading, setLoading]         = useState(true)
  const [filtro, setFiltro]           = useState<FaturaStatus | "TODAS">("TODAS")
  const [busca, setBusca]             = useState("")
  const [buscaAberta, setBuscaAberta] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const res  = await fetch("/api/faturas")
      const data = await res.json()
      setFaturas(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const porStatus = filtro === "TODAS" ? faturas : faturas.filter((f) => f.status === filtro)
  const lista = busca.trim()
    ? porStatus.filter((f) =>
        f.nomeDevedor?.toLowerCase().includes(busca.toLowerCase()) ||
        String(f.numeroFatura).includes(busca) ||
        f.cnpjDevedor?.includes(busca)
      )
    : porStatus

  const totalAberto    = faturas.filter((f) => f.status === "EMITIDA").reduce((s, f) => s + f.valorTotal, 0)
  const totalLiquidado = faturas.filter((f) => f.status === "LIQUIDADA").reduce((s, f) => s + f.valorTotal, 0)
  const qtdVencidas    = faturas.filter(isVencida).length

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Faturas</span>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-8 py-6 flex flex-col gap-5">

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock strokeWidth={1.5} className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none mb-1.5">A receber</p>
              <p className="text-2xl font-bold text-ink tabular-nums leading-none">{fmtBRL(totalAberto)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp strokeWidth={1.5} className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Liquidado</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums leading-none">{fmtBRL(totalLiquidado)}</p>
            </div>
          </div>

          <div className={`rounded-2xl border px-6 py-5 flex items-center gap-4 ${qtdVencidas > 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-100"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${qtdVencidas > 0 ? "bg-red-100" : "bg-gray-50"}`}>
              <AlertCircle strokeWidth={1.5} className={`w-5 h-5 ${qtdVencidas > 0 ? "text-red-500" : "text-gray-300"}`} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Vencidas</p>
              <p className={`text-2xl font-bold tabular-nums leading-none ${qtdVencidas > 0 ? "text-red-600" : "text-gray-300"}`}>
                {qtdVencidas}
              </p>
            </div>
          </div>
        </div>

        {/* tabela */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Carregando faturas…</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
            {/* toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-0.5 flex-1">
                {FILTERS.map((f) => {
                  const count = f.value === "TODAS"
                    ? faturas.length
                    : faturas.filter((x) => x.status === f.value).length
                  const ativo = filtro === f.value
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
                      {f.value !== "TODAS" && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_BADGE[f.value as FaturaStatus].dot}`} />
                      )}
                      {f.label}
                      <span className={`text-xs tabular-nums ${ativo ? "text-gray-500" : "text-gray-300"}`}>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className={`flex items-center transition-all duration-200 ${buscaAberta ? "w-60" : "w-8"}`}>
                {buscaAberta ? (
                  <input
                    autoFocus
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onBlur={() => { if (!busca) setBuscaAberta(false) }}
                    placeholder="Devedor, CNPJ ou nº…"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
                  />
                ) : (
                  <button
                    onClick={() => setBuscaAberta(true)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <Search strokeWidth={1.5} className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* tabela */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[120px]" />
                  <col />
                  <col className="w-[110px]" />
                  <col className="w-[140px]" />
                  <col className="w-[140px]" />
                  <col className="w-[130px]" />
                  <col className="w-[110px]" />
                </colgroup>
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nº Fatura</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Devedor</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Emissão</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Vencimento</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Boleto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lista.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <FileText strokeWidth={1} className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">
                          {busca ? "Nenhuma fatura encontrada" : "Nenhuma fatura neste filtro"}
                        </p>
                      </td>
                    </tr>
                  )}
                  {lista.map((f) => {
                    const badge    = STATUS_BADGE[f.status]
                    const atrasada = isVencida(f)
                    return (
                      <tr key={f.id} className="group hover:bg-surface-hover transition-colors">
                        {/* nº fatura */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-gray-50 border border-gray-100 rounded-md px-2 py-1 text-gray-600">
                            #{f.numeroFatura}
                          </span>
                        </td>

                        {/* devedor */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-ink truncate leading-tight">{f.nomeDevedor ?? "—"}</p>
                          {f.cnpjDevedor && (
                            <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">{f.cnpjDevedor}</p>
                          )}
                        </td>

                        {/* emissão */}
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap tabular-nums">
                          {fmtDate(f.dataEmissao)}
                        </td>

                        {/* vencimento */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {atrasada ? (
                            <span className="inline-flex items-center bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums whitespace-nowrap">
                              {fmtDate(f.dataVencimento)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600 tabular-nums">{fmtDate(f.dataVencimento)}</span>
                          )}
                        </td>

                        {/* valor */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className="text-base font-bold text-ink tabular-nums">{fmtBRL(f.valorTotal)}</span>
                        </td>

                        {/* status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* boleto */}
                        <td className="px-5 py-4 text-center">
                          {f.urlImpressao ? (
                            <a
                              href={f.urlImpressao}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir
                            </a>
                          ) : linkReemissao ? (
                            <a
                              href={linkReemissao}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="O link do boleto não veio no webhook ou expirou — reemitir no SSW"
                              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Reemitir
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {lista.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between shrink-0">
                <span>{lista.length} {lista.length === 1 ? "fatura" : "faturas"}</span>
                <span className="font-semibold text-ink tabular-nums">
                  Total: {fmtBRL(lista.reduce((s, f) => s + f.valorTotal, 0))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
