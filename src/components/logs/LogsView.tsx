"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Trash2, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { LogEntry } from "@/lib/ssw/resilience"

const LEVEL_STYLE: Record<string, string> = {
  info:  "bg-blue-50 text-blue-700 border-blue-100",
  warn:  "bg-amber-50 text-amber-700 border-amber-100",
  error: "bg-red-50 text-red-700 border-red-100",
}

const LEVEL_DOT: Record<string, string> = {
  info:  "bg-blue-400",
  warn:  "bg-amber-400",
  error: "bg-red-500",
}

type Filter = "all" | "info" | "warn" | "error"

export default function LogsView() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter === "all" ? "/api/ssw/logs" : `/api/ssw/logs?level=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      setLogs(data.logs ?? [])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function clearLogs() {
    await fetch("/api/ssw/logs", { method: "DELETE" })
    setLogs([])
  }

  function formatTs(ts: string) {
    const d = new Date(ts)
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  function extraFields(entry: LogEntry) {
    const { ts, level, endpoint, message, ...rest } = entry
    return Object.entries(rest)
  }

  const counts = logs.reduce(
    (acc, l) => { acc[l.level] = (acc[l.level] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )

  return (
    <div className="min-h-screen bg-[#F3F3F3] pb-24">
      {/* header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 p-1">
            <ChevronLeft strokeWidth={1.5} className="w-6 h-6" />
          </button>
          <h1 className="text-base font-bold text-[#1F1F1F] flex-1">Logs SSW</h1>
          <button
            onClick={clearLogs}
            className="text-gray-400 p-1 active:text-red-500"
            title="Limpar logs"
          >
            <Trash2 strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="text-[#2EA3F2] p-1 disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw strokeWidth={1.5} className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* filtros */}
        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2">
          {(["all", "error", "warn", "info"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filter === f
                  ? f === "error" ? "bg-red-500 text-white border-red-500"
                  : f === "warn"  ? "bg-amber-400 text-white border-amber-400"
                  : f === "info"  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-[#2D3940] text-white border-[#2D3940]"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {f === "all" ? `Todos${logs.length ? ` (${logs.length})` : ""}` : `${f}${counts[f] ? ` (${counts[f]})` : ""}`}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-3 space-y-2">
        {logs.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            {loading ? "Carregando…" : "Nenhum log registrado ainda"}
          </div>
        )}

        {logs.map((entry, i) => {
          const extras = extraFields(entry)
          const isOpen = expanded === i
          return (
            <div
              key={i}
              className={`rounded-2xl border p-3 ${LEVEL_STYLE[entry.level] ?? "bg-white border-gray-100"}`}
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${LEVEL_DOT[entry.level]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold truncate">{entry.endpoint}</span>
                    <span className="text-xs opacity-60 shrink-0">{formatTs(entry.ts)}</span>
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed">{entry.message}</p>
                  {extras.length > 0 && isOpen && (
                    <dl className="mt-2 space-y-0.5 border-t border-current/20 pt-2">
                      {extras.map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <dt className="opacity-60 shrink-0">{k}</dt>
                          <dd className="font-mono break-all">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {extras.length > 0 && !isOpen && (
                    <p className="text-xs opacity-40 mt-0.5">toque para detalhes</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
