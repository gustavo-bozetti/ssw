"use client"

import { useState } from "react"
import { X, CalendarClock } from "lucide-react"
import type { Entrega } from "@/lib/storage/types"
import { focusField } from "@/lib/focusField"

interface Props {
  entrega: Entrega
  onClose: () => void
  onSuccess: (msg: string) => void
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function AgendamentoForm({ entrega, onClose, onSuccess }: Props) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [data, setData] = useState(toDateInput(tomorrow))
  const [horaInicio, setHoraInicio] = useState("08:00")
  const [horaFim, setHoraFim] = useState("12:00")
  const [obs, setObs] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // formata Date ISO para DD/MM/AAAA
  function formatDataBR(iso: string) {
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data) {
      setErro("Informe a data do agendamento")
      focusField("dataAgendamento")
      return
    }
    if (!horaInicio || !horaFim) {
      setErro("Preencha todos os campos obrigatórios")
      return
    }
    if (horaInicio >= horaFim) {
      setErro("Horário de início deve ser antes do fim")
      focusField("horaAgendamentoFim")
      return
    }
    setErro(null)
    setSubmitting(true)

    const cnpj = entrega.cnpjRemetente || process.env.NEXT_PUBLIC_SSW_CNPJ_REMETENTE || ""

    const body: Record<string, unknown> = {
      cnpj,
      data_agendamento: formatDataBR(data),
      horario_inicio: horaInicio,
      horario_fim: horaFim,
    }

    if (entrega.chaveNfe) body.chave_nfe = entrega.chaveNfe
    else if (entrega.numeroColeta) body.nro_coleta = entrega.numeroColeta

    if (obs.trim()) body.observacao = obs.trim()

    try {
      const res = await fetch("/api/agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (!res.ok) {
        setErro(result.error ?? "Erro ao agendar")
        return
      }
      onSuccess(result.protocolo ?? `Agendado para ${formatDataBR(data)} ${horaInicio}–${horaFim}`)
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
        <div className="flex items-center gap-2">
          <CalendarClock strokeWidth={1.5} className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-ink">Agendar Entrega</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 p-1">
          <X strokeWidth={1.5} className="w-5 h-5" />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* entrega referência */}
        <div className="bg-surface rounded-2xl px-4 py-3 space-y-1">
          <p className="text-xs text-gray-500">Entrega</p>
          <p className="text-sm font-semibold text-ink">{entrega.nomeDestinatario}</p>
          {entrega.numeroColeta && (
            <p className="text-xs text-gray-400 font-mono">#{entrega.numeroColeta}</p>
          )}
          {entrega.chaveNfe && (
            <p className="text-xs text-gray-400 font-mono truncate">{entrega.chaveNfe}</p>
          )}
        </div>

        {/* data */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-navy">Data do agendamento *</label>
          <input
            id="dataAgendamento"
            type="date"
            value={data}
            min={toDateInput(new Date())}
            onChange={(e) => setData(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* horário */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy">Início *</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy">Fim *</label>
            <input
              id="horaAgendamentoFim"
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* observação */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-navy">Observação</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Ex: Ligar antes de chegar, entregar na portaria…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {erro}
          </div>
        )}
      </form>

      {/* footer */}
      <div className="shrink-0 px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl disabled:opacity-40 active:bg-blue-600 transition-colors"
        >
          {submitting ? "Agendando…" : "Confirmar Agendamento"}
        </button>
      </div>
    </div>
  )
}
