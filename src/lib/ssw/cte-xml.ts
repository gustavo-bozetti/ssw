// O SSW3189 entrega apenas o XML em base64, sem metadado nenhum.
// Tudo que torna o CT-e localizável precisa sair do próprio XML.

export interface CteExtraido {
  chave: string
  numero: number | null
  serie: string | null
  cnpjEmitente: string | null
  cnpjRemetente: string | null
  cnpjDestinatario: string | null
  cnpjTomador: string | null
  dataEmissao: Date | null
  valorPrestacao: number | null
}

/** CNPJ aparece dentro de emit, rem, dest, exped, receb — precisa isolar o bloco antes. */
function bloco(xml: string, tag: string): string {
  return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))?.[1] ?? ""
}

function valor(xml: string, tag: string): string | null {
  const v = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`))?.[1]?.trim()
  return v ? v : null
}

/**
 * toma3 indica o tomador por código (0 remetente, 1 expedidor, 2 recebedor, 3 destinatário);
 * toma4 traz o CNPJ direto quando o tomador é outra parte.
 */
function tomador(xml: string, rem: string | null, dest: string | null): string | null {
  const direto = valor(bloco(xml, "toma4"), "CNPJ")
  if (direto) return direto

  switch (valor(bloco(xml, "toma3"), "toma")) {
    case "0": return rem
    case "3": return dest
    default:  return null
  }
}

export function extrairCte(xml: string): CteExtraido | null {
  const chave = xml.match(/<infCte[^>]*\bId="CTe(\d{44})"/)?.[1]
  if (!chave) return null

  const ide  = bloco(xml, "ide")
  const rem  = valor(bloco(xml, "rem"),  "CNPJ")
  const dest = valor(bloco(xml, "dest"), "CNPJ")

  const numero = valor(ide, "nCT")
  const dhEmi  = valor(ide, "dhEmi")
  const vTPrest = valor(bloco(xml, "vPrest"), "vTPrest")
  const emissao = dhEmi ? new Date(dhEmi) : null

  return {
    chave,
    numero: numero ? Number(numero) : null,
    serie: valor(ide, "serie"),
    cnpjEmitente: valor(bloco(xml, "emit"), "CNPJ"),
    cnpjRemetente: rem,
    cnpjDestinatario: dest,
    cnpjTomador: tomador(xml, rem, dest),
    dataEmissao: emissao && !Number.isNaN(emissao.getTime()) ? emissao : null,
    valorPrestacao: vTPrest ? Number(vTPrest) : null,
  }
}

export function decodificarBase64(b64: string): string {
  return Buffer.from(b64, "base64").toString("utf-8")
}
