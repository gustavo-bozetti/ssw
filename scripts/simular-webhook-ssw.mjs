// Envia para a aplicação exatamente o que o SSW (programa EDI SSW2658) enviaria:
// POST JSON com HTTP Basic Auth, nomes de campo do SSW e datas em YYYYMMDD.
//
//   node scripts/simular-webhook-ssw.mjs https://seu-app.vercel.app
//   node scripts/simular-webhook-ssw.mjs https://seu-app.vercel.app emitida
//   node scripts/simular-webhook-ssw.mjs https://seu-app.vercel.app lote
//
// "lote" reproduz o cenario real de um dia de faturamento: uma entrega com
// varias faturas de uma vez, depois as liquidacoes e um cancelamento.
//
// Credenciais: lidas de .env.local, ou de WEBHOOK_USER / WEBHOOK_PASS no ambiente.
import { readFileSync } from "node:fs"

const base = process.argv[2]?.replace(/\/$/, "")
const apenas = process.argv[3]

if (!base) {
  console.error("Uso: node scripts/simular-webhook-ssw.mjs <url-base> [emitida|liquidada|cancelada]")
  process.exit(1)
}

let env = ""
try { env = readFileSync(".env.local", "utf8") } catch {}
const doEnv = (k) => env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\r\\n]+)"?`, "m"))?.[1]

const user = process.env.WEBHOOK_USER ?? doEnv("WEBHOOK_USER")
const pass = process.env.WEBHOOK_PASS ?? doEnv("WEBHOOK_PASS")
if (!user || !pass) {
  console.error("WEBHOOK_USER / WEBHOOK_PASS não encontrados em .env.local nem no ambiente.")
  process.exit(1)
}

const CNPJ = "39506872000161"
const NUMERO = 500123

const EVENTOS = {
  emitida: {
    rota: "/api/webhooks/fatura",
    corpo: {
      DetalheFatura: [{
        cnpj: CNPJ,
        razaoSocial: "LE SERVICOS LTDA",
        banco: "341",
        agencia: "1234",
        conta: "56789",
        carteira: "109",
        cnpjSacado: "11222333000144",
        razaoSocialSacado: "SUPERMERCADO BOA VISTA LTDA",
        unidadeDeCobranca: "JFA",
        tipoCobranca: "B",
        numeroDaFatura: NUMERO,
        numero: "00000050012300",
        dataEmissaoDaFatura: "20260825",
        dataVencimento: "20260924",
        valorDeAcrescimos: 0,
        valorDeCredito: 0,
        valorTotalDaFatura: 4820.5,
        valorTotaldosCtrcDaFatura: 4820.5,
        urlImpressao: `https://ssw.inf.br/boleto/${NUMERO}.pdf`,
        ctrc: [
          {
            ctrcSerie: "1",
            ctrcNumero: 88201,
            ctrcSerieCte: "001",
            ctrcNumeroCte: "3500891",
            ctrcChaveCte: "35260939506872000161570010003500891000000015",
            ctrcValorFrete: 3120.0,
            ctrcTipoDocumento: "CTe",
            notasFiscais: [
              { serieNF: "1", numeroNF: 45012, chaveNF: "35260911222333000144550010000450121000000018", pedido: 9901 },
              { serieNF: "1", numeroNF: 45013, chaveNF: "35260911222333000144550010000450131000000019", pedido: 9902 },
            ],
          },
          {
            ctrcSerie: "1",
            ctrcNumero: 88202,
            ctrcSerieCte: "001",
            ctrcNumeroCte: "3500892",
            ctrcChaveCte: "35260939506872000161570010003500892000000016",
            ctrcValorFrete: 1700.5,
            ctrcTipoDocumento: "CTe",
            notasFiscais: [
              { serieNF: "1", numeroNF: 45020, chaveNF: "35260911222333000144550010000450201000000020", pedido: 9903 },
            ],
          },
        ],
      }],
    },
  },

  liquidada: {
    rota: "/api/webhooks/fatura-liquidada",
    corpo: {
      DetalheFatura: [{
        cnpj: CNPJ,
        numeroDaFatura: NUMERO,
        dataLiquidacao: "20260926",
        dataCreditoCaixa: "20260929",
        valorDeJuros: 18.4,
        valorDeDesconto: 0,
        valorPago: 4838.9,
      }],
    },
  },

  cancelada: {
    rota: "/api/webhooks/fatura-cancelada",
    corpo: {
      DetalheFaturaCanc: [{
        cnpj: CNPJ,
        numeroDaFatura: NUMERO,
        dataCancelamento: "20260930",
        valorDeAcrescimos: 0,
        valorDeCredito: 0,
        valorTotalDaFatura: 4820.5,
        valorTotalDosCtrcDaFatura: 4820.5,
      }],
    },
  },
}

// Um dia de faturamento: varias faturas numa entrega so, depois as baixas.
const CLIENTES = [
  { n: 500201, cnpj: "11222333000144", nome: "SUPERMERCADO BOA VISTA LTDA",  venc: "20260910", total: 4820.5  },
  { n: 500202, cnpj: "22333444000155", nome: "DISTRIBUIDORA NOVA ERA S.A.",  venc: "20260930", total: 12750.0 },
  { n: 500203, cnpj: "33444555000166", nome: "COMERCIAL SAO JORGE ME",       venc: "20261015", total: 2310.9  },
  { n: 500204, cnpj: "44555666000177", nome: "ATACADO CENTRAL LTDA",         venc: "20260831", total: 8990.25 },
  { n: 500205, cnpj: "55666777000188", nome: "FARMACIA VIDA PLENA LTDA",     venc: "20260905", total: 1475.8  },
  { n: 500206, cnpj: "66777888000199", nome: "TRANSPORTES RIO CLARO EIRELI", venc: "20260920", total: 3200.0  },
]

const faturaLote = (c) => ({
  cnpj: CNPJ,
  razaoSocial: "LE SERVICOS LTDA",
  banco: "341", agencia: "1234", conta: "56789", carteira: "109",
  cnpjSacado: c.cnpj,
  razaoSocialSacado: c.nome,
  unidadeDeCobranca: "JFA",
  tipoCobranca: "B",
  numeroDaFatura: c.n,
  numero: `0000000${c.n}00`,
  dataEmissaoDaFatura: "20260820",
  dataVencimento: c.venc,
  valorDeAcrescimos: 0,
  valorDeCredito: 0,
  valorTotalDaFatura: c.total,
  valorTotaldosCtrcDaFatura: c.total,
  urlImpressao: `https://ssw.inf.br/boleto/${c.n}.pdf`,
  ctrc: [{
    ctrcSerie: "1",
    ctrcNumero: c.n - 412000,
    ctrcSerieCte: "001",
    ctrcNumeroCte: String(c.n * 7),
    ctrcChaveCte: `352609395068720001615700100035008${c.n % 100}000000015`,
    ctrcValorFrete: c.total,
    ctrcTipoDocumento: "CTe",
    notasFiscais: [
      { serieNF: "1", numeroNF: c.n - 455000, chaveNF: `3526091122233300014455001000045${c.n % 1000}1000000018`, pedido: c.n - 490000 },
    ],
  }],
})

EVENTOS.lote = [
  { rota: "/api/webhooks/fatura", corpo: { DetalheFatura: CLIENTES.map(faturaLote) }, nome: "6 faturas emitidas (1 entrega)" },
  {
    rota: "/api/webhooks/fatura-liquidada",
    nome: "2 faturas liquidadas",
    corpo: {
      DetalheFatura: [
        { cnpj: CNPJ, numeroDaFatura: 500204, dataLiquidacao: "20260829", dataCreditoCaixa: "20260901", valorDeJuros: 0,    valorDeDesconto: 0, valorPago: 8990.25 },
        { cnpj: CNPJ, numeroDaFatura: 500205, dataLiquidacao: "20260908", dataCreditoCaixa: "20260909", valorDeJuros: 36.5, valorDeDesconto: 0, valorPago: 1512.3  },
      ],
    },
  },
  {
    rota: "/api/webhooks/fatura-cancelada",
    nome: "1 fatura cancelada",
    corpo: {
      DetalheFaturaCanc: [
        { cnpj: CNPJ, numeroDaFatura: 500206, dataCancelamento: "20260902", valorDeAcrescimos: 0, valorDeCredito: 0, valorTotalDaFatura: 3200.0, valorTotalDosCtrcDaFatura: 3200.0 },
      ],
    },
  },
]

const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
const nomes = apenas ? [apenas] : ["emitida", "liquidada", "cancelada"]

const entregas = []
for (const nome of nomes) {
  const ev = EVENTOS[nome]
  if (!ev) {
    console.error(`Evento desconhecido: ${nome}`)
    process.exit(1)
  }
  for (const e of [ev].flat()) entregas.push({ nome: e.nome ?? nome, ...e })
}

let falhas = 0
for (const e of entregas) {
  const url = base + e.rota
  const t0 = Date.now()
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(e.corpo),
  })
  const texto = await res.text()
  const ok = res.ok && !texto.includes('"codigo":400')
  if (!ok) falhas++

  console.log(`\n[${ok ? "ok" : "FALHA"}] ${e.nome}`)
  console.log(`  POST ${url}`)
  console.log(`  HTTP ${res.status}  (${Date.now() - t0}ms)`)
  console.log(`  ${texto.slice(0, 600)}`)
}

console.log(`\n${entregas.length} entrega(s), ${falhas} falha(s).`)
process.exit(falhas ? 1 : 0)

console.log("")
