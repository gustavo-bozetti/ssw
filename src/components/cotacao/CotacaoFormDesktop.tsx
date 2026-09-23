"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calculator, ChevronLeft } from "lucide-react"

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
  return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4)}`
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        name={name}
        {...props}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2EA3F2] bg-[#F5F6FA] focus:bg-white transition-colors"
      />
    </div>
  )
}

export default function CotacaoFormDesktop() {
  const router = useRouter()
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
    <div className="flex flex-col h-full bg-[#F5F6FA]">
      {/* header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">Ferramentas</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-[#1F1F1F]">Simular Frete</span>
        </div>
      </header>

      {/* body */}
      <div className="flex flex-1 min-h-0">
        {/* left panel — form */}
        <div className="w-[400px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Origem e destino</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CEP origem *" name="cepOrigem" placeholder="00000000" inputMode="numeric" maxLength={9} required />
                <Field label="CEP destino *" name="cepDestino" placeholder="00000000" inputMode="numeric" maxLength={9} required />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Carga</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Peso (kg)" name="peso" type="number" placeholder="0.0" inputMode="decimal" step="0.1" />
                  <Field label="Volume (m³)" name="volume" type="number" placeholder="0.0000" inputMode="decimal" step="0.0001" />
                </div>
                <p className="text-xs text-gray-400">Informe pelo menos peso ou volume</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quantidade *" name="quantidade" type="number" placeholder="1" inputMode="numeric" min="1" required defaultValue="1" />
                  <Field label="Valor NF (R$) *" name="valorNF" type="number" placeholder="0,00" inputMode="decimal" step="0.01" required />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Pagador</p>
              <div className="space-y-3">
                <Field label="CNPJ do pagador *" name="cnpjPagador" placeholder="00.000.000/0001-00" inputMode="numeric" required />
                <Field label="CNPJ remetente" name="cnpjRemetente" placeholder="Opcional" inputMode="numeric" />
                <Field label="CNPJ destinatário" name="cnpjDestinatario" placeholder="Opcional" inputMode="numeric" />
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{erro}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2EA3F2] text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              {loading ? "Calculando…" : "Calcular Frete"}
            </button>
          </form>
        </div>

        {/* right panel — result */}
        <div className="flex-1 flex items-center justify-center p-8">
          {!result && !loading && (
            <div className="flex flex-col items-center text-center gap-4 text-gray-400">
              <Calculator strokeWidth={1} className="w-16 h-16 text-gray-200" />
              <div>
                <p className="font-semibold text-gray-500">Simule o frete</p>
                <p className="text-sm mt-1">Preencha os dados e clique em Calcular</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-10 h-10 border-4 border-[#2EA3F2] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Calculando frete…</p>
            </div>
          )}

          {result && result.frete !== null && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Frete estimado</p>
                <p className="text-6xl font-bold text-[#1F1F1F]">
                  R$ {result.frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex gap-10 text-center">
                <div>
                  <p className="text-4xl font-bold text-[#2EA3F2]">{result.diasUteis ?? result.prazo}</p>
                  <p className="text-sm text-gray-400 mt-1">dias úteis</p>
                </div>
                {result.dataPrevisao && (
                  <div>
                    <p className="text-3xl font-semibold text-gray-700">{formatDataPrevisao(result.dataPrevisao)}</p>
                    <p className="text-sm text-gray-400 mt-1">previsão de entrega</p>
                  </div>
                )}
              </div>

              {result.mensagem && result.erro !== 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-5 py-2.5 rounded-xl">{result.mensagem}</p>
              )}

              <Link
                href="/entregas/nova"
                className="bg-[#FF6900] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Criar entrega com este frete →
              </Link>

              {result.numeroCotacao && (
                <p className="text-xs text-gray-400">Cotação nº {result.numeroCotacao}</p>
              )}
            </div>
          )}

          {result && result.frete === null && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-sm">
              <p className="text-red-700 font-medium">{result.mensagem || "Não foi possível calcular o frete para este trecho."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
