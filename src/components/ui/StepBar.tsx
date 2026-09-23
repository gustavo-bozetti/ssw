export default function StepBar({ steps, current }: { steps: number; current: number }) {
  return (
    <div className="flex items-center px-6 py-4">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
            i < current
              ? "bg-[#2EA3F2] text-white"
              : i === current
              ? "bg-[#2EA3F2] text-white ring-4 ring-blue-100"
              : "bg-gray-200 text-gray-400"
          }`}>
            {i < current ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < steps - 1 && (
            <div className={`flex-1 h-0.5 mx-1 transition-all ${i < current ? "bg-[#2EA3F2]" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  )
}
