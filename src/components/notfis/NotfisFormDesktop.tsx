"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react"

interface ResultItem {
  sucesso: boolean
  mensagem: string
  notaFiscal: number
  protocolo: string
}

function Field({ label, name, ...props }: { label: string; name?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        name={name}
        {...props}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2EA3F2] bg-white transition-colors"
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
      {children}
    </section>
  )
}

export default function NotfisFormDesktop() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultados, setResultados] = useState<ResultItem[] | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setResultados(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string | null)?.trim() || undefined
    const cep = parseInt((get("cepDest") ?? "").replace(/\D/g, ""), 10)

    const body = {
      cnpjRemetente: get("cnpjRemetente"),
      nomeRemetente: get("nomeRemetente"),
      destinatarios: [{
        cnpj: get("cnpjDest") ?? "",
        nome: get("nomeDest") ?? "",
        telefone: get("telefoneDest"),
        email: get("emailDest"),
        endereco: {
          rua: get("ruaDest") ?? "",
          numero: get("numeroDest") ?? "",
          complemento: get("complementoDest"),
          bairro: get("bairroDest") ?? "",
          cidade: get("cidadeDest") ?? "",
          uf: get("ufDest") ?? "",
          cep: isNaN(cep) ? 0 : cep,
        },
        nf: [{
          tipoNF: get("tipoNF") ?? "NORMAL",
          condicaoFrete: get("condicaoFrete") ?? "CIF",
          numero: parseInt(get("nfNumero") ?? "0", 10),
          serie: get("nfSerie") ?? "1",
          chaveNFe: get("chaveNFe") || undefined,
          dataEmissao: get("dataEmissao") ?? "",
          qtdeVolumes: parseInt(get("qtdeVolumes") ?? "1", 10),
          valorMercadoria: parseFloat(get("valorMercadoria") ?? "0"),
          pesoReal: parseFloat(get("pesoReal") ?? "0"),
          cubagem: get("cubagem") ? parseFloat(get("cubagem")!) : undefined,
          pedido: get("pedido"),
          valorFrete: get("valorFrete") ? parseFloat(get("valorFrete")!) : undefined,
        }],
      }],
    }

    try {
      const res = await fetch("/api/notfis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setErro(typeof data.error === "string" ? data.error : JSON.stringify(data.error)); return }
      setResultados(data)
    } catch {
      setErro("Falha na conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F6FA]">
      {/* header sticky com botão de ação visível */}
      <header className="bg-white border-b border-gray-200 shrink-0 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft strokeWidth={1.5} className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">Ferramentas</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-[#1F1F1F]">Enviar NF-e</span>
          </div>
          <button
            type="submit"
            form="notfis-form"
            disabled={loading}
            className="bg-[#2EA3F2] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {loading ? "Transmitindo…" : "Transmitir NF-e →"}
          </button>
        </div>
      </header>

      {/* conteúdo centrado — coluna única larga */}
      <div className="flex-1 overflow-y-auto py-8">
        <form id="notfis-form" onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 space-y-4">

          <Section title="Remetente">
            <div className="grid grid-cols-2 gap-4">
              <Field label="CNPJ" name="cnpjRemetente" placeholder="00.000.000/0001-00" inputMode="numeric" />
              <Field label="Nome / Razão Social" name="nomeRemetente" placeholder="Empresa de origem" />
            </div>
          </Section>

          <Section title="Destinatário">
            <div className="grid grid-cols-2 gap-4">
              <Field label="CNPJ *" name="cnpjDest" placeholder="00.000.000/0001-00" inputMode="numeric" required />
              <Field label="Nome / Razão Social *" name="nomeDest" placeholder="Cliente destino" required />
              <Field label="Telefone" name="telefoneDest" placeholder="(11) 99999-9999" inputMode="tel" />
              <Field label="E-mail" name="emailDest" type="email" placeholder="email@empresa.com" />
            </div>
            <div className="pt-1 grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Field label="Rua *" name="ruaDest" placeholder="Nome da rua" required />
              </div>
              <Field label="Número *" name="numeroDest" placeholder="100" required />
              <Field label="Complemento" name="complementoDest" placeholder="Apto, sala…" />
              <Field label="Bairro *" name="bairroDest" placeholder="Centro" required />
              <div className="col-span-2">
                <Field label="Cidade *" name="cidadeDest" placeholder="São Paulo" required />
              </div>
              <Field label="UF *" name="ufDest" placeholder="SP" maxLength={2} required />
              <Field label="CEP *" name="cepDest" placeholder="00000-000" inputMode="numeric" required />
            </div>
          </Section>

          <Section title="Nota Fiscal">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo NF</label>
                <select name="tipoNF" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]">
                  <option value="NORMAL">Normal</option>
                  <option value="REVERSA">Reversa</option>
                  <option value="DEVOLUCAO">Devolução</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Condição frete</label>
                <select name="condicaoFrete" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]">
                  <option value="CIF">CIF — remetente paga</option>
                  <option value="FOB">FOB — destinatário paga</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Field label="Número NF *" name="nfNumero" placeholder="000000" inputMode="numeric" required />
              </div>
              <Field label="Série *" name="nfSerie" placeholder="1" required defaultValue="1" />
            </div>
            <Field label="Chave NF-e" name="chaveNFe" placeholder="44 dígitos (opcional)" inputMode="numeric" maxLength={44} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data de emissão * (DD/MM/AAAA)" name="dataEmissao" placeholder="22/09/2026" required />
              <Field label="Nº pedido" name="pedido" placeholder="Opcional" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Volumes *" name="qtdeVolumes" type="number" placeholder="1" inputMode="numeric" min="1" required defaultValue="1" />
              <Field label="Peso real (kg) *" name="pesoReal" type="number" placeholder="0.0" inputMode="decimal" step="0.001" required />
              <Field label="Cubagem (m³)" name="cubagem" type="number" placeholder="Opcional" inputMode="decimal" step="0.0001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor mercadoria (R$) *" name="valorMercadoria" type="number" placeholder="0,00" inputMode="decimal" step="0.01" required />
              <Field label="Valor frete (R$)" name="valorFrete" type="number" placeholder="Opcional" inputMode="decimal" step="0.01" />
            </div>
          </Section>

          {/* resultado */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">{erro}</div>
          )}
          {resultados && resultados.map((r, i) => (
            <div key={i} className={`rounded-2xl border p-5 ${r.sucesso ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
              <div className="flex items-center gap-2.5 mb-1.5">
                {r.sucesso
                  ? <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-emerald-600 shrink-0" />
                  : <XCircle strokeWidth={1.5} className="w-5 h-5 text-red-500 shrink-0" />
                }
                <span className={`font-semibold ${r.sucesso ? "text-emerald-800" : "text-red-700"}`}>
                  {r.sucesso ? "NF-e transmitida com sucesso" : `Falha na transmissão — NF ${r.notaFiscal || "—"}`}
                </span>
              </div>
              <p className={`text-sm ${r.sucesso ? "text-emerald-600" : "text-red-600"}`}>{r.mensagem}</p>
              {r.protocolo && <p className="text-xs text-gray-400 mt-2 font-mono">Protocolo: {r.protocolo}</p>}
            </div>
          ))}

        </form>
      </div>
    </div>
  )
}
