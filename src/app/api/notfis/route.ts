import { enviarNotfis } from "@/lib/ssw/notfis"
import { z } from "zod"

const enderecoSchema = z.object({
  rua: z.string().min(1).max(50),
  numero: z.string().min(1).max(4),
  complemento: z.string().max(30).optional(),
  bairro: z.string().min(1).max(10),
  cidade: z.string().min(1),
  uf: z.string().length(2),
  cep: z.coerce.number().int(),
})

const nfSchema = z.object({
  tipoNF: z.enum(["NORMAL", "REVERSA", "DEVOLUCAO"]).default("NORMAL"),
  condicaoFrete: z.enum(["CIF", "FOB"]),
  numero: z.coerce.number().int().positive(),
  serie: z.string().min(1),
  chaveNFe: z.string().length(44).optional().or(z.literal("")),
  dataEmissao: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use DD/MM/AAAA"),
  qtdeVolumes: z.coerce.number().int().min(1),
  valorMercadoria: z.coerce.number().positive(),
  pesoReal: z.coerce.number().positive(),
  cubagem: z.coerce.number().positive().optional(),
  pedido: z.string().optional(),
  valorFrete: z.coerce.number().optional(),
  codServico: z.coerce.number().int().optional(),
  tipoServico: z.string().optional(),
})

const destinatarioSchema = z.object({
  cnpj: z.string().min(11),
  nome: z.string().min(1),
  inscr: z.string().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  endereco: enderecoSchema,
  nf: z.array(nfSchema).min(1),
})

const schema = z.object({
  lote: z.string().optional(),
  cnpjRemetente: z.string().min(11).optional(),
  nomeRemetente: z.string().optional(),
  destinatarios: z.array(destinatarioSchema).min(1),
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
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const d = parsed.data

  try {
    const result = await enviarNotfis({
      lote: d.lote,
      dados: [{
        cnpj: d.cnpjRemetente,
        remetente: d.nomeRemetente && d.cnpjRemetente
          ? { cnpj: d.cnpjRemetente, nome: d.nomeRemetente }
          : undefined,
        destinatario: d.destinatarios,
      }],
    })
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
