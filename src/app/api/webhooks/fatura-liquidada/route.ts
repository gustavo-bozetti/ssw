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

  const faturas = (body as { DetalheFatura?: unknown[] }).DetalheFatura
  if (!Array.isArray(faturas) || faturas.length === 0) {
    return Response.json({ error: "DetalheFatura ausente ou vazio" }, { status: 400 })
  }

  const resultados = []

  for (const f of faturas as Registro[]) {
    const numeroFatura = num(f.numeroDaFatura) ?? 0
    try {
      const id = faturaId(f.cnpj, f.numeroDaFatura)

      const linhas = await sql`
        UPDATE faturas SET
          status          = 'LIQUIDADA',
          data_liquidacao = ${dataSSW(f.dataLiquidacao)},
          data_credito    = ${dataSSW(f.dataCreditoCaixa)},
          valor_juros     = ${num(f.valorDeJuros)},
          valor_desconto  = ${num(f.valorDeDesconto)},
          valor_pago      = ${num(f.valorPago)},
          updated_at      = NOW()
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
          descricao: err instanceof Error ? err.message : "Erro ao liquidar fatura",
          protocolo: "",
          numeroFatura,
        },
      })
    }
  }

  return Response.json(resultados)
}
