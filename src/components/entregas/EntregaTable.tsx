"use client"

import type { Entrega, StatusEntrega } from "@/lib/storage/types"
import { VEICULO_CONFIG } from "./config"

const STATUS_STYLE: Record<StatusEntrega, string> = {
  CRIADA:      "bg-amber-100 text-amber-700",
  COLETADA:    "bg-blue-100 text-blue-700",
  EM_TRANSITO: "bg-indigo-100 text-indigo-700",
  ENTREGUE:    "bg-emerald-100 text-emerald-700",
  CANCELADA:   "bg-red-100 text-red-700",
}

const STATUS_LABEL: Record<StatusEntrega, string> = {
  CRIADA:      "Criada",
  COLETADA:    "Coletada",
  EM_TRANSITO: "Em trânsito",
  ENTREGUE:    "Entregue",
  CANCELADA:   "Cancelada",
}

function destino(e: Entrega): string {
  if (e.enderecoEntrega) {
    const parts = e.enderecoEntrega.split(",")
    return parts.slice(-2).join(",").trim()
  }
  return e.cepEntrega
}

export default function EntregaTable({
  entregas,
  onSelect,
}: {
  entregas: Entrega[]
  onSelect: (e: Entrega) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Veículo</th>
            <th className="px-4 py-3 text-left">Destinatário</th>
            <th className="px-4 py-3 text-left">Destino</th>
            <th className="px-4 py-3 text-right">Peso · Vol</th>
            <th className="px-4 py-3 text-left">Nº Coleta SSW</th>
            <th className="px-4 py-3 text-right">Criada em</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {entregas.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                Nenhuma entrega
              </td>
            </tr>
          )}
          {entregas.map((e) => {
            const v = VEICULO_CONFIG[e.tipoVeiculo]
            return (
              <tr
                key={e.id}
                onClick={() => onSelect(e)}
                className="group hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[e.status]}`}>
                    {STATUS_LABEL[e.status]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-600">
                    <v.Icon strokeWidth={1.5} className="w-4 h-4 shrink-0" />
                    <span className="text-xs">{v.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-semibold text-[#1F1F1F] text-sm max-w-[180px] truncate group-hover:text-gray-700">
                  {e.nomeDestinatario}
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[160px] truncate group-hover:text-gray-700">
                  {destino(e)}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-500 text-xs whitespace-nowrap group-hover:text-gray-700">
                  {e.peso ? `${e.peso}kg` : "—"}
                  {e.cubagem ? ` · ${e.cubagem}m³` : ""}
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-gray-600 group-hover:text-gray-700">
                  {e.numeroColeta ? `#${e.numeroColeta}` : "—"}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-400 text-xs group-hover:text-gray-600">
                  {new Date(e.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
