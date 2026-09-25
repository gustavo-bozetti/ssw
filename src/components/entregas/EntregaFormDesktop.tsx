"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"
import { VEICULO_CONFIG } from "./config"
import type { TipoVeiculo } from "@/lib/storage/types"
import { ChevronLeft, Loader2 } from "lucide-react"
import { focusField } from "@/lib/focusField"
import { maskCNPJ, maskCPF, maskCEP, digits, onlyDigitsKey, validarCPF } from "@/lib/mask"

function defaultLimiteColeta() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}

interface FormData {
  tipoVeiculo: TipoVeiculo
  nomeDestinatario: string
  cepEntrega: string
  enderecoEntrega: string
  bairroEntrega: string
  cidadeEntrega: string
  ufEntrega: string
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
}

function Field({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input id={id} {...props}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}

function Select({ label, id, children, ...props }: { label: string; id: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <select id={id} {...props} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
        {children}
      </select>
    </div>
  )
}

const STEPS = ["Destinatário", "Carga e Detalhes"]

export default function EntregaFormDesktop() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)

  const [dados, setDados] = useState<FormData>({
    tipoVeiculo: "MOTO",
    nomeDestinatario: "",
    cepEntrega: "",
    enderecoEntrega: "",
    bairroEntrega: "",
    cidadeEntrega: "",
    ufEntrega: "",
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
  })

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setDados((prev) => ({ ...prev, [key]: value }))
  }

  async function buscarCep(cep: string) {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) return
      setDados((prev) => ({
        ...prev,
        enderecoEntrega: [data.logradouro, data.complemento].filter(Boolean).join(", "),
        bairroEntrega: data.bairro || prev.bairroEntrega,
        cidadeEntrega: data.localidade || prev.cidadeEntrega,
        ufEntrega: data.uf || prev.ufEntrega,
      }))
    } catch {
      // silently ignore
    } finally {
      setBuscandoCep(false)
    }
  }

  function validarEtapa1(): { msg: string; fieldId: string } | null {
    const cep = dados.cepEntrega.replace(/\D/g, "")
    if (!cep) return { msg: "CEP é obrigatório", fieldId: "d-cepEntrega" }
    if (cep.length !== 8) return { msg: "CEP deve ter 8 dígitos", fieldId: "d-cepEntrega" }
    if (!dados.nomeDestinatario.trim()) return { msg: "Nome do destinatário é obrigatório", fieldId: "d-nomeDestinatario" }
    if (dados.cnpjDestinatario) {
      const cnpj = dados.cnpjDestinatario.replace(/\D/g, "")
      if (cnpj.length !== 14) return { msg: "CNPJ deve ter 14 dígitos", fieldId: "d-cnpjDestinatario" }
    }
    if (dados.cpfDestinatario && !validarCPF(dados.cpfDestinatario)) {
      return { msg: "CPF inválido", fieldId: "d-cpfDestinatario" }
    }
    return null
  }

  function validarEtapa2(): { msg: string; fieldId: string } | null {
    if (!dados.peso || Number(dados.peso) <= 0) return { msg: "Peso é obrigatório", fieldId: "d-peso" }
    if (!dados.quantidade || Number(dados.quantidade) < 1) return { msg: "Volumes é obrigatório", fieldId: "d-quantidade" }
    const v = VEICULO_CONFIG[dados.tipoVeiculo]
    if (v.pesoMax && Number(dados.peso) > v.pesoMax) return { msg: `Peso máximo para ${v.label}: ${v.pesoMax} kg`, fieldId: "d-peso" }
    if (!dados.limiteColeta) return { msg: "Data limite de coleta é obrigatória", fieldId: "d-limiteColeta" }
    if (new Date(dados.limiteColeta) <= new Date()) return { msg: "Data limite deve ser no futuro", fieldId: "d-limiteColeta" }
    if (!dados.solicitante.trim()) return { msg: "Solicitante é obrigatório", fieldId: "d-solicitante" }
    if (dados.chaveNfe && dados.chaveNfe.replace(/\D/g, "").length !== 44) return { msg: "Chave NF-e deve ter 44 dígitos", fieldId: "d-chaveNfe" }
    return null
  }

  function avancar() {
    const err = validarEtapa1()
    if (err) { setErro(err.msg); focusField(err.fieldId); return }
    setErro(null)
    setStep(1)
  }

  async function handleSubmit() {
    const err = validarEtapa2()
    if (err) { setErro(err.msg); focusField(err.fieldId); return }

    setErro(null)
    setSubmitting(true)

    const enderecoFull = [dados.enderecoEntrega, dados.bairroEntrega, dados.cidadeEntrega, dados.ufEntrega].filter(Boolean).join(", ")

    const payload = {
      tipoVeiculo: dados.tipoVeiculo,
      tipoPagamento: dados.tipoPagamento,
      nomeDestinatario: dados.nomeDestinatario,
      cepEntrega: dados.cepEntrega,
      solicitante: dados.solicitante,
      quantidade: Number(dados.quantidade),
      peso: Number(dados.peso),
      limiteColeta: new Date(dados.limiteColeta).toISOString().replace("Z", "").slice(0, 19),
      cnpjRemetente: dados.cnpjRemetente ? digits(dados.cnpjRemetente) : undefined,
      nomeRemetente: dados.nomeRemetente || undefined,
      cnpjDestinatario: dados.cnpjDestinatario ? digits(dados.cnpjDestinatario) : undefined,
      cpfDestinatario: dados.cpfDestinatario ? digits(dados.cpfDestinatario) : undefined,
      enderecoEntrega: enderecoFull || undefined,
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

      router.push(`/entregas/${entrega.id}`)
    } catch {
      setErro("Falha na conexão. Tente novamente.")
      setSubmitting(false)
    }
  }

  const v = VEICULO_CONFIG[dados.tipoVeiculo]

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
          <span className="text-sm text-gray-400">Nova Entrega</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-ink">{STEPS[step]}</span>

          <div className="ml-4 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-emerald-400" : "w-3 bg-gray-200"}`} />
            ))}
          </div>
        </div>
      </header>

      {/* etapa 1 — destinatário */}
      {step === 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 px-8 py-6 grid grid-cols-2 gap-6 min-h-0">
              {/* coluna esquerda: destinatário + remetente */}
              <div className="flex flex-col gap-6">
                <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Destinatário</p>
                  <Field label="Nome / Razão Social *" id="d-nomeDestinatario" placeholder="Cliente ou empresa" value={dados.nomeDestinatario} onChange={(e) => set("nomeDestinatario", e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="CNPJ" id="d-cnpjDestinatario" placeholder="00.000.000/0001-00" inputMode="numeric" value={dados.cnpjDestinatario} onChange={(e) => set("cnpjDestinatario", maskCNPJ(e.target.value))} />
                    <Field label="CPF" id="d-cpfDestinatario" placeholder="000.000.000-00" inputMode="numeric" value={dados.cpfDestinatario} onChange={(e) => set("cpfDestinatario", maskCPF(e.target.value))} onKeyDown={onlyDigitsKey} />
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Remetente (opcional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="CNPJ" id="d-cnpjRemetente" placeholder="00.000.000/0001-00" inputMode="numeric" value={dados.cnpjRemetente} onChange={(e) => set("cnpjRemetente", maskCNPJ(e.target.value))} />
                    <Field label="Nome / Razão Social" id="d-nomeRemetente" placeholder="Empresa de origem" value={dados.nomeRemetente} onChange={(e) => set("nomeRemetente", e.target.value)} />
                  </div>
                </section>
              </div>

              {/* coluna direita: endereço com CEP no topo */}
              <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Endereço de entrega</p>
                <div className="relative">
                  <Field
                    label="CEP *"
                    id="d-cepEntrega"
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                    value={dados.cepEntrega}
                    onChange={(e) => { const v = maskCEP(e.target.value); set("cepEntrega", v); buscarCep(v) }}
                    onKeyDown={onlyDigitsKey}
                  />
                  {buscandoCep && <Loader2 strokeWidth={1.5} className="absolute right-3 top-9 w-4 h-4 text-primary animate-spin" />}
                </div>
                <Field label="Rua / Logradouro" id="d-enderecoEntrega" placeholder="Preenchido pelo CEP" value={dados.enderecoEntrega} onChange={(e) => set("enderecoEntrega", e.target.value)} />
                <Field label="Bairro" id="d-bairroEntrega" placeholder="Centro" value={dados.bairroEntrega} onChange={(e) => set("bairroEntrega", e.target.value)} />
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="Cidade" id="d-cidadeEntrega" placeholder="São Paulo" value={dados.cidadeEntrega} onChange={(e) => set("cidadeEntrega", e.target.value)} />
                  </div>
                  <Field label="UF" id="d-ufEntrega" placeholder="SP" maxLength={2} value={dados.ufEntrega} onChange={(e) => set("ufEntrega", e.target.value.toUpperCase())} />
                </div>
              </section>
          </div>

          {erro && <div className="mx-8 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">{erro}</div>}

          <div className="px-8 pb-6 pt-4 flex justify-end">
            <button type="button" onClick={avancar} className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors">
              Próximo: Carga e Detalhes →
            </button>
          </div>
        </div>
      )}

      {/* etapa 2 — carga e detalhes */}
      {step === 1 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 px-8 py-6 grid grid-cols-2 gap-6 min-h-0">
            {/* coluna esquerda: veículo + carga + documento */}
            <div className="flex flex-col gap-6">
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Tipo de veículo</p>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(VEICULO_CONFIG) as TipoVeiculo[]).map((tipo) => {
                    const cfg = VEICULO_CONFIG[tipo]
                    const ativo = dados.tipoVeiculo === tipo
                    return (
                      <button key={tipo} type="button" onClick={() => set("tipoVeiculo", tipo)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-primary/50 ${ativo ? "border-primary bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                        <cfg.Icon strokeWidth={1.5} className={`w-7 h-7 ${ativo ? "text-primary" : "text-navy"}`} />
                        <span className={`text-xs font-semibold ${ativo ? "text-primary" : "text-ink"}`}>{cfg.label}</span>
                        {cfg.pesoMax && <span className="text-[10px] text-gray-400">até {cfg.pesoMax} kg</span>}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Carga</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={`Peso (kg) *${v.pesoMax ? ` — máx ${v.pesoMax}` : ""}`} id="d-peso" type="number" placeholder="0.0" inputMode="decimal" step="0.1" min="0.1" max={v.pesoMax?.toString()} value={dados.peso} onChange={(e) => set("peso", e.target.value)} />
                  <Field label={`Volumes *${v.qtdMax ? ` — máx ${v.qtdMax}` : ""}`} id="d-quantidade" type="number" placeholder="1" inputMode="numeric" min="1" max={v.qtdMax?.toString()} value={dados.quantidade} onChange={(e) => set("quantidade", e.target.value)} />
                </div>
                <Field label="Mercadoria" id="d-mercadoria" placeholder="Ex: Eletrônicos, roupas…" value={dados.mercadoria} onChange={(e) => set("mercadoria", e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor NF (R$)" id="d-valorMercadoria" type="number" placeholder="0,00" inputMode="decimal" step="0.01" value={dados.valorMercadoria} onChange={(e) => set("valorMercadoria", e.target.value)} />
                  <Field label="Cubagem (m³)" id="d-cubagem" type="number" placeholder="0.0000" inputMode="decimal" step="0.0001" value={dados.cubagem} onChange={(e) => set("cubagem", e.target.value)} />
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Documento</p>
                <Field label="Chave NF-e" id="d-chaveNfe" placeholder="44 dígitos" maxLength={44} inputMode="numeric" value={dados.chaveNfe} onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "")
                  setDados((prev) => ({
                    ...prev,
                    chaveNfe: raw,
                    cnpjRemetente: prev.cnpjRemetente || (raw.length === 44 ? raw.slice(6, 20) : prev.cnpjRemetente),
                  }))
                }} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Número NF" id="d-numeroNf" placeholder="000000" value={dados.numeroNf} onChange={(e) => set("numeroNf", e.target.value)} />
                  <Field label="Pedido" id="d-pedido" placeholder="Código" value={dados.pedido} onChange={(e) => set("pedido", e.target.value)} />
                </div>
              </section>
            </div>

            {/* coluna direita: detalhes operacionais */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 h-fit">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Detalhes</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="d-limiteColeta" className="block text-xs font-medium text-gray-500 mb-1.5">Data limite coleta *</label>
                  <input id="d-limiteColeta" type="datetime-local" value={dados.limiteColeta} onChange={(e) => set("limiteColeta", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <Select label="Pagamento do frete" id="d-tipoPagamento" value={dados.tipoPagamento} onChange={(e) => set("tipoPagamento", e.target.value as "O" | "D")}>
                  <option value="O">Origem (remetente)</option>
                  <option value="D">Destino (destinatário)</option>
                </Select>
              </div>
              <Field label="Solicitante *" id="d-solicitante" placeholder="Seu nome" value={dados.solicitante} onChange={(e) => set("solicitante", e.target.value)} />
              <Field label="Observação (máx 160)" id="d-observacao" placeholder="Para a transportadora" maxLength={160} value={dados.observacao} onChange={(e) => set("observacao", e.target.value)} />
              <Field label="Instrução (máx 80)" id="d-instrucao" placeholder="Instruções especiais" maxLength={80} value={dados.instrucao} onChange={(e) => set("instrucao", e.target.value)} />
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${dados.reversa ? "bg-primary" : "bg-gray-200"}`} onClick={() => set("reversa", !dados.reversa)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dados.reversa ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Coleta reversa</p>
                  <p className="text-xs text-gray-400">Produto sendo devolvido</p>
                </div>
              </label>
            </section>
          </div>

          {erro && <div className="mx-8 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">{erro}</div>}

          <div className="px-8 pb-6 pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => { setErro(null); setStep(0) }} className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              ← Voltar
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting} className="bg-primary text-white font-semibold px-8 py-3 rounded-xl disabled:opacity-50 hover:bg-primary-dark transition-colors">
              {submitting ? "Criando entrega…" : "Criar Entrega →"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
