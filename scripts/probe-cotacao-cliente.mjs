// Sonda o webservice sswCotacaoCliente (cotação feita pelo cliente da transportadora).
// Objetivo: descobrir se a LE consegue usá-lo e se existe senha de cliente (opção 383).
//   node scripts/probe-cotacao-cliente.mjs [cnpjPagador] [senhaPagador]
import { readFileSync } from "node:fs"

const WSDL = "https://ssw.inf.br/ws/sswCotacaoCliente/index.php?wsdl"
const env = readFileSync(".env.local", "utf8")
const doEnv = (k) => env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\r\\n]+)"?`, "m"))?.[1]

const cnpjPagador  = process.argv[2] ?? doEnv("SSW_CNPJ_REMETENTE")
const senhaPagador = process.argv[3] ?? "00000000"

const params = {
  dominio: doEnv("SSW_DOMINIO"),
  login: doEnv("SSW_LOGIN"),
  senha: doEnv("SSW_SENHA"),
  cnpjPagador,
  senhaPagador,
  cepOrigem: "01002900",
  cepDestino: "80060195",
  valorNF: 1500.0,
  quantidade: 2,
  peso: 30.5,
  volume: 0.25,
  mercadoria: 1,
}

const corpo = Object.entries(params)
  .map(([k, v]) => `<${k}>${v}</${k}>`)
  .join("")

const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sswinfbr.sswCotacaoCliente">
  <soapenv:Body><urn:cotar>${corpo}</urn:cotar></soapenv:Body>
</soapenv:Envelope>`

console.log("Parametros enviados:")
console.log(`  dominio=${params.dominio}  login=${params.login}`)
console.log(`  cnpjPagador=${cnpjPagador}  senhaPagador=${senhaPagador}\n`)

const res = await fetch(WSDL, {
  method: "POST",
  headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "urn:sswinfbr.sswCotacaoCliente#cotar" },
  body: envelope,
})

const texto = await res.text()
console.log(`HTTP ${res.status}\n`)

const ret = texto.match(/<return[^>]*>([\s\S]*?)<\/return>/)?.[1]
const desescapado = (ret ?? texto)
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&")

console.log(desescapado.trim().slice(0, 1200))
