import { cotarCliente } from "@/lib/ssw/cotacaoCliente"
import { z } from "zod"

// Cotação self-service do cliente da transportadora.
// A senha do pagador (opção 383) valida a identidade do cliente no próprio SSW.

const schema = z.object({
  cnpjPagador: z.string({ error: "Informe o CNPJ do pagador" }).min(11).max(18),
  senhaPagador: z.string({ error: "Informe a senha do pagador" }).min(1, "Informe a senha do pagador"),
  cepOrigem: z.string().transform((v) => parseInt(v.replace(/\D/g, ""), 10)).pipe(z.number().int()),
  cepDestino: z.string().transform((v) => parseInt(v.replace(/\D/g, ""), 10)).pipe(z.number().int()),
  valorNF: z.coerce.number().positive(),
  quantidade: z.coerce.number().int().min(1),
  peso: z.coerce.number().positive(),
  volume: z.coerce.number().positive(),
  mercadoria: z.coerce.number().int().optional(),
  cnpjRemetente: z.string().optional(),
  cnpjDestinatario: z.string().optional(),
  coletar: z.enum(["S", "N"]).optional(),
  entDificil: z.enum(["S", "N"]).optional(),
  destContribuinte: z.enum(["S", "N"]).optional(),
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

  const clean = (s: string | undefined) => s?.replace(/\D/g, "") || undefined
  const data = {
    ...parsed.data,
    cnpjPagador: clean(parsed.data.cnpjPagador)!,
    cnpjRemetente: clean(parsed.data.cnpjRemetente),
    cnpjDestinatario: clean(parsed.data.cnpjDestinatario),
  }

  try {
    const result = await cotarCliente(data)
    // erro < 0 é rejeição de negócio do SSW (ex: CNPJ/senha inválidos) — 422, não 502.
    if (result.erro < 0) {
      return Response.json({ error: result.mensagem || "Cotação recusada pelo SSW", erro: result.erro }, { status: 422 })
    }
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
