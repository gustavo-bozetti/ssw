export interface CodigoOcorrencia {
  codigo: number
  descricao: string
  grupo: string
  requiresAgendamento?: boolean
  requiresRecipient?: boolean
}

export const CODIGOS_OCORRENCIA: CodigoOcorrencia[] = [
  // Entrega
  { codigo: 85, descricao: "SAIDA PARA ENTREGA",                     grupo: "Entrega" },
  { codigo: 7,  descricao: "CHEGADA NO CLIENTE DESTINATÁRIO",         grupo: "Entrega" },
  { codigo: 1,  descricao: "MERCADORIA ENTREGUE",                     grupo: "Entrega", requiresRecipient: true },
  { codigo: 2,  descricao: "MERCADORIA PRE-ENTREGUE (MOBILE)",        grupo: "Entrega", requiresRecipient: true },
  { codigo: 37, descricao: "ENTREGA REALIZADA COM RESSALVA",          grupo: "Entrega", requiresRecipient: true },
  { codigo: 14, descricao: "ENTREGA PARCIAL DE UMA NOTA FISCAL",      grupo: "Entrega" },
  { codigo: 19, descricao: "ANEXADO COMPROVANTE DE ENTREGA COMPLEMENTAR", grupo: "Entrega" },

  // Tentativas
  { codigo: 31, descricao: "PRIMEIRA TENTATIVA DE ENTREGA",           grupo: "Tentativa" },
  { codigo: 32, descricao: "SEGUNDA TENTATIVA DE ENTREGA",            grupo: "Tentativa" },
  { codigo: 33, descricao: "TERCEIRA TENTATIVA DE ENTREGA",           grupo: "Tentativa" },

  // Pendência destinatário
  { codigo: 11, descricao: "LOCAL DE ENTREGA FECHADO/AUSENTE",        grupo: "Pendência" },
  { codigo: 9,  descricao: "DESTINATARIO DESCONHECIDO",               grupo: "Pendência" },
  { codigo: 10, descricao: "LOCAL DE ENTREGA NAO LOCALIZADO",         grupo: "Pendência" },
  { codigo: 38, descricao: "CLIENTE RECUSA/NAO PODE RECEBER MERCAD",  grupo: "Pendência" },
  { codigo: 8,  descricao: "SENHA NAO CONFERE. ENTREGA NAO REALIZADA", grupo: "Pendência" },
  { codigo: 13, descricao: "ENTREGA PREJUDICADA PELO HORARIO",        grupo: "Pendência" },
  { codigo: 15, descricao: "ENTREGA AGENDADA PELO CLIENTE",           grupo: "Pendência", requiresAgendamento: true },
  { codigo: 16, descricao: "ENTREGA AGUARDANDO INSTRUCOES",           grupo: "Pendência" },

  // Avaria / Roubo
  { codigo: 53, descricao: "MERCADORIA AVARIADA",                     grupo: "Ocorrência" },
  { codigo: 54, descricao: "EMBALAGEM AVARIADA",                      grupo: "Ocorrência" },
  { codigo: 55, descricao: "CARGA ROUBADA",                           grupo: "Ocorrência" },
  { codigo: 59, descricao: "VEICULO AVARIADO/SINISTRADO",             grupo: "Ocorrência" },
  { codigo: 69, descricao: "COLETA AVARIADA",                         grupo: "Ocorrência" },

  // Devolução
  { codigo: 3,  descricao: "MERCADORIA DEVOLVIDA AO REMETENTE",       grupo: "Devolução" },
  { codigo: 26, descricao: "AGUARDANDO AUTORIZACAO P/ DEVOLUCAO",     grupo: "Devolução" },
  { codigo: 27, descricao: "DEVOLUCAO AUTORIZADA",                    grupo: "Devolução" },

  // Operacional
  { codigo: 80, descricao: "MERCADORIA RECEBIDA PARA TRANSPORTE",     grupo: "Operacional" },
  { codigo: 82, descricao: "SAIDA DE UNIDADE",                        grupo: "Operacional" },
  { codigo: 83, descricao: "CHEGADA EM UNIDADE DE TRANSBORDO",        grupo: "Operacional" },
  { codigo: 84, descricao: "CHEGADA EM UNIDADE DE ENTREGA",           grupo: "Operacional" },
  { codigo: 95, descricao: "ESTOU CHEGANDO",                          grupo: "Operacional" },
  { codigo: 96, descricao: "PREVISAO DE ENTREGA ATUALIZADA",          grupo: "Operacional" },
]

export interface OcorrenciaPayload {
  cnpjRemetente?: string
  nf?: {
    serieNFe?: string
    numeroNFe?: number
    chaveNFe?: string
    pedido?: string
    codigoNR?: string
  }
  cte?: {
    chaveCTe?: string
  }
  ocorrencia: {
    dataHoraEvento: string
    codigo: string
    descricao: string
    complemento?: string
    unidade?: string
    imagem?: string
    latitude?: string
    longitude?: string
    placaAgregado?: string
    nomeRec?: string
    documentoRec?: string
    parentescoRec?: string
    dataHoraAgendamento?: string
  }
}

export interface OcorrenciaResponse {
  codigo: string
  descricao: string
  numeroNFe?: string
  chaveCTe?: string
  dataHora?: string
  protocolo?: string
}
