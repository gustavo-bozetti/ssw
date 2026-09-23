import StatCard from "@/components/ui/StatCard"
import type { Entrega } from "@/lib/storage/types"

export default function DashboardHeader({ entregas }: { entregas: Entrega[] }) {
  const total = entregas.length
  const entregues = entregas.filter((e) => e.status === "ENTREGUE").length
  const emRota = entregas.filter((e) => e.status === "EM_TRANSITO" || e.status === "COLETADA").length
  const pendentes = entregas.filter((e) => e.status === "CRIADA").length
  const taxa = total > 0 ? Math.round((entregues / total) * 100) : 0

  return (
    <div>
      <p className="hidden lg:block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Visão geral</p>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 lg:gap-4 mb-6">
        <StatCard label="Total" value={total} color="gray" />
        <StatCard label="Em rota" value={emRota} color="blue" />
        <StatCard label="Entregues" value={entregues} color="green" />
        <StatCard label="Pendentes" value={pendentes} color="amber" />
        <StatCard
          label="Taxa de entrega"
          value={`${taxa}%`}
          color={taxa >= 80 ? "green" : taxa >= 50 ? "amber" : "red"}
        />
      </div>
    </div>
  )
}
