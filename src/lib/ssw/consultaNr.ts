import { fetchWithAuth } from "./auth"
import { withRetry, restCircuit, sswLog } from "./resilience"

const SSW_BASE = "https://ssw.inf.br"

export interface QrCode {
  numeroRastreamento: string
  seqCtrc: string
}

export interface Etiqueta {
  unidadeEntrega?: string
  unidadeCentralizadora?: string
  setorDestino?: string
  dataPrevisaoEntrega?: string
  volume?: number
  notaFiscal?: string
  codigo?: string
  ctrc?: string
  remetente?: string
  peso?: number
  entrega?: string
  numeroRastreamento?: string
  site?: string
  praca?: string
  qrCode?: QrCode
}

export interface ConsultaNrResponse {
  success: boolean
  message: string
  etiquetas?: Etiqueta[]
}

export async function consultarNr(chave_nfe: string): Promise<ConsultaNrResponse> {
  const t0 = Date.now()
  const result = await withRetry(
    async () => {
      const res = await fetchWithAuth(
        `${SSW_BASE}/api/consultaNr?chave_nfe=${encodeURIComponent(chave_nfe)}`
      )
      if (!res.ok) throw new Error(`SSW consultaNr HTTP ${res.status}`)
      return res.json() as Promise<ConsultaNrResponse>
    },
    "rest:consultaNr",
    { attempts: 2, baseMs: 300, circuit: restCircuit }
  )
  sswLog("info", "rest:consultaNr", "ok", { ms: Date.now() - t0 })
  return result
}

export type TipoImpressao = "ZPL" | "EPL" | "PPLA"

export interface EtiquetaImpressao {
  arquivoImpressao?: string // base64
  numeroRastreamento?: string
  volume?: number
  peso?: number
}

export interface ConsultaNrImpResponse {
  success: boolean
  message: string
  etiquetas?: EtiquetaImpressao[]
}

export async function consultarNrImp(
  chave_nfe: string,
  tipo_imp: TipoImpressao
): Promise<ConsultaNrImpResponse> {
  const t0 = Date.now()
  const result = await withRetry(
    async () => {
      const res = await fetchWithAuth(
        `${SSW_BASE}/api/consultaNrImp?tipo_imp=${tipo_imp}&chave_nfe=${encodeURIComponent(chave_nfe)}`
      )
      if (!res.ok) throw new Error(`SSW consultaNrImp HTTP ${res.status}`)
      return res.json() as Promise<ConsultaNrImpResponse>
    },
    `rest:consultaNrImp:${tipo_imp}`,
    { attempts: 2, baseMs: 300, circuit: restCircuit }
  )
  sswLog("info", `rest:consultaNrImp:${tipo_imp}`, "ok", { ms: Date.now() - t0 })
  return result
}
