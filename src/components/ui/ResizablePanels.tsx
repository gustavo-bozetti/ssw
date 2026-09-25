"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export default function ResizablePanels({
  left,
  right,
  defaultWidth = 500,
  minWidth = 320,
  maxWidth = 760,
}: {
  left: React.ReactNode
  right: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
}) {
  const [width, setWidth] = useState(defaultWidth)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startX.current = e.clientX
      startW.current = width
      setDragging(true)
    },
    [width],
  )

  useEffect(() => {
    if (!dragging) return

    function onMove(e: MouseEvent) {
      const delta = e.clientX - startX.current
      const next = Math.max(minWidth, Math.min(maxWidth, startW.current + delta))
      setWidth(next)
    }

    function onUp() {
      setDragging(false)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragging, minWidth, maxWidth])

  // cursor global durante drag
  useEffect(() => {
    if (dragging) {
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    } else {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [dragging])

  return (
    <div className="flex flex-1 min-h-0">
      {/* painel esquerdo */}
      <div style={{ width }} className="shrink-0 bg-white overflow-y-auto">
        {left}
      </div>

      {/* divisor arrastável */}
      <div
        onMouseDown={onMouseDown}
        className="relative shrink-0 w-3 cursor-col-resize group flex items-stretch"
        title="Arraste para redimensionar"
      >
        {/* linha visual — ocupa altura toda do scroll */}
        <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors ${dragging ? "bg-primary" : "bg-gray-200 group-hover:bg-primary"}`} />

        {/* ícone de drag no meio */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-[3px] transition-opacity ${dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-primary" />
          ))}
        </div>
      </div>

      {/* painel direito */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {right}
      </div>
    </div>
  )
}
