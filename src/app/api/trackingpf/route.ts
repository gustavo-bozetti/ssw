import { z } from "zod"
import { trackingPf } from "@/lib/ssw/client"

const schema = z.object({
  cpf: z.string().min(11).max(14),
  nro_nf: z.number().int().positive().optional(),
  pedido: z.string().optional(),
  chave_nfe: z.string().length(44).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() }
  catch { return Response.json({ error: "Corpo inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await trackingPf(parsed.data)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
