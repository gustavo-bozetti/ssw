"use client"

import { useState } from "react"
import Link from "next/link"

interface CotacaoResult {
  erro: number
  mensagem: string
  frete: number | null
  prazo: number | null
  diasUteis: number | null
  dataPrevisao: string | null
  numeroCotacao: string | null
  bloqueado: boolean
}

function formatDataPrevisao(s: string | null): string {
  if (!s || s.length < 8) return ""
  // "DDMMAAAA" → "DD/MM/AAAA"
  return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4)}`
}

export default function CotacaoForm() {
  const [result, setResult] = useState<CotacaoResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setResult(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string | null)?.trim() || undefined

    const body = {
      cnpjPagador: get("cnpjPagador"),
      cepOrigem: get("cepOrigem"),
      cepDestino: get("cepDestino"),
      valorNF: get("valorNF"),
      quantidade: get("quantidade") ?? "1",
      peso: get("peso"),
      volume: get("volume"),
      cnpjRemetente: get("cnpjRemetente"),
      cnpjDestinatario: get("cnpjDestinatario"),
    }

    try {
      const res = await fetch("/api/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? "Erro na cotação"); return }
      setResult(data)
    } catch {
      setErro("Falha na conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/entregas" className="text-gray-500 text-sm">← Voltar</Link>
          <h1 className="text-lg font-semibold text-gray-900">Simular Frete</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg lg:max-w-none mx-auto px-4 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-5 lg:space-y-0">
          {/* left: inputs */}
          <div className="space-y-5">
            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <p className="font-medium text-gray-800">Origem e destino</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CEP origem *" name="cepOrigem" placeholder="00000000" inputMode="numeric" maxLength={9} required />
                <Field label="CEP destino *" name="cepDestino" placeholder="00000000" inputMode="numeric" maxLength={9} required />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <p className="font-medium text-gray-800">Carga</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Peso (kg)" name="peso" type="number" placeholder="0.0" inputMode="decimal" step="0.1" />
                <Field label="Volume (m³)" name="volume" type="number" placeholder="0.0000" inputMode="decimal" step="0.0001" />
              </div>
              <p className="text-xs text-gray-400">Informe pelo menos peso ou volume</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantidade *" name="quantidade" type="number" placeholder="1" inputMode="numeric" min="1" required defaultValue="1" />
                <Field label="Valor NF (R$) *" name="valorNF" type="number" placeholder="0,00" inputMode="decimal" step="0.01" required />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <p className="font-medium text-gray-800">Pagador</p>
              <Field label="CNPJ do pagador *" name="cnpjPagador" placeholder="00.000.000/0001-00" inputMode="numeric" required />
              <Field label="CNPJ remetente" name="cnpjRemetente" placeholder="Opcional" inputMode="numeric" />
              <Field label="CNPJ destinatário" name="cnpjDestinatario" placeholder="Opcional" inputMode="numeric" />
            </section>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{erro}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 active:bg-blue-700"
            >
              {loading ? "Calculando…" : "Calcular Frete"}
            </button>
          </div>

          {/* right: result */}
          <div className="space-y-5">
        {/* resultado */}
        {result && result.frete !== null && (
          <div className="bg-white rounded-xl border-2 border-blue-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Resultado</p>

            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {result.frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">valor do frete</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-gray-800">{result.diasUteis ?? result.prazo} dia{(result.diasUteis ?? result.prazo ?? 0) > 1 ? "s" : ""}</p>
                <p className="text-sm text-gray-500">úteis</p>
              </div>
            </div>

            {result.dataPrevisao && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800 mb-3">
                📅 Previsão de entrega: <strong>{formatDataPrevisao(result.dataPrevisao)}</strong>
              </div>
            )}

            {result.mensagem && result.erro !== 0 && (
              <p className="text-xs text-amber-600">{result.mensagem}</p>
            )}

            {result.numeroCotacao && (
              <p className="text-xs text-gray-400 mt-2">Cotação nº {result.numeroCotacao}</p>
            )}

            <Link
              href={`/entregas/nova`}
              className="mt-4 block text-center bg-blue-600 text-white text-sm font-medium py-3 rounded-xl"
            >
              Criar entrega com este frete →
            </Link>
          </div>
        )}

        {result && result.frete === null && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {result.mensagem || "Não foi possível calcular o frete para este trecho."}
          </div>
        )}
          </div>
          {/* end right col */}
        </div>
        {/* end grid */}
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        name={name}
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
