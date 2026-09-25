import { sql } from "@/lib/db"
import { verificarWebhookAuth } from "@/lib/webhook-auth"
import { dataSSW, num, faturaId } from "@/lib/ssw-parse"

type Registro = Record<string, unknown>

export async function POST(request: Request) {
  if (!verificarWebhookAuth(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() }
  catch { return Response.json({ error: "Corpo inválido" }, { status: 400 }) }

  const faturas = (body as { DetalheFaturaCanc?: unknown[] }).DetalheFaturaCanc
  if (!Array.isArray(faturas) || faturas.length === 0) {
    return Response.json({ error: "DetalheFaturaCanc ausente ou vazio" }, { status: 400 })
  }

  const resultados = []

  for (const f of faturas as Registro[]) {
    const numeroFatura = num(f.numeroDaFatura) ?? 0
    try {
      const id = faturaId(f.cnpj, f.numeroDaFatura)

      const linhas = await sql`
        UPDATE faturas SET
          status            = 'CANCELADA',
          data_cancelamento = ${dataSSW(f.dataCancelamento)},
          valor_acrescimo   = ${num(f.valorDeAcrescimos)},
          valor_credito     = ${num(f.valorDeCredito)},
          valor_total       = ${num(f.valorTotalDaFatura) ?? 0},
          valor_total_ctrc  = ${num(f.valorTotalDosCtrcDaFatura)},
          updated_at        = NOW()
        WHERE id = ${id}
        RETURNING id
      `

      if (linhas.length === 0) {
        throw new Error(`Fatura ${numeroFatura} não encontrada`)
      }

      resultados.push({ retorno: { codigo: 200, descricao: "", protocolo: id, numeroFatura } })
    } catch (err) {
      resultados.push({
        retorno: {
          codigo: 400,
          descricao: err instanceof Error ? err.message : "Erro ao cancelar fatura",
          protocolo: "",
          numeroFatura,
        },
      })
    }
  }

  return Response.json(resultados)
}
