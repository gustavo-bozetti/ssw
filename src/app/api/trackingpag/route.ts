import { z } from "zod"
import { trackingPag } from "@/lib/ssw/client"

const identifierSchema = z
  .object({
    nro_nf: z.number().int().positive().optional(),
    pedido: z.string().optional(),
    chave_nfe: z.string().length(44).optional(),
    nro_coleta: z.number().int().positive().optional(),
  })
  .refine((d) => d.nro_nf != null || d.pedido != null || d.chave_nfe != null || d.nro_coleta != null, {
    message: "Informe ao menos um: nro_nf, pedido, chave_nfe ou nro_coleta",
  })

const schema = z
  .object({
    cnpj: z.string().min(14).max(18),
    senha: z.string().optional(),
    sigla_emp: z.string().optional(),
  })
  .and(identifierSchema)

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() }
  catch { return Response.json({ error: "Corpo inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await trackingPag(parsed.data)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
