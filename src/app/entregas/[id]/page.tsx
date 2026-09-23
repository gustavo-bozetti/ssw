import EntregaDetalhe from "@/components/entregas/EntregaDetalhe"
import EntregaDetalheDesktop from "@/components/entregas/EntregaDetalheDesktop"

export default async function EntregaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <div className="lg:hidden">
        <EntregaDetalhe id={id} />
      </div>
      <div className="hidden lg:block">
        <EntregaDetalheDesktop id={id} />
      </div>
    </>
  )
}
