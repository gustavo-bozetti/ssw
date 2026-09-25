/** SSW envia datas como YYYYMMDD (numérico ou string). */
export function dataSSW(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null
  const s = String(v).trim()
  if (!/^\d{8}$/.test(s)) return null
  const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(String(v).replace(",", "."))
  return Number.isNaN(n) ? null : n
}

export function txt(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s
}

/** Uma fatura é única por transportadora + número. */
export function faturaId(cnpj: unknown, numeroFatura: unknown): string {
  return `${txt(cnpj) ?? ""}-${txt(numeroFatura) ?? ""}`
}
