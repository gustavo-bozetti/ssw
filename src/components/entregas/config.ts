import type { TipoVeiculo, StatusEntrega } from "@/lib/storage/types"
import { Bike, Car, Truck } from "lucide-react"

export const VEICULO_CONFIG: Record<
  TipoVeiculo,
  { label: string; Icon: React.ElementType; pesoMax: number | null; qtdMax: number | null }
> = {
  MOTO:     { label: "Moto",     Icon: Bike,  pesoMax: 10,   qtdMax: 1   },
  CARRO:    { label: "Carro",    Icon: Car,   pesoMax: 100,  qtdMax: 10  },
  CAMINHAO: { label: "Caminhão", Icon: Truck, pesoMax: null, qtdMax: null },
}

export const STATUS_CONFIG: Record<
  StatusEntrega,
  { label: string; color: string }
> = {
  CRIADA:      { label: "Criada",      color: "bg-gray-100 text-gray-700"           },
  COLETADA:    { label: "Coletada",    color: "bg-blue-50 text-primary"           },
  EM_TRANSITO: { label: "Em trânsito", color: "bg-orange-50 text-[#FF6900]"         },
  ENTREGUE:    { label: "Entregue",    color: "bg-emerald-50 text-[#29C4A9]"        },
  CANCELADA:   { label: "Cancelada",   color: "bg-red-50 text-red-500"              },
}
