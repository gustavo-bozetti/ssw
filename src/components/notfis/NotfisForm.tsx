"use client"

import { useState } from "react"
import Link from "next/link"

interface ResultItem {
  sucesso: boolean
  mensagem: string
  notaFiscal: number
  protocolo: string
}

export default function NotfisForm() {
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/entregas" className="text-gray-500 text-sm">← Voltar</Link>
          <h1 className="text-lg font-semibold text-gray-900">Enviar NF-e (NOTFIS)</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Remetente */}
        <Section title="Remetente">
          <Field label="CNPJ Remetente" name="cnpjRemetente" placeholder="00.000.000/0001-00" inputMode="numeric" />
          <Field label="Nome / Razão Social" name="nomeRemetente" placeholder="Empresa origem" />
        </Section>

        {/* Destinatário */}
        <Section title="Destinatário">
          <Field label="CNPJ *" name="cnpjDest" placeholder="00.000.000/0001-00" inputMode="numeric" required />
          <Field label="Nome / Razão Social *" name="nomeDest" placeholder="Cliente destino" required />
          <Field label="Telefone" name="telefoneDest" placeholder="(11) 99999-9999" inputMode="tel" />
          <Field label="E-mail" name="emailDest" type="email" placeholder="email@empresa.com" />
          <p className="text-xs font-medium text-gray-500 pt-1">Endereço</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Field label="Rua *" name="ruaDest" placeholder="Nome da rua" required />
            </div>
            <Field label="Número *" name="numeroDest" placeholder="100" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Complemento" name="complementoDest" placeholder="Apto, sala..." />
            <Field label="Bairro *" name="bairroDest" placeholder="Centro" required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Field label="Cidade *" name="cidadeDest" placeholder="São Paulo" required />
            </div>
            <Field label="UF *" name="ufDest" placeholder="SP" maxLength={2} required />
          </div>
          <Field label="CEP *" name="cepDest" placeholder="00000-000" inputMode="numeric" required />
        </Section>

        {/* Nota Fiscal */}
        <Section title="Nota Fiscal">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo NF</label>
              <select name="tipoNF" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="NORMAL">Normal</option>
                <option value="REVERSA">Reversa</option>
                <option value="DEVOLUCAO">Devolução</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Frete</label>
              <select name="condicaoFrete" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="CIF">CIF (remetente paga)</option>
                <option value="FOB">FOB (destinatário paga)</option>
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
          <Field label="Data emissão * (DD/MM/AAAA)" name="dataEmissao" placeholder="22/09/2026" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Volumes *" name="qtdeVolumes" type="number" placeholder="1" inputMode="numeric" min="1" required defaultValue="1" />
            <Field label="Peso real (kg) *" name="pesoReal" type="number" placeholder="0.0" inputMode="decimal" step="0.001" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor mercadoria (R$) *" name="valorMercadoria" type="number" placeholder="0,00" inputMode="decimal" step="0.01" required />
            <Field label="Cubagem (m³)" name="cubagem" type="number" placeholder="Opcional" inputMode="decimal" step="0.0001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número pedido" name="pedido" placeholder="Opcional" />
            <Field label="Valor frete (R$)" name="valorFrete" type="number" placeholder="Opcional" inputMode="decimal" step="0.01" />
          </div>
        </Section>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{erro}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 active:bg-blue-700"
        >
          {loading ? "Enviando NF…" : "Enviar NF-e para Transportadora"}
        </button>

        {resultados && (
          <div className="space-y-3">
            {resultados.map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.sucesso ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{r.sucesso ? "✓" : "✗"}</span>
                  <span className={`font-medium text-sm ${r.sucesso ? "text-green-800" : "text-red-800"}`}>
                    NF {r.notaFiscal || "—"}
                  </span>
                </div>
                <p className={`text-sm ${r.sucesso ? "text-green-700" : "text-red-700"}`}>{r.mensagem}</p>
                {r.protocolo && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">Protocolo: {r.protocolo}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <p className="font-medium text-gray-800">{title}</p>
      {children}
    </section>
  )
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input name={name} {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}
