import { rastrearPorColeta, rastrearPorDanfe } from "@/lib/ssw/client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chaveNfe = searchParams.get("chaveNfe")
  const numeroColeta = searchParams.get("numeroColeta")
  const cnpj = searchParams.get("cnpj")

  try {
    if (chaveNfe) {
      const result = await rastrearPorDanfe(chaveNfe)
      if (result.sucesso === false) {
        return Response.json({ error: result.mensagem ?? "Nenhum documento localizado" }, { status: 404 })
      }
      return Response.json({ eventos: result.eventos ?? [] })
    }

    if (numeroColeta) {
      const cnpjUsado = cnpj ?? process.env.SSW_CNPJ_REMETENTE
      if (!cnpjUsado) {
        return Response.json({ error: "CNPJ do remetente não configurado" }, { status: 400 })
      }
      const result = await rastrearPorColeta({ cnpj: cnpjUsado, nro_coleta: numeroColeta })
      if (result.sucesso === false) {
        return Response.json({ error: result.mensagem ?? "Nenhum documento localizado" }, { status: 404 })
      }
      return Response.json({ eventos: result.eventos ?? [] })
    }

    return Response.json(
      { error: "Informe chaveNfe ou numeroColeta" },
      { status: 400 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
