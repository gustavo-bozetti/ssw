import { registrarOcorrencia } from "@/lib/ssw/client"
import type { OcorrenciaPayload } from "@/lib/ssw/ocorrencias"
import { z } from "zod"

const schema = z.object({
  // identificação do envio (ao menos um obrigatório)
  chaveNfe: z.string().length(44).optional(),
  numeroNf: z.coerce.number().int().optional(),
  serieNf: z.string().optional(),
  codigoNR: z.string().optional(), // numeroColeta como fallback
  cnpjRemetente: z.string().optional(),

  // ocorrência
  codigo: z.coerce.number().int(),
  descricao: z.string().min(1).max(100),
  complemento: z.string().max(200).optional(),
  nomeRec: z.string().optional(),
  documentoRec: z.string().optional(),
  parentescoRec: z.string().optional(),
  dataHoraAgendamento: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  imagem: z.string().optional(), // base64
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

  if (!d.chaveNfe && !d.codigoNR && !(d.numeroNf && d.serieNf)) {
    return Response.json(
      { error: "Informe chaveNfe, codigoNR (numeroColeta), ou numeroNf+serieNf" },
      { status: 422 }
    )
  }

  const dataHoraEvento = new Date().toISOString().replace("Z", "-03:00")

  const payload: OcorrenciaPayload = {
    cnpjRemetente: d.cnpjRemetente,
    nf: {
      chaveNFe: d.chaveNfe,
      numeroNFe: d.numeroNf,
      serieNFe: d.serieNf,
      codigoNR: d.codigoNR,
    },
    ocorrencia: {
      dataHoraEvento,
      codigo: String(d.codigo),
      descricao: d.descricao,
      complemento: d.complemento,
      nomeRec: d.nomeRec,
      documentoRec: d.documentoRec,
      parentescoRec: d.parentescoRec,
      dataHoraAgendamento: d.dataHoraAgendamento,
      latitude: d.latitude,
      longitude: d.longitude,
      imagem: d.imagem,
    },
  }

  try {
    const result = await registrarOcorrencia(payload)
    return Response.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contactar SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
