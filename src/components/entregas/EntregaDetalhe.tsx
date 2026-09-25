"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useEntrega } from "@/hooks/useEntregas"
import { VEICULO_CONFIG } from "./config"
import StatusBadge from "@/components/ui/StatusBadge"
import OcorrenciaForm from "@/components/ocorrencias/OcorrenciaForm"
import AgendamentoForm from "@/components/agendamento/AgendamentoForm"
import { ChevronLeft, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"

interface TrackingEvento {
  data?: string
  hora?: string
  ocorrencia?: string
  descricao?: string
  cidade?: string
  uf?: string
  [key: string]: unknown
}

const LS_CHAVE_KEY = "logistica:lastChaveNfe"

export default function EntregaDetalhe({ id }: { id: string }) {
  const router = useRouter()
  const { entrega, loading } = useEntrega(id)
  const [eventos, setEventos] = useState<TrackingEvento[] | null>(null)
  const [rastreando, setRastreando] = useState(false)
  const [erroTracking, setErroTracking] = useState<string | null>(null)
  const [showOcorrencia, setShowOcorrencia] = useState(false)
  const [sucessoOcorrencia, setSucessoOcorrencia] = useState<string | null>(null)
  const [showAgendamento, setShowAgendamento] = useState(false)
  const [sucessoAgendamento, setSucessoAgendamento] = useState<string | null>(null)
  const [etiquetas, setEtiquetas] = useState<Array<{numeroRastreamento?: string; qrCode?: {numeroRastreamento: string; seqCtrc: string}; volume?: number; peso?: number; dataPrevisaoEntrega?: string}> | null>(null)
  const [carregandoEtiqueta, setCarregandoEtiqueta] = useState(false)
  const [tipoImp, setTipoImp] = useState<"ZPL" | "EPL" | "PPLA">("ZPL")
  const [carregandoImp, setCarregandoImp] = useState(false)
  const [arquivoImp, setArquivoImp] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [eventoModal, setEventoModal] = useState<TrackingEvento | null>(null)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEventoModal(null)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const rastrear = useCallback(async () => {
    if (!entrega) return
    setRastreando(true)
    setErroTracking(null)
    const params = new URLSearchParams()
    if (entrega.chaveNfe) {
      params.set("chaveNfe", entrega.chaveNfe)
      try { localStorage.setItem(LS_CHAVE_KEY, entrega.chaveNfe) } catch {}
    } else if (entrega.numeroColeta) {
      params.set("numeroColeta", entrega.numeroColeta)
      if (entrega.cnpjRemetente) params.set("cnpj", entrega.cnpjRemetente)
    } else {
      setErroTracking("Sem número de coleta ou chave NF-e para rastrear")
      setRastreando(false)
      return
    }
    try {
      const res = await fetch(`/api/entregas/${id}/tracking?${params}`)
      const data = await res.json()
      if (!res.ok) { setErroTracking(data.error); return }
      setEventos(data.eventos ?? [data])
    } catch {
      setErroTracking("Falha na conexão")
    } finally {
      setRastreando(false)
    }
  }, [entrega, id])

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(rastrear, 10 * 60 * 1000)
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [autoRefresh, rastrear])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 strokeWidth={1.5} className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!entrega) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
          <AlertCircle strokeWidth={1} className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">Entrega não encontrada</p>
        <button onClick={() => router.push("/entregas")} className="text-primary text-sm font-medium">
          Voltar à lista
        </button>
      </div>
    )
  }

  const v = VEICULO_CONFIG[entrega.tipoVeiculo]

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 p-1">
              <ChevronLeft strokeWidth={1.5} className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <v.Icon strokeWidth={1.5} className="w-5 h-5 text-navy" />
              <span className="text-base font-bold text-ink">Entrega</span>
            </div>
            <StatusBadge status={entrega.status} large />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {entrega.mensagemSsw && (
          <div className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${entrega.erroSsw === 0 ? "bg-emerald-50 border border-emerald-100" : "bg-amber-50 border border-amber-100"}`}>
            {entrega.erroSsw === 0
              ? <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              : <AlertCircle strokeWidth={1.5} className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-semibold ${entrega.erroSsw === 0 ? "text-emerald-800" : "text-amber-800"}`}>
                {entrega.erroSsw === 0 ? "Coleta registrada na SSW" : "Aviso da transportadora"}
              </p>
              <p className={`text-xs mt-0.5 ${entrega.erroSsw === 0 ? "text-emerald-600" : "text-amber-700"}`}>
                {entrega.mensagemSsw}
              </p>
            </div>
          </div>
        )}

        <InfoCard title="Destinatário">
          <Row label="Nome" value={entrega.nomeDestinatario} />
          {entrega.cnpjDestinatario && <Row label="CNPJ" value={entrega.cnpjDestinatario} />}
          {entrega.cpfDestinatario && <Row label="CPF" value={entrega.cpfDestinatario} />}
          <Row label="CEP" value={entrega.cepEntrega} />
          {entrega.enderecoEntrega && <Row label="Endereço" value={entrega.enderecoEntrega} />}
        </InfoCard>

        <InfoCard title="Carga">
          <Row label="Veículo" value={v.label} />
          <Row label="Peso" value={`${entrega.peso} kg`} />
          <Row label="Volumes" value={String(entrega.quantidade)} />
          {entrega.mercadoria && <Row label="Mercadoria" value={entrega.mercadoria} />}
          {entrega.valorMercadoria && <Row label="Valor" value={`R$ ${entrega.valorMercadoria.toFixed(2)}`} />}
        </InfoCard>

        {(entrega.numeroColeta || entrega.chaveNfe || entrega.numeroNf || entrega.pedido) && (
          <InfoCard title="Dados do pedido">
            {entrega.numeroColeta && <Row label="Nº coleta SSW" value={`#${entrega.numeroColeta}`} mono />}
            {entrega.chaveNfe && <Row label="Chave NF-e" value={entrega.chaveNfe} mono />}
            {entrega.numeroNf && <Row label="Número NF" value={entrega.numeroNf} />}
            {entrega.pedido && <Row label="Pedido" value={entrega.pedido} />}
          </InfoCard>
        )}

        {/* rastreamento */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-ink">Rastreamento SSW</p>
            <button onClick={rastrear} disabled={rastreando} className="text-sm text-primary font-semibold disabled:opacity-50">
              {rastreando ? <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin inline" /> : "Atualizar"}
            </button>
          </div>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <div onClick={() => setAutoRefresh((v) => !v)} className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${autoRefresh ? "bg-primary" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRefresh ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs text-gray-500">Atualizar a cada 10 min</span>
          </label>
          {erroTracking && <p className="text-sm text-red-600">{erroTracking}</p>}
          {eventos === null && !erroTracking && <p className="text-sm text-gray-400">Toque em Atualizar para ver o status</p>}
          {eventos !== null && eventos.length === 0 && <p className="text-sm text-gray-400">Nenhum evento registrado ainda</p>}
          {eventos && eventos.length > 0 && (
            <ol className="space-y-0">
              {eventos.map((ev, i) => (
                <li key={i} className="flex gap-3 cursor-pointer active:bg-gray-50 -mx-1 px-1 rounded-xl" onClick={() => setEventoModal(ev)}>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mt-1 shrink-0 ring-2 ring-blue-100" />
                    {i < eventos.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-sm font-semibold text-ink">{ev.ocorrencia ?? ev.descricao}</p>
                    {ev.descricao && ev.ocorrencia && <p className="text-xs text-gray-500">{ev.descricao}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{[ev.data, ev.hora, ev.cidade, ev.uf].filter(Boolean).join(" · ")}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* etiquetas */}
        {entrega.chaveNfe && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-ink">Etiqueta / NR</p>
              <button
                onClick={async () => {
                  setCarregandoEtiqueta(true)
                  try {
                    const res = await fetch(`/api/consulta-nr?chaveNfe=${entrega.chaveNfe}`)
                    const data = await res.json()
                    setEtiquetas(data.etiquetas ?? [])
                  } finally { setCarregandoEtiqueta(false) }
                }}
                disabled={carregandoEtiqueta}
                className="text-sm text-primary font-semibold disabled:opacity-50"
              >
                {carregandoEtiqueta ? "Consultando…" : "Consultar"}
              </button>
            </div>
            {etiquetas === null && <p className="text-sm text-gray-400">Toque em Consultar para buscar etiqueta</p>}
            {etiquetas !== null && etiquetas.length === 0 && <p className="text-sm text-gray-400">Nenhuma etiqueta encontrada</p>}
            {etiquetas && etiquetas.map((et, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-1 text-sm mb-2">
                {et.numeroRastreamento && <p className="font-mono text-ink">{et.numeroRastreamento}</p>}
                {et.dataPrevisaoEntrega && <p className="text-gray-500">Previsão: {et.dataPrevisaoEntrega}</p>}
                {et.peso && <p className="text-gray-500">{et.peso} kg · vol {et.volume}</p>}
                {et.qrCode && <p className="text-xs text-gray-400 font-mono break-all">QR: {et.qrCode.numeroRastreamento}</p>}
              </div>
            ))}
            {etiquetas && etiquetas.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Formato de impressão</p>
                <div className="flex gap-2 mb-2">
                  {(["ZPL", "EPL", "PPLA"] as const).map((f) => (
                    <button key={f} onClick={() => setTipoImp(f)} className={`flex-1 py-2 text-xs font-semibold rounded-xl border-2 transition-colors ${tipoImp === f ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-500"}`}>{f}</button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    setCarregandoImp(true)
                    setArquivoImp(null)
                    try {
                      const res = await fetch(`/api/consulta-nr-imp?chaveNfe=${entrega.chaveNfe}&tipoImp=${tipoImp}`)
                      const data = await res.json()
                      if (data.etiquetas?.[0]?.arquivoImpressao) setArquivoImp(data.etiquetas[0].arquivoImpressao)
                    } finally { setCarregandoImp(false) }
                  }}
                  disabled={carregandoImp}
                  className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {carregandoImp ? "Gerando…" : `Gerar ${tipoImp}`}
                </button>
                {arquivoImp && (
                  <a href={`data:text/plain;base64,${arquivoImp}`} download={`etiqueta.${tipoImp.toLowerCase()}`} className="block mt-2 text-center text-sm text-primary font-semibold py-2 border-2 border-primary rounded-xl">
                    Baixar {tipoImp}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {sucessoOcorrencia && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700 text-center font-medium">
            Ocorrência registrada — {sucessoOcorrencia}
          </div>
        )}
        {sucessoAgendamento && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 text-center font-medium">
            Entrega agendada — {sucessoAgendamento}
          </div>
        )}
        <p className="text-xs text-gray-400 text-center py-2">
          Criada em {new Date(entrega.createdAt).toLocaleString("pt-BR")}
        </p>
      </main>

      {/* fixed action bar — mobile */}
      <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="max-w-lg mx-auto flex gap-2">
          <button onClick={rastrear} disabled={rastreando} className="flex-1 border-2 border-navy text-navy font-semibold py-3 rounded-2xl text-sm active:bg-gray-50 disabled:opacity-50">
            {rastreando ? "…" : "Rastrear"}
          </button>
          <button onClick={() => setShowAgendamento(true)} className="flex-1 bg-primary text-white font-semibold py-3 rounded-2xl text-sm active:bg-blue-600">
            Agendar
          </button>
          <button onClick={() => setShowOcorrencia(true)} className="flex-1 bg-[#FF6900] text-white font-semibold py-3 rounded-2xl text-sm active:bg-orange-600">
            Ocorrência
          </button>
        </div>
      </div>

      {showOcorrencia && (
        <OcorrenciaForm entrega={entrega} onClose={() => setShowOcorrencia(false)} onSuccess={(protocolo) => { setShowOcorrencia(false); setSucessoOcorrencia(protocolo) }} />
      )}
      {showAgendamento && (
        <AgendamentoForm entrega={entrega} onClose={() => setShowAgendamento(false)} onSuccess={(msg) => { setShowAgendamento(false); setSucessoAgendamento(msg) }} />
      )}

      {eventoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setEventoModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-ink text-base">{eventoModal.ocorrencia ?? eventoModal.descricao}</p>
              <button onClick={() => setEventoModal(null)} className="text-gray-400 shrink-0">
                <X strokeWidth={1.5} className="w-5 h-5" />
              </button>
            </div>
            <dl className="space-y-2">
              {Object.entries(eventoModal).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 text-sm">
                  <dt className="text-gray-500 shrink-0 capitalize">{k}</dt>
                  <dd className="text-ink text-right break-all">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="font-semibold text-ink mb-3">{title}</p>
      <dl className="space-y-2">{children}</dl>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className={`text-ink text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  )
}
