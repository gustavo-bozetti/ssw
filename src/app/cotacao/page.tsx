import CotacaoForm from "@/components/cotacao/CotacaoForm"
import CotacaoFormDesktop from "@/components/cotacao/CotacaoFormDesktop"

export default function CotacaoPage() {
  return (
    <>
      <div className="lg:hidden"><CotacaoForm /></div>
      <div className="hidden lg:flex flex-col h-screen"><CotacaoFormDesktop /></div>
    </>
  )
}
