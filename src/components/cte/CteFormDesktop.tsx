"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload, FileCheck, CheckCircle2, XCircle } from "lucide-react"
import { focusField } from "@/lib/focusField"

function Field({ label, id, value, onChange, ...props }: { label: string; id?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        id={id}
        value={value}
        onChange={onChange}
        {...props}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2EA3F2] bg-[#F5F6FA] focus:bg-white transition-colors"
      />
    </div>
  )
}

export default function CteFormDesktop() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [placaColeta, setPlacaColeta] = useState("")
  const [codigoMercadoria, setCodigoMercadoria] = useState("")
  const [codigoEspecie, setCodigoEspecie] = useState("")
  const [codigoConferente, setCodigoConferente] = useState("")
  const [cargaFechada, setCargaFechada] = useState<"S" | "N">("N")
  const [tipoDocumento, setTipoDocumento] = useState<"CTE" | "RPS">("CTE")
  const [siglaEmissora, setSiglaEmissora] = useState("")
  const [numPedido, setNumPedido] = useState("")
  const [xmlBase64, setXmlBase64] = useState("")
  const [nomeArquivo, setNomeArquivo] = useState("")

  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string } | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setNomeArquivo(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1]
      setXmlBase64(b64)
    }
    reader.readAsDataURL(file)
  }

  async function enviar() {
    if (!placaColeta) { setErro("Placa da coleta é obrigatória"); focusField("placaColeta"); return }
    if (!codigoMercadoria) { setErro("Código de mercadoria é obrigatório"); focusField("codigoMercadoria"); return }
    if (!codigoEspecie) { setErro("Código de espécie é obrigatório"); focusField("codigoEspecie"); return }
    if (!codigoConferente) { setErro("Código de conferente é obrigatório"); focusField("codigoConferente"); return }
    if (!xmlBase64) { setErro("Selecione o arquivo XML do CT-e"); return }

    setLoading(true)
    setResultado(null)
    setErro(null)

    try {
      const res = await fetch("/api/cte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placaColeta,
          codigoMercadoria: parseInt(codigoMercadoria),
          codigoEspecie: parseInt(codigoEspecie),
          codigoConferente: parseInt(codigoConferente),
          cargaFechada,
          tipoDocumento,
          siglaEmissora: siglaEmissora || undefined,
          numPedido: numPedido || undefined,
          xmlBase64,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error?.formErrors?.[0] ?? data.error ?? "Erro ao enviar")
        return
      }
      setResultado(data)
    } catch {
      setErro("Falha na conexão")
    } finally {
      setLoading(false)
    }
  }

  const podeContinuar = placaColeta && codigoMercadoria && codigoEspecie && codigoConferente && xmlBase64

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
          <span className="text-sm font-semibold text-[#1F1F1F]">Enviar CT-e</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* left — config fields */}
        <div className="w-[380px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-8 flex flex-col gap-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Configuração</p>

          <Field label="Placa da coleta *" id="placaColeta" value={placaColeta} onChange={(e) => setPlacaColeta(e.target.value.toUpperCase())} placeholder="ABC1234" maxLength={8} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cód. Mercadoria *" id="codigoMercadoria" value={codigoMercadoria} onChange={(e) => setCodigoMercadoria(e.target.value)} inputMode="numeric" />
            <Field label="Cód. Espécie *" id="codigoEspecie" value={codigoEspecie} onChange={(e) => setCodigoEspecie(e.target.value)} inputMode="numeric" />
          </div>

          <Field label="Cód. Conferente *" id="codigoConferente" value={codigoConferente} onChange={(e) => setCodigoConferente(e.target.value)} inputMode="numeric" />

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Carga fechada</p>
            <div className="flex gap-2">
              {(["N", "S"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setCargaFechada(v)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-colors ${cargaFechada === v ? "border-[#2EA3F2] bg-[#2EA3F2] text-white" : "border-gray-200 text-gray-600 bg-[#F5F6FA]"}`}>
                  {v === "S" ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Tipo documento</p>
            <div className="flex gap-2">
              {(["CTE", "RPS"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setTipoDocumento(v)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-colors ${tipoDocumento === v ? "border-[#2EA3F2] bg-[#2EA3F2] text-white" : "border-gray-200 text-gray-600 bg-[#F5F6FA]"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sigla emissora" value={siglaEmissora} onChange={(e) => setSiglaEmissora(e.target.value)} />
            <Field label="Nº Pedido" value={numPedido} onChange={(e) => setNumPedido(e.target.value)} />
          </div>

          {erro && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{erro}</div>}

          <button
            onClick={enviar}
            disabled={loading || !podeContinuar}
            className="w-full bg-[#2EA3F2] text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-blue-600 transition-colors mt-auto"
          >
            {loading ? "Enviando…" : "Enviar CT-e"}
          </button>
        </div>

        {/* right — XML upload + result */}
        <div className="flex-1 p-8 flex flex-col gap-6">
          <input ref={fileRef} type="file" accept=".xml" onChange={onFileChange} className="hidden" />

          <div
            className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
              xmlBase64
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-300 hover:border-[#2EA3F2] hover:bg-blue-50/30"
            }`}
            onClick={() => fileRef.current?.click()}
          >
            {xmlBase64 ? (
              <>
                <FileCheck strokeWidth={1} className="w-16 h-16 text-emerald-500" />
                <p className="font-semibold text-emerald-700">{nomeArquivo}</p>
                <p className="text-sm text-emerald-600">Arquivo pronto para envio — clique para trocar</p>
              </>
            ) : (
              <>
                <Upload strokeWidth={1} className="w-16 h-16 text-gray-300" />
                <p className="font-semibold text-gray-500">Clique para selecionar o XML do CT-e</p>
                <p className="text-sm text-gray-400">ou arraste e solte aqui</p>
              </>
            )}
          </div>

          {resultado && (
            <div className={`rounded-2xl border p-6 flex items-start gap-4 ${resultado.sucesso ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              {resultado.sucesso
                ? <CheckCircle2 strokeWidth={1.5} className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                : <XCircle strokeWidth={1.5} className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              }
              <div>
                <p className={`font-semibold ${resultado.sucesso ? "text-emerald-800" : "text-red-800"}`}>
                  {resultado.sucesso ? "Enviado com sucesso" : "Falha no envio"}
                </p>
                <p className={`text-sm mt-1 ${resultado.sucesso ? "text-emerald-700" : "text-red-700"}`}>{resultado.mensagem}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
