import NotfisForm from "@/components/notfis/NotfisForm"
import NotfisFormDesktop from "@/components/notfis/NotfisFormDesktop"

export default function NotfisPage() {
  return (
    <>
      <div className="lg:hidden"><NotfisForm /></div>
      <div className="hidden lg:flex flex-col h-screen"><NotfisFormDesktop /></div>
    </>
  )
}
