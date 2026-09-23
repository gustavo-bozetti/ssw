import { fetchWithAuth } from "./auth"
import { withRetry, restCircuit, sswLog } from "./resilience"

const SSW_BASE = "https://ssw.inf.br"

export interface EnderecoNotfis {
  rua: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  cep: number
}

export interface NfNotfis {
  tipoNF?: "NORMAL" | "REVERSA" | "DEVOLUCAO"
  condicaoFrete: "CIF" | "FOB"
  numero: number
  serie: string
  chaveNFe?: string
  dataEmissao: string   // DD/MM/AAAA
  qtdeVolumes: number
  valorMercadoria: number
  pesoReal: number
  cubagem?: number
  pedido?: string
  valorFrete?: number
  codServico?: number
  tipoServico?: string
  itens?: Array<{
    codigo?: string
    descricao?: string
    qtde?: number
    valorUnit?: number
    codigoNCM?: string
    unidade?: string
  }>
}

export interface DestinatarioNotfis {
  cnpj: string
  nome: string
  inscr?: string
  telefone?: string
  celular?: string
  email?: string
  endereco: EnderecoNotfis
  nf: NfNotfis[]
}

export interface NotfisPayload {
  lote?: string
  dados: Array<{
    cnpj?: string
    remetente?: {
      cnpj: string
      nome: string
      inscr?: string
      endereco?: EnderecoNotfis
    }
    destinatario: DestinatarioNotfis[]
  }>
}

export interface NotfisResultItem {
  sucesso: boolean
  mensagem: string
  remetente: string
  destinatario: string
  notaFiscal: number
  pedido: string
  protocolo: string
}

export async function enviarNotfis(payload: NotfisPayload): Promise<NotfisResultItem[]> {
  const t0 = Date.now()
  const data = await withRetry(
    async () => {
      const res = await fetchWithAuth(`${SSW_BASE}/api/notfis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`SSW NOTFIS HTTP ${res.status}`)
      return res.json()
    },
    "rest:notfis",
    { attempts: 2, baseMs: 300, circuit: restCircuit }
  )
  sswLog("info", "rest:notfis", "ok", { ms: Date.now() - t0 })
  return Array.isArray(data) ? data : [data]
}
