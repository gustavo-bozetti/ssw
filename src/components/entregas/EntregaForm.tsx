"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"
import { VEICULO_CONFIG } from "./config"
import type { TipoVeiculo } from "@/lib/storage/types"
import StepBar from "@/components/ui/StepBar"
import Button from "@/components/ui/Button"
import { Field, SelectField } from "@/components/ui/Field"
import { ChevronLeft, Loader2, CalendarClock } from "lucide-react"
import { focusField } from "@/lib/focusField"

function defaultLimiteColeta() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}

interface WizardData {
  tipoVeiculo: TipoVeiculo
  nomeDestinatario: string
  cepEntrega: string
  enderecoEntrega: string
  cnpjDestinatario: string
  cpfDestinatario: string
  peso: string
  quantidade: string
  mercadoria: string
  valorMercadoria: string
  cubagem: string
  limiteColeta: string
  tipoPagamento: "O" | "D"
  solicitante: string
  chaveNfe: string
  numeroNf: string
  pedido: string
  observacao: string
  instrucao: string
  cnpjRemetente: string
  nomeRemetente: string
  reversa: boolean
  agendarEntrega: boolean
  dataAgendamento: string
  horaAgendamentoInicio: string
  horaAgendamentoFim: string
  obsAgendamento: string
}

const STEPS = ["Veículo", "Destinatário", "Carga", "Detalhes"]

export default function EntregaForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)

  const [dados, setDados] = useState<WizardData>({
    tipoVeiculo: "MOTO",
    nomeDestinatario: "",
    cepEntrega: "",
    enderecoEntrega: "",
    cnpjDestinatario: "",
    cpfDestinatario: "",
    peso: "",
    quantidade: "1",
    mercadoria: "",
    valorMercadoria: "",
    cubagem: "",
    limiteColeta: defaultLimiteColeta(),
    tipoPagamento: "O",
    solicitante: "",
    chaveNfe: "",
    numeroNf: "",
    pedido: "",
    observacao: "",
    instrucao: "",
    cnpjRemetente: "",
    nomeRemetente: "",
    reversa: false,
    agendarEntrega: false,
    dataAgendamento: "",
    horaAgendamentoInicio: "08:00",
    horaAgendamentoFim: "12:00",
    obsAgendamento: "",
  })

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setDados((prev) => ({ ...prev, [key]: value }))
  }

  function validarStep(): { msg: string; fieldId: string } | null {
    if (step === 1) {
      if (!dados.nomeDestinatario.trim()) return { msg: "Nome do destinatário é obrigatório", fieldId: "nomeDestinatario" }
      const cep = dados.cepEntrega.replace(/\D/g, "")
      if (!cep) return { msg: "CEP é obrigatório", fieldId: "cepEntrega" }
      if (cep.length !== 8) return { msg: "CEP deve ter 8 dígitos", fieldId: "cepEntrega" }
      if (dados.cnpjDestinatario) {
        const cnpj = dados.cnpjDestinatario.replace(/\D/g, "")
        if (cnpj.length !== 14) return { msg: "CNPJ do destinatário deve ter 14 dígitos", fieldId: "cnpjDestinatario" }
      }
      if (dados.cpfDestinatario) {
        const cpf = dados.cpfDestinatario.replace(/\D/g, "")
        if (cpf.length !== 11) return { msg: "CPF do destinatário deve ter 11 dígitos", fieldId: "cpfDestinatario" }
      }
    }
    if (step === 2) {
      if (!dados.peso || Number(dados.peso) <= 0) return { msg: "Peso é obrigatório", fieldId: "peso" }
      if (!dados.quantidade || Number(dados.quantidade) < 1) return { msg: "Volumes é obrigatório", fieldId: "quantidade" }
      const v = VEICULO_CONFIG[dados.tipoVeiculo]
      if (v.pesoMax && Number(dados.peso) > v.pesoMax) return { msg: `Peso máximo para ${v.label}: ${v.pesoMax} kg`, fieldId: "peso" }
      if (v.qtdMax && Number(dados.quantidade) > v.qtdMax) return { msg: `Volume máximo para ${v.label}: ${v.qtdMax}`, fieldId: "quantidade" }
    }
    if (step === 3) {
      if (!dados.limiteColeta) return { msg: "Data limite de coleta é obrigatória", fieldId: "limiteColeta" }
      if (new Date(dados.limiteColeta) <= new Date()) return { msg: "Data limite deve ser no futuro", fieldId: "limiteColeta" }
      if (!dados.solicitante.trim()) return { msg: "Solicitante é obrigatório", fieldId: "solicitante" }
      if (dados.chaveNfe && dados.chaveNfe.replace(/\D/g, "").length !== 44) return { msg: "Chave NF-e deve ter 44 dígitos", fieldId: "chaveNfe" }
    }
    return null
  }

  async function buscarCep(cep: string) {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) return
      const partes = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean)
      setDados((prev) => ({ ...prev, enderecoEntrega: partes.join(", ") }))
    } catch {
      // silently ignore — user can type manually
    } finally {
      setBuscandoCep(false)
    }
  }

  function avancar() {
    const err = validarStep()
    if (err) { setErro(err.msg); focusField(err.fieldId); return }
    setErro(null)
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    const err = validarStep()
    if (err) { setErro(err.msg); focusField(err.fieldId); return }
    setErro(null)
    setSubmitting(true)

    const payload = {
      tipoVeiculo: dados.tipoVeiculo,
      tipoPagamento: dados.tipoPagamento,
      nomeDestinatario: dados.nomeDestinatario,
      cepEntrega: dados.cepEntrega,
      solicitante: dados.solicitante,
      quantidade: Number(dados.quantidade),
      peso: Number(dados.peso),
      limiteColeta: new Date(dados.limiteColeta).toISOString().replace("Z", "").slice(0, 19),
      cnpjRemetente: dados.cnpjRemetente || undefined,
      nomeRemetente: dados.nomeRemetente || undefined,
      cnpjDestinatario: dados.cnpjDestinatario || undefined,
      cpfDestinatario: dados.cpfDestinatario || undefined,
      enderecoEntrega: dados.enderecoEntrega || undefined,
      chaveNfe: dados.chaveNfe || undefined,
      numeroNf: dados.numeroNf || undefined,
      pedido: dados.pedido || undefined,
      mercadoria: dados.mercadoria || undefined,
      observacao: dados.observacao || undefined,
      instrucao: dados.instrucao || undefined,
      valorMercadoria: dados.valorMercadoria ? Number(dados.valorMercadoria) : undefined,
      cubagem: dados.cubagem ? Number(dados.cubagem) : undefined,
      reversa: dados.reversa,
    }

    try {
      const res = await fetch("/api/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (!res.ok) {
        setErro(result.error ?? "Erro ao criar entrega")
        setSubmitting(false)
        return
      }

      const entrega = await storage.save({
        ...payload,
        status: "CRIADA",
        numeroColeta: result.numeroColeta || undefined,
        erroSsw: result.erro,
        mensagemSsw: result.mensagem,
        cnpjRemetente: result.cnpjRemetenteUsado || payload.cnpjRemetente,
      })

      // agendamento de entrega (silencioso — não bloqueia o fluxo)
      if (dados.agendarEntrega && dados.dataAgendamento) {
        const [y, m, d] = dados.dataAgendamento.split("-")
        const cnpj = (result.cnpjRemetenteUsado || dados.cnpjRemetente || "").replace(/\D/g, "")
        fetch("/api/agendamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cnpj,
            chave_nfe: dados.chaveNfe || undefined,
            nro_coleta: result.numeroColeta || undefined,
            data_agendamento: `${d}/${m}/${y}`,
            horario_inicio: dados.horaAgendamentoInicio,
            horario_fim: dados.horaAgendamentoFim,
            observacao: dados.obsAgendamento || undefined,
          }),
        }).catch(() => {}) // silencioso — log fica no /logs
      }

      router.push(`/entregas/${entrega.id}`)
    } catch {
      setErro("Falha na conexão. Tente novamente.")
      setSubmitting(false)
    }
  }

  const v = VEICULO_CONFIG[dados.tipoVeiculo]

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex flex-col">
      {/* header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => step > 0 ? setStep((s) => s - 1) : router.back()}
            className="text-gray-500 p-1"
          >
            <ChevronLeft strokeWidth={1.5} className="w-6 h-6" />
          </button>
          <div>
            <p className="text-xs text-gray-400">Etapa {step + 1} de {STEPS.length}</p>
            <h1 className="text-base font-bold text-[#1F1F1F]">{STEPS[step]}</h1>
          </div>
        </div>
        <StepBar steps={STEPS.length} current={step} />
      </header>

      {/* content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">

        {/* STEP 0 — Veículo */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F1F1F] mb-5">Que tipo de veículo?</h2>
            {(Object.keys(VEICULO_CONFIG) as TipoVeiculo[]).map((tipo) => {
              const cfg = VEICULO_CONFIG[tipo]
              const ativo = dados.tipoVeiculo === tipo
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => { set("tipoVeiculo", tipo); setErro(null); setStep(1) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.99] ${
                    ativo ? "border-[#2EA3F2] bg-blue-50" : "border-transparent bg-white shadow-sm"
                  }`}
                >
                  <span className="w-12 h-12 rounded-xl bg-[#F3F3F3] flex items-center justify-center shrink-0">
                    <cfg.Icon strokeWidth={1.5} className="w-8 h-8 text-[#2D3940]" />
                  </span>
                  <div className="text-left flex-1">
                    <p className={`font-semibold text-base ${ativo ? "text-[#2EA3F2]" : "text-[#1F1F1F]"}`}>{cfg.label}</p>
                    <p className="text-sm text-gray-500">
                      {cfg.pesoMax ? `até ${cfg.pesoMax} kg` : "sem limite de peso"}
                      {cfg.qtdMax ? ` · ${cfg.qtdMax} vol.` : ""}
                    </p>
                  </div>
                  {ativo && (
                    <div className="w-6 h-6 rounded-full bg-[#2EA3F2] flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* STEP 1 — Destinatário */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1F1F1F] mb-5">Para quem vai?</h2>
            <Field label="Nome do destinatário *" name="nomeDestinatario" placeholder="Nome completo ou empresa" value={dados.nomeDestinatario} onChange={(e) => set("nomeDestinatario", e.target.value)} />
            <div className="relative">
              <Field label="CEP de entrega *" name="cepEntrega" placeholder="00000-000" inputMode="numeric" maxLength={9} value={dados.cepEntrega} onChange={(e) => { set("cepEntrega", e.target.value); buscarCep(e.target.value) }} />
              {buscandoCep && <Loader2 strokeWidth={1.5} className="absolute right-4 top-9 w-4 h-4 text-[#2EA3F2] animate-spin" />}
            </div>
            <Field label="Endereço completo" name="enderecoEntrega" placeholder="Rua, número, bairro — preenchido pelo CEP" value={dados.enderecoEntrega} onChange={(e) => set("enderecoEntrega", e.target.value)} />
            <Field label="CNPJ do destinatário" name="cnpjDestinatario" placeholder="00.000.000/0001-00" inputMode="numeric" value={dados.cnpjDestinatario} onChange={(e) => set("cnpjDestinatario", e.target.value)} />
            <Field label="CPF do destinatário" name="cpfDestinatario" placeholder="000.000.000-00" inputMode="numeric" value={dados.cpfDestinatario} onChange={(e) => set("cpfDestinatario", e.target.value)} />
          </div>
        )}

        {/* STEP 2 — Carga */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1F1F1F] mb-5">O que vai?</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={`Peso (kg) *${v.pesoMax ? ` — máx ${v.pesoMax}` : ""}`}
                name="peso"
                type="number"
                placeholder="0.0"
                inputMode="decimal"
                step="0.1"
                min="0.1"
                max={v.pesoMax?.toString()}
                value={dados.peso}
                onChange={(e) => set("peso", e.target.value)}
              />
              <Field
                label={`Volumes *${v.qtdMax ? ` — máx ${v.qtdMax}` : ""}`}
                name="quantidade"
                type="number"
                placeholder="1"
                inputMode="numeric"
                min="1"
                max={v.qtdMax?.toString()}
                value={dados.quantidade}
                onChange={(e) => set("quantidade", e.target.value)}
              />
            </div>
            <Field label="Mercadoria" name="mercadoria" placeholder="Ex: Eletrônicos, roupas…" value={dados.mercadoria} onChange={(e) => set("mercadoria", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor (R$)" name="valorMercadoria" type="number" placeholder="0,00" inputMode="decimal" step="0.01" value={dados.valorMercadoria} onChange={(e) => set("valorMercadoria", e.target.value)} />
              <Field label="Cubagem (m³)" name="cubagem" type="number" placeholder="0.0000" inputMode="decimal" step="0.0001" value={dados.cubagem} onChange={(e) => set("cubagem", e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 3 — Detalhes */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1F1F1F] mb-5">Finalizando</h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="limiteColeta" className="text-sm font-medium text-[#2D3940]">Data limite coleta *</label>
              <input
                id="limiteColeta"
                type="datetime-local"
                value={dados.limiteColeta}
                onChange={(e) => set("limiteColeta", e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-[#1F1F1F] bg-white focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]"
              />
            </div>

            <SelectField label="Pagamento do frete" name="tipoPagamento" value={dados.tipoPagamento} onChange={(e) => set("tipoPagamento", e.target.value as "O" | "D")}>
              <option value="O">Pago na origem (remetente)</option>
              <option value="D">Pago no destino (destinatário)</option>
            </SelectField>

            <Field label="Solicitante *" name="solicitante" placeholder="Seu nome" value={dados.solicitante} onChange={(e) => set("solicitante", e.target.value)} />

            <div className="bg-white rounded-2xl p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Documento (opcional)</p>
              <Field
                label="Chave NF-e"
                name="chaveNfe"
                placeholder="44 dígitos"
                maxLength={44}
                inputMode="numeric"
                value={dados.chaveNfe}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "")
                  set("chaveNfe", raw)
                  if (raw.length === 44) {
                    const cnpjEmitente = raw.slice(6, 20)
                    setDados((prev) => ({
                      ...prev,
                      chaveNfe: raw,
                      cnpjRemetente: prev.cnpjRemetente || cnpjEmitente,
                    }))
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número NF" name="numeroNf" placeholder="000000" value={dados.numeroNf} onChange={(e) => set("numeroNf", e.target.value)} />
                <Field label="Pedido" name="pedido" placeholder="Código" value={dados.pedido} onChange={(e) => set("pedido", e.target.value)} />
              </div>
            </div>

            <Field label="Observação (máx 160)" name="observacao" placeholder="Para a transportadora" maxLength={160} value={dados.observacao} onChange={(e) => set("observacao", e.target.value)} />
            <Field label="Instrução (máx 80)" name="instrucao" placeholder="Instruções especiais" maxLength={80} value={dados.instrucao} onChange={(e) => set("instrucao", e.target.value)} />

            <label className="flex items-center gap-3 bg-white rounded-2xl p-4 active:bg-gray-50">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${dados.reversa ? "bg-[#2EA3F2]" : "bg-gray-300"}`}
                onClick={() => set("reversa", !dados.reversa)}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dados.reversa ? "translate-x-6" : "translate-x-0.5"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F1F1F]">Coleta reversa</p>
                <p className="text-xs text-gray-500">Produto sendo devolvido</p>
              </div>
            </label>

            {/* agendamento de entrega */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => set("agendarEntrega", !dados.agendarEntrega)}
                className="w-full flex items-center gap-3 p-4 active:bg-gray-50"
              >
                <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${dados.agendarEntrega ? "bg-[#2EA3F2]" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dados.agendarEntrega ? "translate-x-6" : "translate-x-0.5"}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                    <CalendarClock strokeWidth={1.5} className="w-4 h-4 text-[#2EA3F2]" />
                    Agendar entrega
                  </p>
                  <p className="text-xs text-gray-500">Definir janela de entrega ao destinatário</p>
                </div>
              </button>

              {dados.agendarEntrega && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                  <div className="pt-3">
                    <label className="text-sm font-medium text-[#2D3940] block mb-1.5">Data da entrega *</label>
                    <input
                      type="date"
                      value={dados.dataAgendamento}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => set("dataAgendamento", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F1F1F] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-[#2D3940] block mb-1.5">Início</label>
                      <input
                        type="time"
                        value={dados.horaAgendamentoInicio}
                        onChange={(e) => set("horaAgendamentoInicio", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F1F1F] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2D3940] block mb-1.5">Fim</label>
                      <input
                        type="time"
                        value={dados.horaAgendamentoFim}
                        onChange={(e) => set("horaAgendamentoFim", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F1F1F] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2D3940] block mb-1.5">Observação</label>
                    <input
                      type="text"
                      value={dados.obsAgendamento}
                      onChange={(e) => set("obsAgendamento", e.target.value)}
                      maxLength={160}
                      placeholder="Ex: ligar antes, entregar na portaria…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F1F1F] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {erro && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {erro}
          </div>
        )}
      </div>

      {/* fixed bottom actions — hidden on step 0 (vehicle cards auto-advance) */}
      {step > 0 && (
        <div className="sticky bottom-0 bg-[#F3F3F3] border-t border-gray-200 px-4 py-3 max-w-lg mx-auto w-full">
          {step < STEPS.length - 1 ? (
            <Button onClick={avancar}>
              Próximo →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Criando entrega…" : "Criar Entrega"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
