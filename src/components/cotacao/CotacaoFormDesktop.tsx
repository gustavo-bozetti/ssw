"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calculator, ChevronLeft } from "lucide-react"
import ResizablePanels from "@/components/ui/ResizablePanels"
import { maskCEP, maskCNPJ, onlyDigitsKey } from "@/lib/mask"

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
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface focus:bg-white transition-colors"
      />
    </div>
  )
}

export default function CotacaoFormDesktop() {
  const router = useRouter()
  const [result, setResult] = useState<CotacaoResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [cepOrigem, setCepOrigem] = useState("")
  const [cepDestino, setCepDestino] = useState("")
  const [cnpjPagador, setCnpjPagador] = useState("")
  const [cnpjRemetente, setCnpjRemetente] = useState("")
  const [cnpjDestinatario, setCnpjDestinatario] = useState("")

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
    <div className="flex flex-col h-full bg-surface">
      {/* header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">Ferramentas</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-ink">Simular Frete</span>
        </div>
      </header>

      {/* body */}
      <ResizablePanels
        defaultWidth={640}
        minWidth={400}
        maxWidth={860}
        left={
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Origem e destino</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CEP origem *" name="cepOrigem" placeholder="00000-000" inputMode="numeric" maxLength={9} required value={cepOrigem} onChange={(e) => setCepOrigem(maskCEP(e.target.value))} onKeyDown={onlyDigitsKey} />
                <Field label="CEP destino *" name="cepDestino" placeholder="00000-000" inputMode="numeric" maxLength={9} required value={cepDestino} onChange={(e) => setCepDestino(maskCEP(e.target.value))} onKeyDown={onlyDigitsKey} />
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
                <Field label="CNPJ do pagador *" name="cnpjPagador" placeholder="00.000.000/0001-00" inputMode="numeric" required value={cnpjPagador} onChange={(e) => setCnpjPagador(maskCNPJ(e.target.value))} />
                <Field label="CNPJ remetente" name="cnpjRemetente" placeholder="00.000.000/0001-00" inputMode="numeric" value={cnpjRemetente} onChange={(e) => setCnpjRemetente(maskCNPJ(e.target.value))} />
                <Field label="CNPJ destinatário" name="cnpjDestinatario" placeholder="00.000.000/0001-00" inputMode="numeric" value={cnpjDestinatario} onChange={(e) => setCnpjDestinatario(maskCNPJ(e.target.value))} />
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{erro}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-primary-dark transition-colors"
            >
              {loading ? "Calculando…" : "Calcular Frete"}
            </button>
          </form>
        }
        right={
          <div className="flex flex-col h-full p-6 gap-4">
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <Calculator strokeWidth={1} className="w-12 h-12 text-gray-200" />
                <p className="text-sm text-gray-400">Preencha o formulário e clique em<br />Calcular Frete</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Calculando…</p>
              </div>
            )}

            {result && result.frete !== null && (
              <>
                {/* valor principal */}
                <div className="bg-ink rounded-2xl p-5 text-white">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Frete estimado</p>
                  <p className="text-4xl font-bold tabular-nums leading-none">
                    R$ {result.frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* prazo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Prazo</p>
                    <p className="text-3xl font-bold text-primary tabular-nums leading-none">{result.diasUteis ?? result.prazo}</p>
                    <p className="text-xs text-gray-400 mt-1">dias úteis</p>
                  </div>
                  {result.dataPrevisao && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                      <p className="text-xs text-gray-400 mb-1">Previsão</p>
                      <p className="text-xl font-bold text-ink tabular-nums leading-none">{formatDataPrevisao(result.dataPrevisao)}</p>
                      <p className="text-xs text-gray-400 mt-1">entrega</p>
                    </div>
                  )}
                </div>

                {result.mensagem && result.erro !== 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                    {result.mensagem}
                  </div>
                )}

                <Link
                  href="/entregas/nova"
                  className="bg-[#FF6900] text-white font-semibold px-5 py-3 rounded-xl hover:bg-orange-600 transition-colors text-sm text-center"
                >
                  Criar entrega com este frete →
                </Link>

                {result.numeroCotacao && (
                  <p className="text-xs text-gray-400 text-center">Cotação nº {result.numeroCotacao}</p>
                )}
              </>
            )}

            {result && result.frete === null && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <p className="text-sm text-red-700 font-medium">{result.mensagem || "Não foi possível calcular o frete para este trecho."}</p>
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}
