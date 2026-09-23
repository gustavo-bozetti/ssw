import { criarColeta } from "@/lib/ssw/client"
import { criarEntregaSchema } from "@/lib/validations/entrega"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Corpo inválido" }, { status: 400 })
  }

  const parsed = criarEntregaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const strip = (s?: string) => s?.replace(/\D/g, "") || undefined

  const data = parsed.data
  const obs = [
    `Veiculo: ${data.tipoVeiculo}`,
    data.observacao,
  ]
    .filter(Boolean)
    .join(" | ")

  try {
    const result = await criarColeta({
      tipoPagamento: data.tipoPagamento,
      cepEntrega: parseInt(strip(data.cepEntrega)!),
      solicitante: data.solicitante,
      limiteColeta: data.limiteColeta,
      quantidade: data.quantidade,
      peso: data.peso,
      cubagem: data.cubagem,
      valorMerc: data.valorMercadoria,
      mercadoria: data.mercadoria,
      especie: data.especie,
      observacao: obs.slice(0, 160),
      instrucao: data.instrucao?.slice(0, 80),
      chaveNF: data.chaveNfe || undefined,
      numeroNF: data.numeroNf || undefined,
      nroPedido: data.pedido || undefined,
      cnpjRemetente: strip(data.cnpjRemetente) || process.env.SSW_CNPJ_REMETENTE || undefined,
      nomeRemetente: data.nomeRemetente || process.env.SSW_NOME_REMETENTE || undefined,
      cnpjDestinatario: strip(data.cnpjDestinatario),
      enderecoEntrega: data.enderecoEntrega,
      reversa: data.reversa ? "S" : "N",
    })

    // erro -2 = credenciais/domínio inválidos
    if (result.erro === -2) {
      return Response.json({ error: "Credenciais SSW inválidas" }, { status: 401 })
    }
    // erro -1 = erro de cálculo/impedimento
    if (result.erro === -1) {
      return Response.json({ error: result.mensagem ?? "Erro de cálculo SSW" }, { status: 422 })
    }
    // outros negativos = erro genérico transportadora
    if (result.erro < 0) {
      return Response.json(
        { error: result.mensagem ?? "Erro na transportadora" },
        { status: 422 }
      )
    }

    // erro 0 = sucesso, erro 1 = sucesso com alerta (valor válido)
    return Response.json({
      ...result,
      alerta: result.erro === 1,
      cnpjRemetenteUsado: strip(data.cnpjRemetente) ?? process.env.SSW_CNPJ_REMETENTE,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
