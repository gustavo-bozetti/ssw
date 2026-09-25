import { cotar } from "@/lib/ssw/cotacao"
import { z } from "zod"

const schema = z.object({
  cnpjPagador: z.string().min(11).max(18),
  cepOrigem: z.string().transform((v) => parseInt(v.replace(/\D/g, ""), 10)).pipe(z.number().int()),
  cepDestino: z.string().transform((v) => parseInt(v.replace(/\D/g, ""), 10)).pipe(z.number().int()),
  valorNF: z.coerce.number().positive(),
  quantidade: z.coerce.number().int().min(1),
  peso: z.coerce.number().positive().optional(),
  volume: z.coerce.number().positive().optional(),
  mercadoria: z.coerce.number().int().optional(),
  coletar: z.enum(["S", "N"]).optional(),
  cnpjRemetente: z.string().optional(),
  cnpjDestinatario: z.string().optional(),
  altura: z.coerce.number().positive().optional(),
  largura: z.coerce.number().positive().optional(),
  comprimento: z.coerce.number().positive().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Corpo inválido" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((i) => i.message).join(", ")
    return Response.json({ error: msgs }, { status: 422 })
  }

  if (!parsed.data.peso && !parsed.data.volume) {
    return Response.json({ error: "Informe peso ou volume" }, { status: 422 })
  }

  const clean = (s: string | undefined) => s?.replace(/\D/g, "") || undefined
  const data = {
    ...parsed.data,
    cnpjPagador: clean(parsed.data.cnpjPagador)!,
    cnpjRemetente: clean(parsed.data.cnpjRemetente),
    cnpjDestinatario: clean(parsed.data.cnpjDestinatario),
  }

  try {
    const result = await cotar(data)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
