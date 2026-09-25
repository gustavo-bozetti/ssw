"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Search } from "lucide-react"
import ResizablePanels from "@/components/ui/ResizablePanels"
import { maskCPF, maskCNPJ, onlyDigitsKey, validarCPF } from "@/lib/mask"

type Tab = "pf" | "dest" | "pag"

interface TrackingEvento {
  data?: string
  hora?: string
  ocorrencia?: string
  descricao?: string
  cidade?: string
  uf?: string
}

interface TrackingResult {
  success?: boolean
  message?: string
  eventos?: TrackingEvento[]
  [key: string]: unknown
}

function InputField({ label, value, onChange, ...props }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={onChange}
        {...props}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface focus:bg-white transition-colors"
      />
    </div>
  )
}

const IGNORED_RESULT_KEYS = new Set(["success", "message", "eventos"])

export default function ConsultasFormDesktop() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("dest")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [cpf, setCpf] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [senha, setSenha] = useState("")
  const [nroNf, setNroNf] = useState("")
  const [pedido, setPedido] = useState("")
  const [chaveNfe, setChaveNfe] = useState("")
  const [nroColeta, setNroColeta] = useState("")

  async function consultar() {
    setLoading(true)
    setResult(null)
    setError(null)

    let endpoint = ""
    let body: Record<string, unknown> = {}

    if (tab === "pf") {
      if (!validarCPF(cpf)) { setError("CPF inválido"); setLoading(false); return }
      endpoint = "/api/trackingpf"
      body = { cpf: cpf.replace(/\D/g, "") }
      if (nroNf) body.nro_nf = parseInt(nroNf)
      if (pedido) body.pedido = pedido
      if (chaveNfe) body.chave_nfe = chaveNfe
    } else {
      endpoint = tab === "dest" ? "/api/trackingdest" : "/api/trackingpag"
      body = { cnpj: cnpj.replace(/\D/g, "") }
      if (senha) body.senha = senha
      if (nroNf) body.nro_nf = parseInt(nroNf)
      if (pedido) body.pedido = pedido
      if (chaveNfe) body.chave_nfe = chaveNfe
      if (nroColeta) body.nro_coleta = parseInt(nroColeta)
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error?.formErrors?.[0] ?? data.error ?? "Erro"); return }
      setResult(data)
    } catch {
      setError("Falha na conexão")
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "dest", label: "Por Destinatário" },
    { id: "pag", label: "Por Pagador" },
    { id: "pf", label: "Por CPF (PF)" },
  ]

  const extraKeys = result
    ? Object.entries(result).filter(([k, v]) => !IGNORED_RESULT_KEYS.has(k) && v !== undefined && v !== null && v !== "")
    : []

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">Ferramentas</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-ink">Consultar Entregas</span>
        </div>
      </header>

      <ResizablePanels
        defaultWidth={640}
        minWidth={400}
        maxWidth={860}
        left={
          <div className="p-6 flex flex-col gap-5 h-full">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Tipo de consulta</p>
              <div className="flex gap-2">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setResult(null); setError(null) }}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-center ${
                      tab === t.id ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {tab === "pf" ? (
                <InputField label="CPF *" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" onKeyDown={onlyDigitsKey} />
              ) : (
                <>
                  <InputField label="CNPJ *" value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} placeholder="00.000.000/0001-00" />
                  <InputField label="Senha (se requerida)" value={senha} onChange={(e) => setSenha(e.target.value)} type="password" />
                </>
              )}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-1">Identificador</p>
              <p className="text-xs text-gray-400 -mt-3">Informe ao menos um</p>

              <div className="grid grid-cols-2 gap-3">
                <InputField label="Nº Coleta" value={nroColeta} onChange={(e) => setNroColeta(e.target.value)} placeholder="83991" inputMode="numeric" />
                <InputField label="Nº NF" value={nroNf} onChange={(e) => setNroNf(e.target.value)} placeholder="130516" inputMode="numeric" />
              </div>
              <InputField label="Pedido" value={pedido} onChange={(e) => setPedido(e.target.value)} placeholder="A2341232B" />
              <InputField label="Chave NF-e" value={chaveNfe} onChange={(e) => setChaveNfe(e.target.value)} placeholder="44 dígitos" maxLength={44} />
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

            <button
              onClick={consultar}
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-primary-dark transition-colors mt-auto"
            >
              {loading ? "Consultando…" : "Consultar"}
            </button>
          </div>
        }
        right={
          <div className="p-6">
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
                <Search strokeWidth={1} className="w-12 h-12 text-gray-200" />
                <p className="font-semibold text-gray-500">Nenhuma consulta ainda</p>
                <p className="text-sm text-gray-400">Preencha os filtros e clique em Consultar</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Consultando…</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.message && (
                  <p className={`text-sm font-medium ${result.success === false ? "text-red-600" : "text-emerald-700"}`}>
                    {result.message}
                  </p>
                )}

                {Array.isArray(result.eventos) && result.eventos.length > 0 && (
                  <div className="space-y-0">
                    {result.eventos.map((ev, i) => (
                      <div key={i} className="flex gap-4 pb-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 ring-4 ring-blue-100 shrink-0" />
                          {i < (result.eventos?.length ?? 0) - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="font-semibold text-sm text-ink">{ev.ocorrencia ?? ev.descricao}</p>
                          {ev.descricao && ev.ocorrencia && <p className="text-xs text-gray-500 mt-0.5">{ev.descricao}</p>}
                          <p className="text-xs text-gray-400 mt-1">{[ev.data, ev.hora, ev.cidade, ev.uf].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(result.eventos) && result.eventos.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhum evento encontrado</p>
                )}

                {extraKeys.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-2">
                    {extraKeys.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-400 capitalize shrink-0">{k}</span>
                        <span className="text-ink font-medium text-right break-all">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}
