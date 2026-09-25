import { sql } from "@/lib/db"
import { verificarWebhookAuth } from "@/lib/webhook-auth"
import { dataSSW, num, txt, faturaId } from "@/lib/ssw-parse"

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

      await sql`
        INSERT INTO faturas (
          id, numero_fatura, nosso_numero,
          cnpj_transportadora, nome_transportadora,
          cnpj_devedor, nome_devedor,
          banco, agencia, conta, carteira,
          unidade_cobranca, tipo_cobranca,
          data_emissao, data_vencimento,
          valor_total, valor_total_ctrc, valor_acrescimo, valor_credito,
          url_impressao, status
        ) VALUES (
          ${id},
          ${numeroFatura},
          ${txt(f.numero)},
          ${txt(f.cnpj) ?? ""},
          ${txt(f.razaoSocial)},
          ${txt(f.cnpjSacado)},
          ${txt(f.razaoSocialSacado)},
          ${txt(f.banco)},
          ${txt(f.agencia)},
          ${txt(f.conta)},
          ${txt(f.carteira)},
          ${txt(f.unidadeDeCobranca)},
          ${txt(f.tipoCobranca)},
          ${dataSSW(f.dataEmissaoDaFatura)},
          ${dataSSW(f.dataVencimento)},
          ${num(f.valorTotalDaFatura) ?? 0},
          ${num(f.valorTotaldosCtrcDaFatura)},
          ${num(f.valorDeAcrescimos)},
          ${num(f.valorDeCredito)},
          ${txt(f.urlImpressao)},
          'EMITIDA'
        )
        ON CONFLICT (id) DO UPDATE SET
          status           = 'EMITIDA',
          nosso_numero     = EXCLUDED.nosso_numero,
          url_impressao    = EXCLUDED.url_impressao,
          data_emissao     = EXCLUDED.data_emissao,
          data_vencimento  = EXCLUDED.data_vencimento,
          valor_total      = EXCLUDED.valor_total,
          valor_total_ctrc = EXCLUDED.valor_total_ctrc,
          valor_acrescimo  = EXCLUDED.valor_acrescimo,
          valor_credito    = EXCLUDED.valor_credito,
          updated_at       = NOW()
      `

      // Reentrega do webhook: recria os filhos em vez de duplicar.
      await sql`DELETE FROM fatura_ctrc WHERE fatura_id = ${id}`
      await sql`DELETE FROM fatura_nf   WHERE fatura_id = ${id}`

      for (const c of (f.ctrc as Registro[]) ?? []) {
        await sql`
          INSERT INTO fatura_ctrc (
            fatura_id, serie, numero, cte_serie, cte_numero,
            chave_cte, valor_frete, tipo_documento
          ) VALUES (
            ${id},
            ${txt(c.ctrcSerie)},
            ${num(c.ctrcNumero)},
            ${txt(c.ctrcSerieCte)},
            ${txt(c.ctrcNumeroCte)},
            ${txt(c.ctrcChaveCte)},
            ${num(c.ctrcValorFrete)},
            ${txt(c.ctrcTipoDocumento)}
          )
        `

        for (const n of (c.notasFiscais as Registro[]) ?? []) {
          await sql`
            INSERT INTO fatura_nf (fatura_id, serie, numero, chave_nfe, pedido)
            VALUES (
              ${id},
              ${txt(n.serieNF)},
              ${num(n.numeroNF)},
              ${txt(n.chaveNF)},
              ${num(n.pedido)}
            )
          `
        }
      }

      resultados.push({ retorno: { codigo: 200, descricao: "", protocolo: id, numeroFatura } })
    } catch (err) {
      resultados.push({
        retorno: {
          codigo: 400,
          descricao: err instanceof Error ? err.message : "Erro ao gravar fatura",
          protocolo: "",
          numeroFatura,
        },
      })
    }
  }

  return Response.json(resultados)
}
