import EntregaForm from "@/components/entregas/EntregaForm"
import EntregaFormDesktop from "@/components/entregas/EntregaFormDesktop"

export default function NovaEntregaPage() {
  return (
    <>
      <div className="lg:hidden">
        <EntregaForm />
      </div>
      <div className="hidden lg:block">
        <EntregaFormDesktop />
      </div>
    </>
  )
}
