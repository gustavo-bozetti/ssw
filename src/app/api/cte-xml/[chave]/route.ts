import { sql } from "@/lib/db"
import { decodificarBase64 } from "@/lib/ssw/cte-xml"

// Serve o XML arquivado para download, substituindo o redirect para /2/servico?id=52.

export async function GET(_req: Request, ctx: { params: Promise<{ chave: string }> }) {
  const { chave } = await ctx.params

  if (!/^\d{44}$/.test(chave)) {
    return Response.json({ error: "Chave de CT-e inválida" }, { status: 400 })
  }

  const linhas = await sql`SELECT xml_base64 FROM cte_xml WHERE chave = ${chave}`
  if (linhas.length === 0) {
    return Response.json({ error: "XML não encontrado" }, { status: 404 })
  }

  return new Response(decodificarBase64(linhas[0].xml_base64 as string), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="CTe${chave}.xml"`,
    },
  })
}
