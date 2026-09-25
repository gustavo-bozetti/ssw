"use client"

import { useRouter } from "next/navigation"
import { useEntregas } from "@/hooks/useEntregas"
import EntregaTable from "./EntregaTable"
import type { Entrega } from "@/lib/storage/types"
import { Plus, Package } from "lucide-react"

export default function EntregasListDesktop() {
  const router = useRouter()
  const { entregas, loading } = useEntregas()

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-8 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Entregas</span>
          <button
            onClick={() => router.push("/entregas/nova")}
            className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus strokeWidth={2} className="w-4 h-4" />
            Nova entrega
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Carregando entregas…</p>
            </div>
          </div>
        )}

        {!loading && entregas.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Package strokeWidth={1} className="w-8 h-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-ink">Nenhuma entrega</p>
              <p className="text-sm text-gray-400 mt-1">Clique em Nova entrega para começar</p>
            </div>
          </div>
        )}

        {!loading && entregas.length > 0 && (
          <EntregaTable
            entregas={entregas}
            onSelect={(e: Entrega) => router.push(`/entregas/${e.id}`)}
          />
        )}
      </div>
    </div>
  )
}
