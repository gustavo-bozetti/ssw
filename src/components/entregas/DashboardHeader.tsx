import type { Entrega } from "@/lib/storage/types"

const DOT: Record<string, string> = {
  blue:  "bg-blue-400",
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  red:   "bg-red-400",
  gray:  "bg-gray-300",
}

function StatRow({ label, value, color = "gray" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[color] ?? DOT.gray}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-ink tabular-nums">{value}</span>
    </div>
  )
}

export default function DashboardHeader({ entregas }: { entregas: Entrega[] }) {
  const total = entregas.length
  const entregues = entregas.filter((e) => e.status === "ENTREGUE").length
  const emRota = entregas.filter((e) => e.status === "EM_TRANSITO" || e.status === "COLETADA").length
  const pendentes = entregas.filter((e) => e.status === "CRIADA").length
  const taxa = total > 0 ? Math.round((entregues / total) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Visão geral</p>
      <p className="text-3xl font-bold text-ink mb-3">{total}</p>
      <div>
        <StatRow label="Em rota"    value={emRota}     color="blue"  />
        <StatRow label="Entregues"  value={entregues}  color="green" />
        <StatRow label="Pendentes"  value={pendentes}  color="amber" />
        <StatRow label="Taxa"       value={`${taxa}%`} color={taxa >= 80 ? "green" : taxa >= 50 ? "amber" : "red"} />
      </div>
    </div>
  )
}
