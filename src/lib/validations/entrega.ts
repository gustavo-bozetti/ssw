import { z } from "zod"

export const criarEntregaSchema = z
  .object({
    tipoVeiculo: z.enum(["MOTO", "CARRO", "CAMINHAO"]),
    tipoPagamento: z.enum(["O", "D"]).default("O"),

    nomeDestinatario: z.string().min(2),
    cnpjDestinatario: z.string().optional(),
    cpfDestinatario: z.string().optional(),

    cepEntrega: z.string().min(8).max(9).transform((v) => v.replace(/\D/g, "")),
    enderecoEntrega: z.string().optional(),

    cnpjRemetente: z.string().optional(),
    nomeRemetente: z.string().optional(),

    quantidade: z.coerce.number().int().min(1),
    peso: z.coerce.number().positive(),
    cubagem: z.coerce.number().positive().optional(),
    valorMercadoria: z.coerce.number().positive().optional(),
    mercadoria: z.string().optional(),
    especie: z.string().optional(),
    observacao: z.string().max(160).optional(),
    instrucao: z.string().max(80).optional(),

    chaveNfe: z.string().length(44).optional().or(z.literal("")),
    numeroNf: z.string().optional(),
    pedido: z.string().optional(),

    solicitante: z.string().min(2),
    limiteColeta: z.string().min(1),
    reversa: z.boolean().default(false),
  })
  .refine((d) => !(d.tipoVeiculo === "MOTO" && d.peso > 10), {
    message: "Moto suporta no máximo 10 kg",
    path: ["peso"],
  })
  .refine((d) => !(d.tipoVeiculo === "CARRO" && d.peso > 100), {
    message: "Carro suporta no máximo 100 kg",
    path: ["peso"],
  })
  .refine((d) => !(d.tipoVeiculo === "MOTO" && d.quantidade > 1), {
    message: "Moto suporta no máximo 1 volume",
    path: ["quantidade"],
  })
  .refine((d) => !(d.tipoVeiculo === "CARRO" && d.quantidade > 10), {
    message: "Carro suporta no máximo 10 volumes",
    path: ["quantidade"],
  })

export type CriarEntregaInput = z.infer<typeof criarEntregaSchema>
