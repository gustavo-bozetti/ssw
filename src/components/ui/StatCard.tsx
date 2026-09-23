interface Props {
  label: string
  value: string | number
  color?: "blue" | "green" | "amber" | "red" | "gray"
}

const colors = {
  blue:  "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red:   "bg-red-50 text-red-700 border-red-100",
  gray:  "bg-white text-gray-800 border-gray-100",
}

const barColor = {
  blue:  "bg-blue-500",
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  red:   "bg-red-500",
  gray:  "bg-gray-300",
}

export default function StatCard({ label, value, color = "gray" }: Props) {
  return (
    <div className={`rounded-2xl border px-5 py-4 lg:px-6 lg:py-5 ${colors[color]}`}>
      <div className={`h-1 w-8 rounded-full mb-3 ${barColor[color]}`} />
      <p className="text-2xl lg:text-3xl font-bold leading-none">{value}</p>
      <p className="text-xs mt-1.5 opacity-70 font-medium">{label}</p>
    </div>
  )
}
