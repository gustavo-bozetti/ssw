export type TipoVeiculo = "MOTO" | "CARRO" | "CAMINHAO"
export type StatusEntrega = "CRIADA" | "COLETADA" | "EM_TRANSITO" | "ENTREGUE" | "CANCELADA"
export type TipoPagamento = "O" | "D"

export interface Entrega {
  id: string
  tipoVeiculo: TipoVeiculo
  status: StatusEntrega

  // retorno SSW
  numeroColeta?: string
  erroSsw?: number
  mensagemSsw?: string

  // documento (opcional)
  chaveNfe?: string
  numeroNf?: string
  pedido?: string

  // partes
  solicitante: string
  nomeDestinatario: string
  cnpjDestinatario?: string
  cpfDestinatario?: string
  cnpjRemetente?: string
  nomeRemetente?: string

  // endereço
  cepEntrega: string
  enderecoEntrega?: string

  // carga
  quantidade: number
  peso: number
  cubagem?: number
  valorMercadoria?: number
  mercadoria?: string
  observacao?: string
  instrucao?: string

  // logística
  limiteColeta: string
  tipoPagamento: TipoPagamento
  reversa: boolean

  createdAt: string
  updatedAt: string
}

/** Interface que qualquer adapter de storage deve implementar.
 *  Trocar localStorage por DB = implementar esta interface e atualizar src/lib/storage/index.ts */
export interface StorageAdapter {
  getAll(): Promise<Entrega[]>
  getById(id: string): Promise<Entrega | null>
  save(data: Omit<Entrega, "id" | "createdAt" | "updatedAt">): Promise<Entrega>
  update(id: string, data: Partial<Omit<Entrega, "id" | "createdAt">>): Promise<Entrega>
  remove(id: string): Promise<void>
}
