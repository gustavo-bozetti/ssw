import { sswLog, restCircuit, fetchWithTimeout } from "./resilience"

interface TokenCache {
  token: string
  expiresAt: number
}

let cache: TokenCache | null = null

export async function getToken(force = false): Promise<string> {
  const now = Date.now()

  if (!force && cache && cache.expiresAt > now + 60_000) {
    return cache.token
  }

  if (restCircuit.isOpen()) {
    throw new Error("SSW indisponível (circuit open)")
  }

  const t0 = Date.now()
  const res = await fetchWithTimeout("https://ssw.inf.br/api/generateToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: process.env.SSW_DOMINIO,
      username: process.env.SSW_LOGIN,
      password: process.env.SSW_SENHA,
      cnpj_edi: process.env.SSW_CNPJ_EDI,
    }),
  })

  if (!res.ok) {
    restCircuit.onFailure()
    sswLog("error", "rest:generateToken", `HTTP ${res.status}`, { ms: Date.now() - t0 })
    throw new Error(`SSW generateToken HTTP ${res.status}`)
  }

  const data = await res.json() as {
    sucess: boolean
    token: string
    validity: string
    message: string
  }

  if (!data.sucess) {
    sswLog("warn", "rest:generateToken", `auth rejeitado: ${data.message}`, { ms: Date.now() - t0 })
    throw new Error(`SSW auth: ${data.message}`)
  }

  restCircuit.onSuccess()
  sswLog("info", "rest:generateToken", "token obtido", { ms: Date.now() - t0 })

  const [h, m, s] = data.validity.split(":").map(Number)
  const ttlMs = ((h * 3600) + (m * 60) + s) * 1000

  cache = { token: data.token, expiresAt: now + ttlMs }
  return cache.token
}

export function invalidateToken() {
  cache = null
}

/** Executa uma requisição autenticada. Se receber 401, invalida o token e retenta uma vez. */
export async function fetchWithAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  const res = await fetchWithTimeout(url, {
    ...init,
    headers: { ...init.headers, authorization: token },
  })

  if (res.status === 401) {
    invalidateToken()
    const newToken = await getToken(true)
    return fetchWithTimeout(url, {
      ...init,
      headers: { ...init.headers, authorization: newToken },
    })
  }

  return res
}
