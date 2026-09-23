import { z } from "zod"
import { enviarCte } from "@/lib/ssw/cte"

const schema = z.object({
  placaColeta: z.string().min(7).max(8),
  codigoMercadoria: z.number().int().positive(),
  codigoEspecie: z.number().int().positive(),
  codigoConferente: z.number().int().positive(),
  cargaFechada: z.enum(["S", "N"]),
  tipoDocumento: z.enum(["CTE", "RPS"]),
  siglaEmissora: z.string().optional(),
  numPedido: z.string().optional(),
  xmlBase64: z.string().min(1),
})

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() }
  catch { return Response.json({ error: "Corpo inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await enviarCte(parsed.data)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
