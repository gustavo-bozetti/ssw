"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEntregas } from "@/hooks/useEntregas"
import { VEICULO_CONFIG } from "./config"
import StatusBadge from "@/components/ui/StatusBadge"
import DashboardHeader from "./DashboardHeader"
import EntregaTable from "./EntregaTable"
import { Package, Truck, CheckCircle2, ChevronRight, Plus } from "lucide-react"

export default function EntregasList() {
  const router = useRouter()
  const { entregas, loading } = useEntregas()

  const total = entregas.length
  const emTransito = entregas.filter((e) => e.status === "EM_TRANSITO" || e.status === "COLETADA").length
  const entregues = entregas.filter((e) => e.status === "ENTREGUE").length

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg lg:max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">LE Serviços</p>
            <h1 className="text-xl lg:text-2xl font-bold text-[#1F1F1F]">Logística</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/entregas/nova"
              className="hidden lg:inline-flex items-center gap-2 bg-[#FF6900] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors"
            >
              <Plus strokeWidth={2.5} className="w-4 h-4" />
              Nova Entrega
            </Link>
            <div className="w-10 h-10 rounded-full bg-[#2EA3F2] flex items-center justify-center text-white font-bold text-sm lg:hidden">
              LS
            </div>
          </div>
        </div>
      </header>

      {/* desktop layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
          <DashboardHeader entregas={entregas} />
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              Carregando…
            </div>
          ) : (
            <EntregaTable entregas={entregas} onSelect={(e) => router.push(`/entregas/${e.id}`)} />
          )}
        </div>
      </div>

      {/* mobile layout */}
      <main className="lg:hidden max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* stats hero */}
        <div className="bg-[#2D3940] rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Resumo</p>
          <div className="grid grid-cols-3 gap-2">
            <Stat value={total} label="Total" Icon={Package} />
            <Stat value={emTransito} label="Em rota" Icon={Truck} highlight />
            <Stat value={entregues} label="Entregues" Icon={CheckCircle2} success />
          </div>
        </div>

        {/* loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* empty state */}
        {!loading && entregas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Package strokeWidth={1} className="w-10 h-10 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-[#1F1F1F] font-semibold text-lg">Nenhuma entrega</p>
              <p className="text-gray-500 text-sm mt-1">Toque em + para criar sua primeira</p>
            </div>
          </div>
        )}

        {/* list */}
        {!loading && entregas.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Suas entregas</p>
            {entregas.map((e) => {
              const v = VEICULO_CONFIG[e.tipoVeiculo]
              const data = new Date(e.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })
              return (
                <Link key={e.id} href={`/entregas/${e.id}`} className="block">
                  <div className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#F3F3F3] flex items-center justify-center shrink-0">
                        <v.Icon strokeWidth={1.5} className="w-6 h-6 text-[#2D3940]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#1F1F1F] truncate">{e.nomeDestinatario}</p>
                          <StatusBadge status={e.status} />
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {e.enderecoEntrega ?? `CEP ${e.cepEntrega}`}
                        </p>
                      </div>
                      <ChevronRight strokeWidth={1.5} className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                      <span>{e.peso} kg</span>
                      <span>·</span>
                      <span>{e.quantidade} vol.</span>
                      {e.numeroColeta && (
                        <>
                          <span>·</span>
                          <span className="font-mono">#{e.numeroColeta}</span>
                        </>
                      )}
                      <span className="ml-auto">{data}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ value, label, highlight, success, Icon }: { value: number; label: string; highlight?: boolean; success?: boolean; Icon: React.ElementType }) {
  const color = highlight ? "text-[#FF6900]" : success ? "text-[#29C4A9]" : "text-white"
  return (
    <div className="text-center">
      <Icon strokeWidth={1.5} className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
