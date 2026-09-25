import { withRetry, soapCircuit, sswLog, fetchWithTimeout } from "./resilience"

// Webservice sswCotacaoCliente: cotação feita pelo cliente da transportadora.
// Diferente do sswCotacaoColeta — exige a senha do pagador cadastrada na opção 383
// do painel SSW. É o endpoint desenhado para o self-service do embarcador.
const WSDL = "https://ssw.inf.br/ws/sswCotacaoCliente/index.php"
const NS = "urn:sswinfbr.sswCotacaoCliente"

export interface CotacaoClienteInput {
  cnpjPagador: string
  senhaPagador: string
  cepOrigem: number
  cepDestino: number
  valorNF: number
  quantidade: number
  peso: number
  volume: number
  mercadoria?: number
  cnpjDestinatario?: string
  cnpjRemetente?: string
  coletar?: "S" | "N"
  entDificil?: "S" | "N"
  destContribuinte?: "S" | "N"
}

export interface CotacaoClienteResult {
  erro: number
  mensagem: string
  totalFrete: number | null   // R$
  fretePeso: number | null    // R$
  prazo: number | null        // dias corridos
  pesoCalculo: number | null  // kg
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))
  return m?.[1]?.trim() ?? ""
}

function unescapeXml(s: string): string {
  let r = s
  for (let i = 0; i < 2; i++) {
    r = r
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
  }
  return r
}

function parseNum(s: string): number | null {
  if (!s) return null
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."))
  return isNaN(n) ? null : n
}

function buildEnvelope(params: Record<string, string | number | undefined>): string {
  const fields = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `      <${k}>${v}</${k}>`)
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ssw="${NS}">
  <soapenv:Header/>
  <soapenv:Body>
    <ssw:cotar>
${fields}
    </ssw:cotar>
  </soapenv:Body>
</soapenv:Envelope>`
}

export async function cotarCliente(input: CotacaoClienteInput): Promise<CotacaoClienteResult> {
  const t0 = Date.now()
  const raw = await withRetry(
    async () => {
      const res = await fetchWithTimeout(WSDL, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: `${NS}#cotar`,
        },
        body: buildEnvelope({
          dominio: process.env.SSW_DOMINIO,
          login: process.env.SSW_LOGIN,
          senha: process.env.SSW_SENHA,
          cnpjPagador: input.cnpjPagador,
          senhaPagador: input.senhaPagador,
          cepOrigem: input.cepOrigem,
          cepDestino: input.cepDestino,
          valorNF: input.valorNF,
          quantidade: input.quantidade,
          peso: input.peso,
          volume: input.volume,
          mercadoria: input.mercadoria ?? 1,
          cnpjDestinatario: input.cnpjDestinatario,
          cnpjRemetente: input.cnpjRemetente,
          coletar: input.coletar,
          entDificil: input.entDificil,
          destContribuinte: input.destContribuinte,
        }),
      })
      if (!res.ok) throw new Error(`SSW SOAP HTTP ${res.status}`)
      return res.text()
    },
    "soap:cotarCliente",
    { attempts: 3, baseMs: 200, circuit: soapCircuit }
  )

  const xml = unescapeXml(extractTag(raw, "return") || raw)
  const erro = parseInt(extractTag(xml, "erro"), 10)
  sswLog("info", "soap:cotarCliente", Number.isNaN(erro) || erro < 0 ? "erro" : "ok", { ms: Date.now() - t0 })

  return {
    erro: Number.isNaN(erro) ? -1 : erro,
    mensagem: extractTag(xml, "mensagem"),
    totalFrete: parseNum(extractTag(xml, "totalFrete")),
    fretePeso: parseNum(extractTag(xml, "fretePeso")),
    prazo: parseInt(extractTag(xml, "prazo"), 10) || null,
    pesoCalculo: parseNum(extractTag(xml, "pesoCalculo")),
  }
}
