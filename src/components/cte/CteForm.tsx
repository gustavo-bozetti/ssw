"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { focusField } from "@/lib/focusField"

export default function CteForm() {
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
    if (!xmlBase64) { setErro("Selecione o arquivo XML do CT-e"); focusField("xmlUpload"); return }
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
        const msg = data.error?.formErrors?.[0] ?? data.error ?? "Erro ao enviar"
        setErro(msg)
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 text-sm">← Voltar</button>
          <h1 className="text-lg font-semibold text-gray-900">Enviar CT-e</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Placa da coleta *</label>
              <input
                id="placaColeta"
                value={placaColeta}
                onChange={(e) => setPlacaColeta(e.target.value.toUpperCase())}
                placeholder="ABC1234"
                maxLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Cód. Mercadoria *</label>
              <input
                id="codigoMercadoria"
                value={codigoMercadoria}
                onChange={(e) => setCodigoMercadoria(e.target.value)}
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Cód. Espécie *</label>
              <input
                id="codigoEspecie"
                value={codigoEspecie}
                onChange={(e) => setCodigoEspecie(e.target.value)}
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Cód. Conferente *</label>
              <input
                id="codigoConferente"
                value={codigoConferente}
                onChange={(e) => setCodigoConferente(e.target.value)}
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Carga fechada *</label>
              <div className="flex gap-2">
                {(["N", "S"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCargaFechada(v)}
                    className={`flex-1 py-3 text-sm font-medium rounded-lg border transition-colors ${
                      cargaFechada === v ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {v === "S" ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo documento *</label>
            <div className="flex gap-2">
              {(["CTE", "RPS"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setTipoDocumento(v)}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg border transition-colors ${
                    tipoDocumento === v ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sigla emissora</label>
              <input
                value={siglaEmissora}
                onChange={(e) => setSiglaEmissora(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nº Pedido</label>
              <input
                value={numPedido}
                onChange={(e) => setNumPedido(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* XML upload */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">XML do CT-e *</label>
            <input
              ref={fileRef}
              type="file"
              accept=".xml"
              onChange={onFileChange}
              className="hidden"
            />
            <button
              id="xmlUpload"
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg py-4 text-sm transition-colors ${
                xmlBase64 ? "border-green-400 text-green-700 bg-green-50" : "border-gray-300 text-gray-500"
              }`}
            >
              {xmlBase64 ? `✓ ${nomeArquivo}` : "Toque para selecionar o arquivo XML"}
            </button>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            onClick={enviar}
            disabled={loading || !podeContinuar}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50 active:bg-blue-700"
          >
            {loading ? "Enviando…" : "Enviar CT-e"}
          </button>
        </div>

        {resultado && (
          <div className={`rounded-xl border p-4 ${resultado.sucesso ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className={`text-sm font-medium ${resultado.sucesso ? "text-green-700" : "text-red-700"}`}>
              {resultado.sucesso ? "✓ Enviado com sucesso" : "Falha no envio"}
            </p>
            <p className="text-sm text-gray-600 mt-1">{resultado.mensagem}</p>
          </div>
        )}
      </main>
    </div>
  )
}
