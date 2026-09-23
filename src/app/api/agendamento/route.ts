import { agendarEntrega } from "@/lib/ssw/agendamento"
import { z } from "zod"

const schema = z.object({
  cnpj: z.string().min(11).max(18),
  chave_nfe: z.string().length(44).optional(),
  nro_coleta: z.string().min(1).optional(),
  data_agendamento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use DD/MM/AAAA"),
  horario_inicio: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  horario_fim: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  observacao: z.string().max(160).optional(),
}).refine((d) => d.chave_nfe || d.nro_coleta, {
  message: "Informe chave_nfe ou nro_coleta",
})

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() }
  catch { return Response.json({ error: "Corpo inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await agendarEntrega({
      ...parsed.data,
      cnpj: parsed.data.cnpj.replace(/\D/g, ""),
    })
    if (!result.sucesso)
      return Response.json({ error: result.mensagem }, { status: 422 })
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
