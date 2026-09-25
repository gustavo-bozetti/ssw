// Páginas hospedadas pelo SSW (https://ssw.inf.br/ajuda/servico.html).
// Não podem ser embutidas: todas respondem X-Frame-Options: SAMEORIGIN.
// Abrir sempre em aba nova.

const SIGLA = process.env.NEXT_PUBLIC_SSW_SIGLA_EMP

const SERVICO = { dacte: 51, xml: 52, reemissaoFatura: 53 } as const

/** Retorna null enquanto a sigla da transportadora não estiver configurada. */
export function linkServico(tela: keyof typeof SERVICO): string | null {
  if (!SIGLA) return null
  return `https://ssw.inf.br/2/servico?id=${SERVICO[tela]}&sc=N&sm=N&sigla_emp=${SIGLA}`
}

/** Rastreamento público por chave de NF-e: GET, sem autenticação. */
export function linkRastreioPorChave(chaveNfe: string): string {
  return `https://ssw.inf.br/app/tracking/${chaveNfe}`
}
