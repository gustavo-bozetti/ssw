// Popula a tabela de faturas com dados de demonstração.
//   node scripts/seed-faturas.mjs          -> insere
//   node scripts/seed-faturas.mjs --clear  -> remove apenas os dados de demo
import { readFileSync } from "node:fs"
import { neon } from "@neondatabase/serverless"

const env = readFileSync(".env.local", "utf8")
const sql = neon(env.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)[1].replace(/\?$/, ""))

const CNPJ = "39506872000161"
const id = (n) => `${CNPJ}-${n}`

const DEMO = [
  { n: 100234, devedor: "SUPERMERCADO BOA VISTA LTDA",  cnpj: "11222333000144", emissao: "2026-08-11", venc: "2026-09-10", total: 4820.5,  status: "EMITIDA"   },
  { n: 100251, devedor: "DISTRIBUIDORA NOVA ERA S.A.",  cnpj: "22333444000155", emissao: "2026-08-31", venc: "2026-09-30", total: 12750.0, status: "EMITIDA"   },
  { n: 100263, devedor: "COMERCIAL SAO JORGE ME",       cnpj: "33444555000166", emissao: "2026-09-15", venc: "2026-10-15", total: 2310.9,  status: "EMITIDA"   },
  { n: 100189, devedor: "ATACADO CENTRAL LTDA",         cnpj: "44555666000177", emissao: "2026-07-31", venc: "2026-08-31", total: 8990.25, status: "LIQUIDADA", liq: "2026-08-29", credito: "2026-09-01", pago: 8990.25 },
  { n: 100205, devedor: "FARMACIA VIDA PLENA LTDA",     cnpj: "55666777000188", emissao: "2026-08-05", venc: "2026-09-05", total: 1475.8,  status: "LIQUIDADA", liq: "2026-09-08", credito: "2026-09-09", pago: 1512.3, juros: 36.5 },
  { n: 100247, devedor: "TRANSPORTES RIO CLARO EIRELI", cnpj: "66777888000199", emissao: "2026-08-20", venc: "2026-09-20", total: 3200.0,  status: "CANCELADA", cancel: "2026-09-02" },
]

if (process.argv.includes("--clear")) {
  await sql`DELETE FROM faturas WHERE id = ANY(${DEMO.map((f) => id(f.n))})`
  console.log("Dados de demonstração removidos.")
  process.exit(0)
}

for (const f of DEMO) {
  await sql`
    INSERT INTO faturas (
      id, numero_fatura, nosso_numero, cnpj_transportadora, nome_transportadora,
      cnpj_devedor, nome_devedor, banco, agencia, conta, carteira,
      unidade_cobranca, tipo_cobranca, data_emissao, data_vencimento,
      data_liquidacao, data_credito, data_cancelamento,
      valor_total, valor_total_ctrc, valor_pago, valor_juros,
      url_impressao, status
    ) VALUES (
      ${id(f.n)}, ${f.n}, ${`000000${f.n}00`}, ${CNPJ}, 'LE SERVICOS LTDA',
      ${f.cnpj}, ${f.devedor}, '341', '1234', '56789', '109',
      'JFA', 'B', ${f.emissao}, ${f.venc},
      ${f.liq ?? null}, ${f.credito ?? null}, ${f.cancel ?? null},
      ${f.total}, ${f.total}, ${f.pago ?? null}, ${f.juros ?? null},
      ${`https://ssw.inf.br/boleto/${f.n}.pdf`}, ${f.status}
    )
    ON CONFLICT (id) DO NOTHING
  `

  await sql`
    INSERT INTO fatura_ctrc (fatura_id, serie, numero, cte_serie, cte_numero, valor_frete, tipo_documento)
    VALUES (${id(f.n)}, '1', ${f.n - 95000}, '001', ${String(f.n * 7)}, ${f.total}, 'CTe')
  `
  await sql`
    INSERT INTO fatura_nf (fatura_id, serie, numero, pedido)
    VALUES (${id(f.n)}, '1', ${f.n - 67000}, ${f.n - 92000})
  `
}

console.log(`${DEMO.length} faturas de demonstração inseridas.`)
