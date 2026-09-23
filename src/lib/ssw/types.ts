export type TipoVeiculo = "MOTO" | "CARRO" | "CAMINHAO"
export type TipoPagamento = "O" | "D"

export interface ColetaPayload {
  dominio: string
  login: string
  senha: string
  tipoPagamento: TipoPagamento
  cepEntrega: number
  solicitante: string
  limiteColeta: string // ISO "2026-09-30T09:45:00"
  quantidade: number
  peso: number
  observacao?: string
  instrucao?: string
  cubagem?: number
  valorMerc?: number
  especie?: string
  chaveNF?: string
  numeroNF?: string
  cnpjRemetente?: string
  nomeRemetente?: string
  cnpjDestinatario?: string
  cnpjSolicitante?: string
  nroPedido?: string
  mercadoria?: string
  enderecoEntrega?: string
  cepEndColeta?: number
  logradouroEndColeta?: string
  numeroEndColeta?: string
  complementoEndColeta?: string
  bairroEndColeta?: string
  reversa?: "S" | "N"
}

export interface ColetaResponse {
  erro: number
  mensagem: string
  numeroColeta: string
}

export interface TrackingPayload {
  cnpj: string
  senha?: string
  sigla_emp?: string
  tipo_doc?: "E" | "C"
  nro_nf?: string
  pedido?: string
  chave_nfe?: string
  nro_coleta?: string
}

export interface TrackingEvento {
  data: string
  hora: string
  ocorrencia: string
  descricao: string
  cidade?: string
  uf?: string
}

export interface TrackingResponse {
  sucesso: boolean
  mensagem?: string
  eventos?: TrackingEvento[]
  [key: string]: unknown
}

export interface TrackingDanfeResponse {
  sucesso: boolean
  mensagem?: string
  eventos?: TrackingEvento[]
  [key: string]: unknown
}

export const LIMITE_VEICULO: Record<TipoVeiculo, { pesoMax: number | null; qtdMax: number | null }> = {
  MOTO:     { pesoMax: 10,  qtdMax: 1  },
  CARRO:    { pesoMax: 100, qtdMax: 10 },
  CAMINHAO: { pesoMax: null, qtdMax: null },
}
