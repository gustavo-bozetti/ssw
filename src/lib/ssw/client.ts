import type {
  ColetaPayload,
  ColetaResponse,
  TrackingPayload,
  TrackingResponse,
  TrackingDanfeResponse,
} from "./types"
import type { OcorrenciaPayload, OcorrenciaResponse } from "./ocorrencias"
import { fetchWithAuth } from "./auth"
import { withRetry, restCircuit, sswLog, fetchWithTimeout } from "./resilience"

const SSW_BASE = "https://ssw.inf.br"

const credentials = {
  dominio: process.env.SSW_DOMINIO!,
  login: process.env.SSW_LOGIN!,
  senha: process.env.SSW_SENHA!,
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const t0 = Date.now()
  const result = await withRetry(
    async () => {
      const res = await fetchWithTimeout(`${SSW_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`SSW HTTP ${res.status}: ${path}`)
      return res.json() as Promise<T>
    },
    `rest:${path}`,
    { attempts: 2, baseMs: 300, circuit: restCircuit }
  )
  sswLog("info", `rest:${path}`, "ok", { ms: Date.now() - t0 })
  return result
}

async function postWithAuth<T>(path: string, body: unknown): Promise<T> {
  const t0 = Date.now()
  const result = await withRetry(
    async () => {
      const res = await fetchWithAuth(`${SSW_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`SSW HTTP ${res.status}: ${path}`)
      return res.json() as Promise<T>
    },
    `rest-auth:${path}`,
    { attempts: 2, baseMs: 300, circuit: restCircuit }
  )
  sswLog("info", `rest-auth:${path}`, "ok", { ms: Date.now() - t0 })
  return result
}

export async function criarColeta(
  params: Omit<ColetaPayload, "dominio" | "login" | "senha">
): Promise<ColetaResponse> {
  return post<ColetaResponse>("/ws/sswColeta/v1/coleta", {
    ...credentials,
    ...params,
  })
}

export async function rastrearPorColeta(params: TrackingPayload): Promise<TrackingResponse> {
  return post<TrackingResponse>("/api/tracking", params as unknown as Record<string, unknown>)
}

export async function rastrearPorDanfe(chave_nfe: string): Promise<TrackingDanfeResponse> {
  return post<TrackingDanfeResponse>("/api/trackingdanfe", { chave_nfe })
}

export async function registrarOcorrencia(
  payload: OcorrenciaPayload
): Promise<OcorrenciaResponse> {
  return postWithAuth<OcorrenciaResponse>("/api/ocorrenciaParceiro", payload)
}

export interface TrackingPfParams {
  cpf: string
  nro_nf?: number
  pedido?: string
  chave_nfe?: string
}

export async function trackingPf(params: TrackingPfParams): Promise<unknown> {
  return post<unknown>("/api/trackingpf", {
    dominio: credentials.dominio,
    usuario: credentials.login,
    senha: credentials.senha,
    ...params,
  })
}

export interface TrackingDestParams {
  cnpj: string
  senha?: string
  sigla_emp?: string
  nro_nf?: number
  pedido?: string
  chave_nfe?: string
  nro_coleta?: number
}

export async function trackingDest(params: TrackingDestParams): Promise<unknown> {
  return post<unknown>("/api/trackingdest", params as unknown as Record<string, unknown>)
}

export interface TrackingPagParams {
  cnpj: string
  senha?: string
  sigla_emp?: string
  nro_nf?: number
  pedido?: string
  chave_nfe?: string
  nro_coleta?: number
}

export async function trackingPag(params: TrackingPagParams): Promise<unknown> {
  return post<unknown>("/api/trackingpag", params as unknown as Record<string, unknown>)
}
