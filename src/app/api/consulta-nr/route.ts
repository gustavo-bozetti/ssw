import { consultarNr } from "@/lib/ssw/consultaNr"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chave_nfe = searchParams.get("chaveNfe")

  if (!chave_nfe || chave_nfe.length !== 44) {
    return Response.json(
      { error: "Informe chaveNfe com 44 dígitos" },
      { status: 400 }
    )
  }

  try {
    const result = await consultarNr(chave_nfe)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
