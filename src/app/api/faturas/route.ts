import { sql } from "@/lib/db"

export async function GET() {
  const faturas = await sql`
    SELECT
      f.id,
      f.numero_fatura                  AS "numeroFatura",
      f.nosso_numero                   AS "nossoNumero",
      f.cnpj_devedor                   AS "cnpjDevedor",
      f.nome_devedor                   AS "nomeDevedor",
      f.unidade_cobranca               AS "unidadeCobranca",
      f.tipo_cobranca                  AS "tipoCobranca",
      f.banco, f.agencia, f.conta, f.carteira,
      f.data_emissao                   AS "dataEmissao",
      f.data_vencimento                AS "dataVencimento",
      f.data_liquidacao                AS "dataLiquidacao",
      f.data_cancelamento              AS "dataCancelamento",
      f.data_credito                   AS "dataCredito",
      f.valor_total::float8            AS "valorTotal",
      f.valor_total_ctrc::float8       AS "valorTotalCtrc",
      f.valor_pago::float8             AS "valorPago",
      f.valor_juros::float8            AS "valorJuros",
      f.valor_acrescimo::float8        AS "valorAcrescimo",
      f.valor_desconto::float8         AS "valorDesconto",
      f.valor_credito::float8          AS "valorCredito",
      f.url_impressao                  AS "urlImpressao",
      f.status,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('numero', c.numero, 'serie', c.serie))
          FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS ctrc,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('numero', n.numero, 'serie', n.serie))
          FILTER (WHERE n.id IS NOT NULL),
        '[]'
      ) AS nfs
    FROM faturas f
    LEFT JOIN fatura_ctrc c ON c.fatura_id = f.id
    LEFT JOIN fatura_nf   n ON n.fatura_id = f.id
    GROUP BY f.id
    ORDER BY f.data_vencimento ASC NULLS LAST
  `
  return Response.json(faturas)
}
