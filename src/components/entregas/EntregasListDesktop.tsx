"use client"

import { useRouter } from "next/navigation"
import { useEntregas } from "@/hooks/useEntregas"
import EntregaTable from "./EntregaTable"
import DashboardHeader from "./DashboardHeader"
import type { Entrega } from "@/lib/storage/types"
import { Plus, Package } from "lucide-react"

export default function EntregasListDesktop() {
  const router = useRouter()
  const { entregas, loading } = useEntregas()

  function handleSelect(e: Entrega) {
    router.push(`/entregas/${e.id}`)
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-0.5">LE Serviços</p>
            <h1 className="text-2xl font-bold text-[#1F1F1F]">Logística</h1>
          </div>
          <button
            onClick={() => router.push("/entregas/nova")}
            className="flex items-center gap-2 bg-[#2EA3F2] text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-500 transition-colors"
          >
            <Plus strokeWidth={2} className="w-4 h-4" />
            Nova entrega
          </button>
        </div>

        <div className="flex gap-6 items-start">
          {/* table */}
          <div className="flex-1 min-w-0">
            {loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-[#2EA3F2] border-t-transparent rounded-full animate-spin" />
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
                  <p className="font-semibold text-[#1F1F1F]">Nenhuma entrega</p>
                  <p className="text-sm text-gray-400 mt-1">Clique em Nova entrega para começar</p>
                </div>
              </div>
            )}

            {!loading && entregas.length > 0 && (
              <EntregaTable entregas={entregas} onSelect={handleSelect} />
            )}
          </div>

          {/* KPI panel */}
          <div className="w-[220px] shrink-0">
            <DashboardHeader entregas={entregas} />
          </div>
        </div>
      </div>
    </div>
  )
}
