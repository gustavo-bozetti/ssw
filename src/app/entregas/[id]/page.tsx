import EntregaDetalhe from "@/components/entregas/EntregaDetalhe"

export default async function EntregaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EntregaDetalhe id={id} />
}
