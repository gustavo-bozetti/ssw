"use client"

import { useEffect } from "react"

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, children }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-3xl px-4 pt-3 pb-8 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        {children}
      </div>
    </div>
  )
}
