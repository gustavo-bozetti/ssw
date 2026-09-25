import { sql } from "@/lib/db"
import { verificarWebhookAuth } from "@/lib/webhook-auth"
import { extrairCte, decodificarBase64 } from "@/lib/ssw/cte-xml"

// Programa EDI SSW3189. O SSW envia na autorização do CT-e junto à SEFAZ.
// Payload é um array na raiz: [{ "cte": { "xmlBase64": "..." } }]
// Aceita JSON ou XML, conforme a configuração do cadastro.

function agora() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(",", "")
}

function resposta(codigo: number, descricao: string) {
  return Response.json([{ retorno: { codigo, descricao, dataHora: agora() } }], { status: codigo })
}

/** O formato XML traz um <cte><xmlBase64>..</xmlBase64></cte> por requisição. */
function lerBase64(corpo: string, contentType: string): string[] {
  if (contentType.includes("xml")) {
    return [...corpo.matchAll(/<xmlBase64>([\s\S]*?)<\/xmlBase64>/g)].map((m) => m[1].trim())
  }

  const json = JSON.parse(corpo) as unknown
  const itens = Array.isArray(json) ? json : [json]
  return itens
    .map((i) => (i as { cte?: { xmlBase64?: string } })?.cte?.xmlBase64)
    .filter((x): x is string => typeof x === "string" && x.length > 0)
}

export async function POST(request: Request) {
  if (!verificarWebhookAuth(request)) {
    return resposta(401, "NAO AUTORIZADO")
  }

  let base64s: string[]
  try {
    const corpo = await request.text()
    base64s = lerBase64(corpo, request.headers.get("content-type") ?? "")
  } catch {
    return resposta(400, "CORPO INVALIDO")
  }

  if (base64s.length === 0) {
    return resposta(400, "NENHUM cte.xmlBase64 ENCONTRADO")
  }

  let gravados = 0
  for (const b64 of base64s) {
    let cte
    try {
      cte = extrairCte(decodificarBase64(b64))
    } catch {
      return resposta(400, "BASE64 INVALIDO")
    }

    if (!cte) {
      return resposta(400, "XML SEM CHAVE DE CT-E VALIDA")
    }

    try {
      await sql`
        INSERT INTO cte_xml (
          chave, numero, serie, cnpj_emitente, cnpj_remetente,
          cnpj_destinatario, cnpj_tomador, data_emissao, valor_prestacao, xml_base64
        ) VALUES (
          ${cte.chave}, ${cte.numero}, ${cte.serie}, ${cte.cnpjEmitente}, ${cte.cnpjRemetente},
          ${cte.cnpjDestinatario}, ${cte.cnpjTomador}, ${cte.dataEmissao}, ${cte.valorPrestacao}, ${b64}
        )
        ON CONFLICT (chave) DO UPDATE SET xml_base64 = EXCLUDED.xml_base64
      `
      gravados++
    } catch (err) {
      return resposta(400, err instanceof Error ? err.message.toUpperCase() : "ERRO AO GRAVAR")
    }
  }

  return resposta(200, `ENVIO PROCESSADO COM SUCESSO (${gravados})`)
}
