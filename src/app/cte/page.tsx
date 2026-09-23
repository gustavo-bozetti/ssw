import CteForm from "@/components/cte/CteForm"
import CteFormDesktop from "@/components/cte/CteFormDesktop"

export default function CtePage() {
  return (
    <>
      <div className="lg:hidden"><CteForm /></div>
      <div className="hidden lg:flex flex-col h-screen"><CteFormDesktop /></div>
    </>
  )
}
