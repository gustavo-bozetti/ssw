"use client"

import { useState, useRef } from "react"
import { CODIGOS_OCORRENCIA } from "@/lib/ssw/ocorrencias"
import type { Entrega } from "@/lib/storage/types"
import { Camera, X, MapPin } from "lucide-react"
import { focusField } from "@/lib/focusField"

interface Props {
  entrega: Entrega
  onClose: () => void
  onSuccess: (protocolo: string) => void
}

const GRUPOS = ["Entrega", "Tentativa", "Pendência", "Ocorrência", "Devolução", "Operacional"]

export default function OcorrenciaForm({ entrega, onClose, onSuccess }: Props) {
  const [codigoSelecionado, setCodigoSelecionado] = useState<number | null>(null)
  const [complemento, setComplemento] = useState("")
  const [nomeRec, setNomeRec] = useState("")
  const [documentoRec, setDocumentoRec] = useState("")
  const [agendamento, setAgendamento] = useState("")
  const [geoError, setGeoError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(null)
  const [imagem, setImagem] = useState<string | null>(null) // base64 sem prefixo
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const codigo = CODIGOS_OCORRENCIA.find((c) => c.codigo === codigoSelecionado)

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setImagemPreview(dataUrl)
      // SSW espera base64 sem o prefixo "data:image/jpeg;base64,"
      setImagem(dataUrl.split(",")[1])
    }
    reader.readAsDataURL(file)
  }

  function removerFoto() {
    setImagem(null)
    setImagemPreview(null)
    if (inputFotoRef.current) inputFotoRef.current.value = ""
  }

  function capturarGPS() {
    if (!navigator.geolocation) { setGeoError("GPS não disponível"); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }),
      () => setGeoError("Não foi possível obter localização")
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codigoSelecionado || !codigo) return
    if (codigo.requiresAgendamento && !agendamento) {
      setErro("Informe a data/hora do agendamento")
      focusField("agendamento")
      return
    }
    setErro(null)
    setSubmitting(true)

    const body: Record<string, unknown> = {
      codigo: codigoSelecionado,
      descricao: codigo.descricao,
      complemento: complemento || undefined,
      cnpjRemetente: entrega.cnpjRemetente || undefined,
    }

    // identificação do envio
    if (entrega.chaveNfe) {
      body.chaveNfe = entrega.chaveNfe
    } else if (entrega.numeroNf) {
      body.numeroNf = entrega.numeroNf
      body.serieNf = "1"
    } else if (entrega.numeroColeta) {
      body.codigoNR = entrega.numeroColeta
    }

    if (codigo.requiresRecipient && nomeRec) {
      body.nomeRec = nomeRec
      body.documentoRec = documentoRec || undefined
    }
    if (codigo.requiresAgendamento) {
      body.dataHoraAgendamento = new Date(agendamento).toISOString().replace("Z", "-03:00")
    }
    if (coords) {
      body.latitude = coords.lat
      body.longitude = coords.lng
    }
    if (imagem) {
      body.imagem = imagem
    }

    try {
      const res = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? "Erro ao registrar ocorrência")
        return
      }
      onSuccess(data.protocolo ?? data.descricao ?? "Registrado")
    } catch {
      setErro("Falha na conexão")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* header */}
      <header className="border-b border-gray-200 px-4 py-4 flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-gray-900">Registrar Ocorrência</h2>
        <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* seleção de código por grupo */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tipo de ocorrência *</p>
          {GRUPOS.map((grupo) => {
            const itens = CODIGOS_OCORRENCIA.filter((c) => c.grupo === grupo)
            return (
              <div key={grupo} className="mb-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{grupo}</p>
                <div className="space-y-1">
                  {itens.map((c) => (
                    <button
                      key={c.codigo}
                      type="button"
                      onClick={() => setCodigoSelecionado(c.codigo)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                        codigoSelecionado === c.codigo
                          ? "border-blue-600 bg-blue-50 text-blue-800 font-medium"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      <span className="text-gray-400 mr-2 font-mono text-xs">{c.codigo}</span>
                      {c.descricao}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* campos condicionais */}
        {codigoSelecionado && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Complemento</label>
              <textarea
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Detalhes adicionais..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {codigo?.requiresRecipient && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nome de quem recebeu</label>
                  <input
                    value={nomeRec}
                    onChange={(e) => setNomeRec(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">CPF / RG</label>
                  <input
                    value={documentoRec}
                    onChange={(e) => setDocumentoRec(e.target.value)}
                    placeholder="Documento"
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {codigo?.requiresAgendamento && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Data/hora do agendamento *</label>
                <input
                  id="agendamento"
                  type="datetime-local"
                  value={agendamento}
                  onChange={(e) => setAgendamento(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Foto */}
            <div className="space-y-2">
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFoto}
              />
              {imagemPreview ? (
                <div className="relative">
                  <img
                    src={imagemPreview}
                    alt="Foto da ocorrência"
                    className="w-full rounded-2xl object-cover max-h-48"
                  />
                  <button
                    type="button"
                    onClick={removerFoto}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X strokeWidth={2} className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl py-4 text-sm text-gray-500 active:bg-gray-50"
                >
                  <Camera strokeWidth={1.5} className="w-5 h-5" />
                  Tirar foto / anexar imagem
                </button>
              )}
            </div>

            {/* GPS */}
            <div>
              <button
                type="button"
                onClick={capturarGPS}
                className="text-sm text-[#2EA3F2] font-medium flex items-center gap-1.5"
              >
                <MapPin strokeWidth={1.5} className="w-4 h-4 shrink-0" />
                {coords
                  ? <span className="font-mono text-xs">{Number(coords.lat).toFixed(5)}, {Number(coords.lng).toFixed(5)}</span>
                  : "Capturar localização GPS"
                }
              </button>
              {geoError && <p className="text-xs text-red-500 mt-1">{geoError}</p>}
            </div>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {erro}
          </div>
        )}
      </form>

      {/* footer fixo */}
      <div className="shrink-0 px-4 py-4 border-t border-gray-200">
        <button
          type="submit"
          form=""
          disabled={!codigoSelecionado || submitting}
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-40 active:bg-blue-700"
        >
          {submitting ? "Registrando…" : "Registrar Ocorrência"}
        </button>
      </div>
    </div>
  )
}
