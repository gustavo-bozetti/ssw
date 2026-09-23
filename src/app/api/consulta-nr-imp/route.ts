import { consultarNrImp, type TipoImpressao } from "@/lib/ssw/consultaNr"

const TIPOS_VALIDOS: TipoImpressao[] = ["ZPL", "EPL", "PPLA"]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chaveNfe = searchParams.get("chaveNfe")
  const tipoImp = (searchParams.get("tipoImp") ?? "ZPL").toUpperCase() as TipoImpressao

  if (!chaveNfe || chaveNfe.length !== 44) {
    return Response.json({ error: "Informe chaveNfe com 44 dígitos" }, { status: 400 })
  }

  if (!TIPOS_VALIDOS.includes(tipoImp)) {
    return Response.json({ error: "tipoImp deve ser ZPL, EPL ou PPLA" }, { status: 400 })
  }

  try {
    const result = await consultarNrImp(chaveNfe, tipoImp)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
