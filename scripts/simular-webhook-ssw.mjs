// Envia para a aplicação exatamente o que o SSW (programa EDI SSW2658) enviaria:
// POST JSON com HTTP Basic Auth, nomes de campo do SSW e datas em YYYYMMDD.
//
//   node scripts/simular-webhook-ssw.mjs https://seu-app.vercel.app
//   node scripts/simular-webhook-ssw.mjs https://seu-app.vercel.app emitida
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

const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
const nomes = apenas ? [apenas] : ["emitida", "liquidada", "cancelada"]

for (const nome of nomes) {
  const ev = EVENTOS[nome]
  if (!ev) {
    console.error(`Evento desconhecido: ${nome}`)
    process.exit(1)
  }

  const url = base + ev.rota
  const t0 = Date.now()
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(ev.corpo),
  })
  const texto = await res.text()

  console.log(`\n[${nome}] POST ${url}`)
  console.log(`  HTTP ${res.status}  (${Date.now() - t0}ms)`)
  console.log(`  ${texto.slice(0, 500)}`)
}

console.log("")
