import { fetchWithAuth } from "./auth"
import { withRetry, restCircuit, sswLog } from "./resilience"

const SSW_BASE = "https://ssw.inf.br"

export interface CtePayload {
  placaColeta: string
  codigoMercadoria: number
  codigoEspecie: number
  codigoConferente: number
  cargaFechada: "S" | "N"
  tipoDocumento: "CTE" | "RPS"
  siglaEmissora?: string
  numPedido?: string
  xmlBase64: string
}

export interface CteResponse {
  sucesso: boolean
  mensagem: string
}

export async function enviarCte(payload: CtePayload): Promise<CteResponse> {
  const t0 = Date.now()
  const result = await withRetry(
    async () => {
      const res = await fetchWithAuth(`${SSW_BASE}/api/xmlCTeExterno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`SSW xmlCTeExterno HTTP ${res.status}`)
      return res.json() as Promise<CteResponse>
    },
    "rest:xmlCTeExterno",
    { attempts: 2, baseMs: 300, circuit: restCircuit }
  )
  sswLog("info", "rest:xmlCTeExterno", "ok", { ms: Date.now() - t0 })
  return result
}
