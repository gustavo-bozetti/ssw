// Envia o que o programa EDI SSW3189 enviaria: POST com [{ cte: { xmlBase64 } }].
//   node scripts/simular-webhook-cte-xml.mjs http://localhost:3000
//   node scripts/simular-webhook-cte-xml.mjs http://localhost:3000 xml   (formato XML)
import { readFileSync } from "node:fs"

const base = process.argv[2]?.replace(/\/$/, "")
const formato = process.argv[3] === "xml" ? "xml" : "json"
if (!base) {
  console.error("Uso: node scripts/simular-webhook-cte-xml.mjs <url-base> [xml]")
  process.exit(1)
}

const env = readFileSync(".env.local", "utf8")
const doEnv = (k) => env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\r\\n]+)"?`, "m"))?.[1]
const auth = "Basic " + Buffer.from(`${doEnv("WEBHOOK_USER")}:${doEnv("WEBHOOK_PASS")}`).toString("base64")

const CHAVE = "35260939506872000161570010003500891000000015"

const XML_CTE = `<?xml version="1.0" encoding="UTF-8"?>
<cteProc xmlns="http://www.portalfiscal.inf.br/cte" versao="4.00">
  <CTe>
    <infCte versao="4.00" Id="CTe${CHAVE}">
      <ide>
        <cUF>35</cUF><cCT>00000001</cCT><CFOP>5353</CFOP>
        <natOp>PRESTACAO DE SERVICO DE TRANSPORTE</natOp>
        <mod>57</mod><serie>1</serie><nCT>3500891</nCT>
        <dhEmi>2026-09-20T14:32:11-03:00</dhEmi>
        <tpImp>1</tpImp><tpEmis>1</tpEmis><tpCTe>0</tpCTe>
        <modal>01</modal><tpServ>0</tpServ>
        <toma3><toma>0</toma></toma3>
      </ide>
      <emit>
        <CNPJ>39506872000161</CNPJ><IE>111222333</IE>
        <xNome>LE SERVICOS LTDA</xNome>
      </emit>
      <rem>
        <CNPJ>11222333000144</CNPJ><IE>444555666</IE>
        <xNome>SUPERMERCADO BOA VISTA LTDA</xNome>
      </rem>
      <dest>
        <CNPJ>22333444000155</CNPJ><IE>777888999</IE>
        <xNome>DISTRIBUIDORA NOVA ERA S.A.</xNome>
      </dest>
      <vPrest>
        <vTPrest>1235.25</vTPrest><vRec>1235.25</vRec>
      </vPrest>
    </infCte>
  </CTe>
</cteProc>`

const b64 = Buffer.from(XML_CTE, "utf-8").toString("base64")

const corpo = formato === "xml"
  ? `<?xml version="1.0" encoding="UTF-8" ?>\n<cte>\n  <xmlBase64>${b64}</xmlBase64>\n</cte>`
  : JSON.stringify([{ cte: { xmlBase64: b64 } }])

const url = `${base}/api/webhooks/cte-xml`
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": formato === "xml" ? "application/xml" : "application/json",
    Authorization: auth,
  },
  body: corpo,
})

console.log(`POST ${url}  [${formato}]`)
console.log(`HTTP ${res.status}`)
console.log(await res.text())
console.log(`\nDownload: ${base}/api/cte-xml/${CHAVE}`)
