import ConsultasForm from "@/components/consultas/ConsultasForm"
import ConsultasFormDesktop from "@/components/consultas/ConsultasFormDesktop"

export default function ConsultasPage() {
  return (
    <>
      <div className="lg:hidden"><ConsultasForm /></div>
      <div className="hidden lg:flex flex-col h-screen"><ConsultasFormDesktop /></div>
    </>
  )
}
