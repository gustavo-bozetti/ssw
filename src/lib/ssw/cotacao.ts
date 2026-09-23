import { withRetry, soapCircuit, sswLog, fetchWithTimeout } from "./resilience"

const WSDL = "https://ssw.inf.br/ws/sswCotacaoColeta/index.php"

export interface CotacaoInput {
  cnpjPagador: string
  cepOrigem: number
  cepDestino: number
  valorNF: number
  quantidade: number
  peso?: number
  volume?: number
  mercadoria?: number
  coletar?: "S" | "N"
  cnpjRemetente?: string
  cnpjDestinatario?: string
  altura?: number
  largura?: number
  comprimento?: number
}

export interface CotacaoResult {
  erro: number
  mensagem: string
  frete: number | null        // R$
  prazo: number | null        // dias corridos
  diasUteis: number | null
  dataPrevisao: string | null // "DDMMAAAA" → formatado pelo client
  numeroCotacao: string | null
  token: string | null
  bloqueado: boolean
}

export interface ColarInput {
  numeroCotacao: string
  token: string
  limiteColeta: string
  solicitante?: string
  observacao?: string
  chaveNFe?: string
  nroPedido?: string
}

export interface ColetarResult {
  erro: number
  mensagem: string
  numeroColeta: string | null
}

/** Extrai apenas folhas (sem filhos), evita capturar o elemento raiz com mesmo nome. */
function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))
  return m?.[1]?.trim() ?? ""
}

function unescapeXml(s: string): string {
  let r = s
  // aplica duas passagens para cobrir entidades duplamente codificadas
  for (let i = 0; i < 2; i++) {
    r = r
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&")
  }
  // entidades HTML nomeadas comuns
  return r
    .replace(/&aacute;/g, "á").replace(/&atilde;/g, "ã").replace(/&ccedil;/g, "ç")
    .replace(/&eacute;/g, "é").replace(/&iacute;/g, "í").replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú").replace(/&Aacute;/g, "Á").replace(/&Atilde;/g, "Ã")
    .replace(/&Ccedil;/g, "Ç").replace(/&otilde;/g, "õ").replace(/&Otilde;/g, "Õ")
}

function parseFrete(s: string): number | null {
  if (!s) return null
  // SSW retorna "270,36" (formato BR) ou "270.36"
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."))
  return isNaN(n) ? null : n
}

function buildEnvelope(method: string, params: Record<string, string | number | undefined>): string {
  const ns = "urn:sswinfbr.sswCotacaoColeta"
  const fields = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `      <${k}>${v}</${k}>`)
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ssw="${ns}">
  <soapenv:Header/>
  <soapenv:Body>
    <ssw:${method}>
${fields}
    </ssw:${method}>
  </soapenv:Body>
</soapenv:Envelope>`
}

async function callSoap(method: string, params: Record<string, string | number | undefined>): Promise<string> {
  const t0 = Date.now()
  const raw = await withRetry(
    async () => {
      const res = await fetchWithTimeout(WSDL, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: `urn:sswinfbr.sswCotacaoColeta#${method}`,
        },
        body: buildEnvelope(method, params),
      })
      if (!res.ok) throw new Error(`SSW SOAP HTTP ${res.status}`)
      return res.text()
    },
    `soap:${method}`,
    { attempts: 3, baseMs: 200, circuit: soapCircuit }
  )
  sswLog("info", `soap:${method}`, "ok", { ms: Date.now() - t0 })
  const returnContent = extractTag(raw, "return")
  return unescapeXml(returnContent)
}

export async function cotar(input: CotacaoInput): Promise<CotacaoResult> {
  const xml = await callSoap("cotar", {
    dominio: process.env.SSW_DOMINIO,
    login: process.env.SSW_LOGIN,
    senha: process.env.SSW_SENHA,
    cnpjPagador: input.cnpjPagador,
    cepOrigem: input.cepOrigem,
    cepDestino: input.cepDestino,
    valorNF: input.valorNF,
    quantidade: input.quantidade,
    peso: input.peso,
    volume: input.volume,
    mercadoria: input.mercadoria ?? 1,
    coletar: input.coletar ?? "N",
    cnpjRemetente: input.cnpjRemetente,
    cnpjDestinatario: input.cnpjDestinatario,
    altura: input.altura,
    largura: input.largura,
    comprimento: input.comprimento,
  })

  const erro = parseInt(extractTag(xml, "erro"), 10)
  const numeroCotacao = extractTag(xml, "cotacao")
  const token = extractTag(xml, "token")

  return {
    erro,
    mensagem: extractTag(xml, "mensagem"),
    frete: parseFrete(extractTag(xml, "frete")),
    prazo: parseInt(extractTag(xml, "prazo"), 10) || null,
    diasUteis: parseInt(extractTag(xml, "diasUteis"), 10) || null,
    dataPrevisao: extractTag(xml, "dataPrevisao") || null,
    numeroCotacao: numeroCotacao && !numeroCotacao.startsWith("#") ? numeroCotacao : null,
    token: token && !token.startsWith("#") ? token : null,
    bloqueado: extractTag(xml, "bloqueado") === "1",
  }
}

export async function confirmarColeta(input: ColarInput): Promise<ColetarResult> {
  const xml = await callSoap("coletar", {
    dominio: process.env.SSW_DOMINIO,
    login: process.env.SSW_LOGIN,
    senha: process.env.SSW_SENHA,
    cotacao: input.numeroCotacao,
    token: input.token,
    limiteColeta: input.limiteColeta,
    solicitante: input.solicitante,
    observacao: input.observacao,
    chaveNFe: input.chaveNFe,
    nroPedido: input.nroPedido,
  })

  return {
    erro: parseInt(extractTag(xml, "erro"), 10),
    mensagem: extractTag(xml, "mensagem"),
    numeroColeta: extractTag(xml, "coleta") || null,
  }
}
