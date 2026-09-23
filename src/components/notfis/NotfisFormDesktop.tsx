"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CheckCircle2, XCircle, FileText } from "lucide-react"

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
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2EA3F2] bg-[#F5F6FA] focus:bg-white transition-colors"
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
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
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">Ferramentas</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-[#1F1F1F]">Enviar NF-e</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 min-h-0">

        {/* Coluna esquerda — Remetente + Destinatário */}
        <div className="flex-1 bg-white border-r border-gray-100 overflow-y-auto p-8 space-y-8">

          <section>
            <SectionTitle>Remetente</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CNPJ" name="cnpjRemetente" placeholder="00.000.000/0001-00" inputMode="numeric" />
              <Field label="Nome / Razão Social" name="nomeRemetente" placeholder="Empresa origem" />
            </div>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <SectionTitle>Destinatário</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CNPJ *" name="cnpjDest" placeholder="00.000.000/0001-00" inputMode="numeric" required />
              <Field label="Nome / Razão Social *" name="nomeDest" placeholder="Cliente destino" required />
              <Field label="Telefone" name="telefoneDest" placeholder="(11) 99999-9999" inputMode="tel" />
              <Field label="E-mail" name="emailDest" type="email" placeholder="email@empresa.com" />
            </div>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <SectionTitle>Endereço de entrega</SectionTitle>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Field label="Rua *" name="ruaDest" placeholder="Nome da rua" required />
              </div>
              <Field label="Número *" name="numeroDest" placeholder="100" required />
              <Field label="Complemento" name="complementoDest" placeholder="Apto, sala..." />
              <Field label="Bairro *" name="bairroDest" placeholder="Centro" required />
              <div className="col-span-2">
                <Field label="Cidade *" name="cidadeDest" placeholder="São Paulo" required />
              </div>
              <Field label="UF *" name="ufDest" placeholder="SP" maxLength={2} required />
              <Field label="CEP *" name="cepDest" placeholder="00000-000" inputMode="numeric" required />
            </div>
          </section>
        </div>

        {/* Coluna direita — Nota Fiscal + Ação + Resultado */}
        <div className="w-[380px] shrink-0 bg-white overflow-y-auto flex flex-col">
          <div className="flex-1 p-8 space-y-5">
            <SectionTitle>Nota Fiscal</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo NF</label>
                <select name="tipoNF" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2EA3F2] bg-[#F5F6FA]">
                  <option value="NORMAL">Normal</option>
                  <option value="REVERSA">Reversa</option>
                  <option value="DEVOLUCAO">Devolução</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Condição frete</label>
                <select name="condicaoFrete" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2EA3F2] bg-[#F5F6FA]">
                  <option value="CIF">CIF — remetente paga</option>
                  <option value="FOB">FOB — destinatário paga</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Field label="Número NF *" name="nfNumero" placeholder="000000" inputMode="numeric" required />
              </div>
              <Field label="Série *" name="nfSerie" placeholder="1" required defaultValue="1" />
            </div>

            <Field label="Chave NF-e (44 dígitos)" name="chaveNFe" placeholder="Opcional" inputMode="numeric" maxLength={44} />
            <Field label="Data de emissão * (DD/MM/AAAA)" name="dataEmissao" placeholder="22/09/2026" required />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Volumes *" name="qtdeVolumes" type="number" placeholder="1" inputMode="numeric" min="1" required defaultValue="1" />
              <Field label="Peso real (kg) *" name="pesoReal" type="number" placeholder="0.0" inputMode="decimal" step="0.001" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor mercadoria (R$) *" name="valorMercadoria" type="number" placeholder="0,00" inputMode="decimal" step="0.01" required />
              <Field label="Cubagem (m³)" name="cubagem" type="number" placeholder="Opcional" inputMode="decimal" step="0.0001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nº pedido" name="pedido" placeholder="Opcional" />
              <Field label="Valor frete (R$)" name="valorFrete" type="number" placeholder="Opcional" inputMode="decimal" step="0.01" />
            </div>
          </div>

          {/* Área de ação e resultado — sticky no fundo */}
          <div className="shrink-0 border-t border-gray-100 p-6 space-y-3">
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>
            )}
            {resultados && resultados.map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.sucesso ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {r.sucesso
                    ? <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-emerald-600 shrink-0" />
                    : <XCircle strokeWidth={1.5} className="w-4 h-4 text-red-500 shrink-0" />
                  }
                  <span className={`font-semibold text-sm ${r.sucesso ? "text-emerald-800" : "text-red-700"}`}>
                    {r.sucesso ? "NF transmitida com sucesso" : `Falha — NF ${r.notaFiscal || "—"}`}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${r.sucesso ? "text-emerald-600" : "text-red-600"}`}>{r.mensagem}</p>
                {r.protocolo && <p className="text-xs text-gray-400 mt-1.5 font-mono">Protocolo: {r.protocolo}</p>}
              </div>
            ))}
            {!resultados && !erro && (
              <div className="flex items-center gap-3 text-gray-400 px-1">
                <FileText strokeWidth={1} className="w-5 h-5 shrink-0" />
                <p className="text-sm">Preencha os dados e envie a NF-e</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2EA3F2] text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              {loading ? "Transmitindo…" : "Transmitir NF-e para SSW →"}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
