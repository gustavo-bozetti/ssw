"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"
import { VEICULO_CONFIG } from "./config"
import type { TipoVeiculo } from "@/lib/storage/types"
import { Field, SelectField } from "@/components/ui/Field"
import { ChevronLeft, Loader2 } from "lucide-react"
import { focusField } from "@/lib/focusField"

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

export default function EntregaFormDesktop() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)

  const [dados, setDados] = useState<FormData>({
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
  })

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setDados((prev) => ({ ...prev, [key]: value }))
  }

  function validar(): { msg: string; fieldId: string } | null {
    if (!dados.nomeDestinatario.trim()) return { msg: "Nome do destinatário é obrigatório", fieldId: "d-nomeDestinatario" }
    const cep = dados.cepEntrega.replace(/\D/g, "")
    if (!cep) return { msg: "CEP é obrigatório", fieldId: "d-cepEntrega" }
    if (cep.length !== 8) return { msg: "CEP deve ter 8 dígitos", fieldId: "d-cepEntrega" }
    if (dados.cnpjDestinatario) {
      const cnpj = dados.cnpjDestinatario.replace(/\D/g, "")
      if (cnpj.length !== 14) return { msg: "CNPJ do destinatário deve ter 14 dígitos", fieldId: "d-cnpjDestinatario" }
    }
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
      // silently ignore
    } finally {
      setBuscandoCep(false)
    }
  }

  async function handleSubmit() {
    const err = validar()
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

      router.push(`/entregas/${entrega.id}`)
    } catch {
      setErro("Falha na conexão. Tente novamente.")
      setSubmitting(false)
    }
  }

  const v = VEICULO_CONFIG[dados.tipoVeiculo]

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 flex items-center gap-1.5 text-sm transition-colors">
            <ChevronLeft strokeWidth={1.5} className="w-4 h-4" />
            Entregas
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <h1 className="text-base font-bold text-[#1F1F1F]">Nova Entrega</h1>
        </div>
      </header>

      <div className="px-8 py-6">
        <div className="flex gap-6 items-start">
          {/* col 1: veículo + destinatário */}
          <div className="flex-1 min-w-0 space-y-5">
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Veículo</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(VEICULO_CONFIG) as TipoVeiculo[]).map((tipo) => {
                  const cfg = VEICULO_CONFIG[tipo]
                  const ativo = dados.tipoVeiculo === tipo
                  return (
                    <button key={tipo} type="button" onClick={() => set("tipoVeiculo", tipo)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:border-[#2EA3F2]/50 ${ativo ? "border-[#2EA3F2] bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                      <cfg.Icon strokeWidth={1.5} className={`w-7 h-7 ${ativo ? "text-[#2EA3F2]" : "text-[#2D3940]"}`} />
                      <span className={`text-xs font-semibold ${ativo ? "text-[#2EA3F2]" : "text-[#1F1F1F]"}`}>{cfg.label}</span>
                      {cfg.pesoMax && <span className="text-[10px] text-gray-400">até {cfg.pesoMax} kg</span>}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Destinatário</p>
              <Field label="Nome *" name="d-nomeDestinatario" placeholder="Nome completo ou empresa" value={dados.nomeDestinatario} onChange={(e) => set("nomeDestinatario", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Field label="CEP *" name="d-cepEntrega" placeholder="00000-000" inputMode="numeric" maxLength={9} value={dados.cepEntrega} onChange={(e) => { set("cepEntrega", e.target.value); buscarCep(e.target.value) }} />
                  {buscandoCep && <Loader2 strokeWidth={1.5} className="absolute right-4 top-9 w-4 h-4 text-[#2EA3F2] animate-spin" />}
                </div>
                <Field label="CNPJ destinatário" name="d-cnpjDestinatario" placeholder="00.000.000/0001-00" inputMode="numeric" value={dados.cnpjDestinatario} onChange={(e) => set("cnpjDestinatario", e.target.value)} />
              </div>
              <Field label="Endereço completo" name="d-enderecoEntrega" placeholder="Rua, número, bairro — preenchido pelo CEP" value={dados.enderecoEntrega} onChange={(e) => set("enderecoEntrega", e.target.value)} />
              <Field label="CPF destinatário" name="d-cpfDestinatario" placeholder="000.000.000-00" inputMode="numeric" value={dados.cpfDestinatario} onChange={(e) => set("cpfDestinatario", e.target.value)} />
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Remetente (opcional)</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="CNPJ remetente" name="d-cnpjRemetente" placeholder="00.000.000/0001-00" inputMode="numeric" value={dados.cnpjRemetente} onChange={(e) => set("cnpjRemetente", e.target.value)} />
                <Field label="Nome remetente" name="d-nomeRemetente" placeholder="Empresa remetente" value={dados.nomeRemetente} onChange={(e) => set("nomeRemetente", e.target.value)} />
              </div>
            </section>
          </div>

          {/* col 2: carga + documento */}
          <div className="flex-1 min-w-0 space-y-5">
            <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Carga</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label={`Peso (kg) *${v.pesoMax ? ` — máx ${v.pesoMax}` : ""}`} name="d-peso" type="number" placeholder="0.0" inputMode="decimal" step="0.1" min="0.1" max={v.pesoMax?.toString()} value={dados.peso} onChange={(e) => set("peso", e.target.value)} />
                <Field label={`Volumes *${v.qtdMax ? ` — máx ${v.qtdMax}` : ""}`} name="d-quantidade" type="number" placeholder="1" inputMode="numeric" min="1" max={v.qtdMax?.toString()} value={dados.quantidade} onChange={(e) => set("quantidade", e.target.value)} />
              </div>
              <Field label="Mercadoria" name="d-mercadoria" placeholder="Ex: Eletrônicos, roupas…" value={dados.mercadoria} onChange={(e) => set("mercadoria", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Valor NF (R$)" name="d-valorMercadoria" type="number" placeholder="0,00" inputMode="decimal" step="0.01" value={dados.valorMercadoria} onChange={(e) => set("valorMercadoria", e.target.value)} />
                <Field label="Cubagem (m³)" name="d-cubagem" type="number" placeholder="0.0000" inputMode="decimal" step="0.0001" value={dados.cubagem} onChange={(e) => set("cubagem", e.target.value)} />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Documento</p>
              <Field label="Chave NF-e" name="d-chaveNfe" placeholder="44 dígitos" maxLength={44} inputMode="numeric" value={dados.chaveNfe} onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "")
                set("chaveNfe", raw)
                if (raw.length === 44) {
                  setDados((prev) => ({ ...prev, chaveNfe: raw, cnpjRemetente: prev.cnpjRemetente || raw.slice(6, 20) }))
                }
              }} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Número NF" name="d-numeroNf" placeholder="000000" value={dados.numeroNf} onChange={(e) => set("numeroNf", e.target.value)} />
                <Field label="Pedido" name="d-pedido" placeholder="Código" value={dados.pedido} onChange={(e) => set("pedido", e.target.value)} />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Observações</p>
              <Field label="Observação (máx 160)" name="d-observacao" placeholder="Para a transportadora" maxLength={160} value={dados.observacao} onChange={(e) => set("observacao", e.target.value)} />
              <Field label="Instrução (máx 80)" name="d-instrucao" placeholder="Instruções especiais" maxLength={80} value={dados.instrucao} onChange={(e) => set("instrucao", e.target.value)} />
            </section>
          </div>

          {/* col 3: detalhes + submit */}
          <div className="w-[260px] shrink-0 space-y-5">
            <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Detalhes</p>
              <div>
                <label htmlFor="d-limiteColeta" className="text-sm font-medium text-[#2D3940] block mb-1.5">Data limite coleta *</label>
                <input id="d-limiteColeta" type="datetime-local" value={dados.limiteColeta} onChange={(e) => set("limiteColeta", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1F1F1F] bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2EA3F2]" />
              </div>
              <SelectField label="Pagamento do frete" name="d-tipoPagamento" value={dados.tipoPagamento} onChange={(e) => set("tipoPagamento", e.target.value as "O" | "D")}>
                <option value="O">Origem (remetente)</option>
                <option value="D">Destino (destinatário)</option>
              </SelectField>
              <Field label="Solicitante *" name="d-solicitante" placeholder="Seu nome" value={dados.solicitante} onChange={(e) => set("solicitante", e.target.value)} />
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${dados.reversa ? "bg-[#2EA3F2]" : "bg-gray-300"}`} onClick={() => set("reversa", !dados.reversa)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dados.reversa ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F1F1F]">Coleta reversa</p>
                  <p className="text-xs text-gray-400">Produto sendo devolvido</p>
                </div>
              </label>
            </section>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{erro}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-[#2EA3F2] text-white font-semibold py-3 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? "Criando entrega…" : "Criar Entrega"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
