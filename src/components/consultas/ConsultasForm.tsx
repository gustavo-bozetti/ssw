"use client"

import { useState } from "react"

type Tab = "pf" | "dest" | "pag"

interface TrackingResult {
  success?: boolean
  message?: string
  eventos?: Array<{ data?: string; hora?: string; ocorrencia?: string; descricao?: string; cidade?: string; uf?: string }>
  [key: string]: unknown
}

export default function ConsultasForm() {
  const [tab, setTab] = useState<Tab>("dest")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // PF fields
  const [cpf, setCpf] = useState("")
  // shared identifier
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Consultar Entregas</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* tabs */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setResult(null); setError(null) }}
              className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-colors ${
                tab === t.id ? "bg-blue-600 text-white" : "text-gray-600 active:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {tab === "pf" ? (
            <div>
              <label className="block text-sm text-gray-600 mb-1">CPF *</label>
              <input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">CNPJ *</label>
                <input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Senha (se requerida)</label>
                <input
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-1">Identificador (ao menos um)</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nº Coleta</label>
              <input
                value={nroColeta}
                onChange={(e) => setNroColeta(e.target.value)}
                placeholder="83991"
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nº NF</label>
              <input
                value={nroNf}
                onChange={(e) => setNroNf(e.target.value)}
                placeholder="130516"
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Pedido</label>
            <input
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              placeholder="A2341232B"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Chave NF-e</label>
            <input
              value={chaveNfe}
              onChange={(e) => setChaveNfe(e.target.value)}
              placeholder="44 dígitos"
              maxLength={44}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={consultar}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50 active:bg-blue-700"
          >
            {loading ? "Consultando…" : "Consultar"}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className={`text-sm font-medium mb-3 ${result.success === false ? "text-red-600" : "text-green-700"}`}>
              {result.message ?? (result.success ? "Consulta realizada" : "Sem resultado")}
            </p>

            {Array.isArray(result.eventos) && result.eventos.length > 0 && (
              <ol className="space-y-3">
                {result.eventos.map((ev, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      {i < (result.eventos?.length ?? 0) - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-800">{ev.ocorrencia ?? ev.descricao}</p>
                      {ev.descricao && ev.ocorrencia && <p className="text-xs text-gray-500">{ev.descricao}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[ev.data, ev.hora, ev.cidade, ev.uf].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {!Array.isArray(result.eventos) && result.success !== false && (
              <pre className="text-xs text-gray-600 overflow-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
