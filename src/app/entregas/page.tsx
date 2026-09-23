import EntregasList from "@/components/entregas/EntregasList"
import EntregasListDesktop from "@/components/entregas/EntregasListDesktop"

export default function EntregasPage() {
  return (
    <>
      <div className="lg:hidden">
        <EntregasList />
      </div>
      <div className="hidden lg:block">
        <EntregasListDesktop />
      </div>
    </>
  )
}
