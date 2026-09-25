import type { StatusEntrega } from "@/lib/storage/types"
import { Clock, PackageCheck, Truck, CheckCircle2, XCircle } from "lucide-react"

const CONFIG: Record<StatusEntrega, { label: string; dot: string; text: string; bg: string; Icon: React.ElementType }> = {
  CRIADA:      { label: "Criada",      dot: "bg-gray-400",      text: "text-gray-600",       bg: "bg-gray-100",       Icon: Clock         },
  COLETADA:    { label: "Coletada",    dot: "bg-primary",     text: "text-primary",      bg: "bg-blue-50",        Icon: PackageCheck  },
  EM_TRANSITO: { label: "Em trânsito", dot: "bg-[#FF6900]",     text: "text-[#FF6900]",      bg: "bg-orange-50",      Icon: Truck         },
  ENTREGUE:    { label: "Entregue",    dot: "bg-[#29C4A9]",     text: "text-[#29C4A9]",      bg: "bg-emerald-50",     Icon: CheckCircle2  },
  CANCELADA:   { label: "Cancelada",   dot: "bg-red-400",       text: "text-red-500",         bg: "bg-red-50",         Icon: XCircle       },
}

export default function StatusBadge({ status, large }: { status: StatusEntrega; large?: boolean }) {
  const c = CONFIG[status]
  const { Icon } = c
  if (large) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${c.bg}`}>
        <Icon strokeWidth={1.5} className={`w-4 h-4 ${c.text}`} />
        <span className={`text-sm font-semibold ${c.text}`}>{c.label}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
      <span className={c.text}>{c.label}</span>
    </span>
  )
}
