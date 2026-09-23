import { fetchWithAuth } from "./auth"
import { withRetry, restCircuit, sswLog } from "./resilience"

const SSW_BASE = "https://ssw.inf.br"

export interface AgendamentoPayload {
  cnpj: string          // CNPJ/CPF do remetente ou pagador
  chave_nfe?: string    // chave NF-e (44 dígitos) — use este ou nro_coleta
  nro_coleta?: string   // número da coleta SSW
  data_agendamento: string   // DD/MM/AAAA
  horario_inicio: string     // HH:MM
  horario_fim: string        // HH:MM
  observacao?: string
}

export interface AgendamentoResponse {
  sucesso: boolean
  mensagem: string
  protocolo?: string
}

export async function agendarEntrega(payload: AgendamentoPayload): Promise<AgendamentoResponse> {
  const t0 = Date.now()
  const result = await withRetry(
    async () => {
      const res = await fetchWithAuth(`${SSW_BASE}/api/agendaEntrega`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`SSW agendaEntrega HTTP ${res.status}`)
      return res.json() as Promise<AgendamentoResponse>
    },
    "rest:agendaEntrega",
    { attempts: 2, baseMs: 300, circuit: restCircuit }
  )
  sswLog("info", "rest:agendaEntrega", "ok", { ms: Date.now() - t0 })
  return result
}
