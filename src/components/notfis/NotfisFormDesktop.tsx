"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react"
import { maskCNPJ, maskCEP, maskPhone, maskDate, onlyDigitsKey } from "@/lib/mask"

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
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white transition-colors"
      />
    </div>
  )
}

function Select({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <select name={name} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
        {children}
      </select>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 h-full">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  )
}

const STEPS = ["Destinatário", "Nota Fiscal"]

export default function NotfisFormDesktop() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultados, setResultados] = useState<ResultItem[] | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  function salvarEtapa(form: HTMLFormElement) {
    const fd = new FormData(form)
    const entries: Record<string, string> = {}
    fd.forEach((v, k) => { if (typeof v === "string") entries[k] = v })
    setFormData(prev => ({ ...prev, ...entries }))
  }

  function avancar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    salvarEtapa(e.currentTarget)
    setErro(null)
    setStep(1)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const combined = { ...formData }
    const fd = new FormData(e.currentTarget)
    fd.forEach((v, k) => { if (typeof v === "string") combined[k] = v })

    setErro(null)
    setResultados(null)
    setLoading(true)

    const get = (k: string) => combined[k]?.trim() || undefined
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
    <div className="flex flex-col h-full bg-surface">
      {/* header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => step === 0 ? router.back() : setStep(0)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">Enviar NF-e</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-ink">{STEPS[step]}</span>
          <div className="ml-4 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-emerald-400" : "w-3 bg-gray-200"}`} />
            ))}
          </div>
        </div>
      </header>

      {/* etapa 1 */}
      {step === 0 && (
        <form onSubmit={avancar} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 px-8 py-6 grid grid-cols-2 gap-6 min-h-0">
            {/* coluna esquerda: remetente + destinatário */}
            <div className="flex flex-col gap-6">
              <SectionCard title="Remetente">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CNPJ" name="cnpjRemetente" placeholder="00.000.000/0001-00" inputMode="numeric" value={formData.cnpjRemetente ?? ""} onChange={(e) => setFormData(p => ({ ...p, cnpjRemetente: maskCNPJ(e.target.value) }))} />
                  <Field label="Nome / Razão Social" name="nomeRemetente" placeholder="Empresa de origem" value={formData.nomeRemetente ?? ""} onChange={(e) => setFormData(p => ({ ...p, nomeRemetente: e.target.value }))} />
                </div>
              </SectionCard>

              <SectionCard title="Destinatário">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CNPJ *" name="cnpjDest" placeholder="00.000.000/0001-00" inputMode="numeric" required value={formData.cnpjDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, cnpjDest: maskCNPJ(e.target.value) }))} />
                  <Field label="Nome / Razão Social *" name="nomeDest" placeholder="Cliente destino" required value={formData.nomeDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, nomeDest: e.target.value }))} />
                  <Field label="Telefone" name="telefoneDest" placeholder="(11) 99999-9999" inputMode="tel" value={formData.telefoneDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, telefoneDest: maskPhone(e.target.value) }))} />
                  <Field label="E-mail" name="emailDest" type="email" placeholder="email@empresa.com" value={formData.emailDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, emailDest: e.target.value }))} />
                </div>
              </SectionCard>
            </div>

            {/* coluna direita: endereço */}
            <SectionCard title="Endereço de entrega">
              <Field label="CEP *" name="cepDest" placeholder="00000-000" inputMode="numeric" required value={formData.cepDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, cepDest: maskCEP(e.target.value) }))} onKeyDown={onlyDigitsKey} />
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <Field label="Rua *" name="ruaDest" placeholder="Nome da rua" required value={formData.ruaDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, ruaDest: e.target.value }))} />
                </div>
                <Field label="Número *" name="numeroDest" placeholder="100" required value={formData.numeroDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, numeroDest: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Complemento" name="complementoDest" placeholder="Apto, sala…" value={formData.complementoDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, complementoDest: e.target.value }))} />
                <Field label="Bairro *" name="bairroDest" placeholder="Centro" required value={formData.bairroDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, bairroDest: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Cidade *" name="cidadeDest" placeholder="São Paulo" required value={formData.cidadeDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, cidadeDest: e.target.value }))} />
                </div>
                <Field label="UF *" name="ufDest" placeholder="SP" maxLength={2} required value={formData.ufDest ?? ""} onChange={(e) => setFormData(p => ({ ...p, ufDest: e.target.value.toUpperCase() }))} />
              </div>
            </SectionCard>
          </div>

          <div className="px-8 pb-6 flex justify-end">
            <button type="submit" className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors">
              Próximo: Nota Fiscal →
            </button>
          </div>
        </form>
      )}

      {/* etapa 2 */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 px-8 py-6 grid grid-cols-2 gap-6 min-h-0">
            {/* coluna esquerda: identificação */}
            <SectionCard title="Identificação">
              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipo NF" name="tipoNF">
                  <option value="NORMAL">Normal</option>
                  <option value="REVERSA">Reversa</option>
                  <option value="DEVOLUCAO">Devolução</option>
                </Select>
                <Select label="Condição frete" name="condicaoFrete">
                  <option value="CIF">CIF — remetente</option>
                  <option value="FOB">FOB — destinatário</option>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <Field label="Número NF *" name="nfNumero" placeholder="000000" inputMode="numeric" required />
                </div>
                <Field label="Série *" name="nfSerie" placeholder="1" required defaultValue="1" />
              </div>
              <Field label="Chave NF-e (44 dígitos)" name="chaveNFe" placeholder="Opcional" inputMode="numeric" maxLength={44} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data emissão * (DD/MM/AAAA)" name="dataEmissao" placeholder="24/09/2026" inputMode="numeric" maxLength={10} required value={formData.dataEmissao ?? ""} onChange={(e) => setFormData(p => ({ ...p, dataEmissao: maskDate(e.target.value) }))} />
                <Field label="Nº pedido" name="pedido" placeholder="Opcional" />
              </div>
            </SectionCard>

            {/* coluna direita: volumes e valores */}
            <div className="flex flex-col gap-6">
              <SectionCard title="Carga">
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Volumes *" name="qtdeVolumes" type="number" placeholder="1" inputMode="numeric" min="1" required defaultValue="1" />
                  <Field label="Peso real (kg) *" name="pesoReal" type="number" placeholder="0.0" inputMode="decimal" step="0.001" required />
                  <Field label="Cubagem (m³)" name="cubagem" type="number" placeholder="Opcional" inputMode="decimal" step="0.0001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor mercadoria (R$) *" name="valorMercadoria" type="number" placeholder="0,00" inputMode="decimal" step="0.01" required />
                  <Field label="Valor frete (R$)" name="valorFrete" type="number" placeholder="Opcional" inputMode="decimal" step="0.01" />
                </div>
              </SectionCard>

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
                    <span className={`font-semibold text-sm ${r.sucesso ? "text-emerald-800" : "text-red-700"}`}>
                      {r.sucesso ? "NF-e transmitida com sucesso" : `Falha — NF ${r.notaFiscal || "—"}`}
                    </span>
                  </div>
                  <p className={`text-sm ${r.sucesso ? "text-emerald-600" : "text-red-600"}`}>{r.mensagem}</p>
                  {r.protocolo && <p className="text-xs text-gray-400 mt-2 font-mono">Protocolo: {r.protocolo}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 pb-6 flex justify-end gap-3">
            <button type="button" onClick={() => setStep(0)} className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              ← Voltar
            </button>
            <button type="submit" disabled={loading} className="bg-primary text-white font-semibold px-8 py-3 rounded-xl disabled:opacity-50 hover:bg-primary-dark transition-colors">
              {loading ? "Transmitindo…" : "Transmitir NF-e →"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
