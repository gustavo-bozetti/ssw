"use client"

import { useState, useEffect, useCallback } from "react"
import { storage } from "@/lib/storage"
import type { Entrega } from "@/lib/storage"

export function useEntregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setEntregas(await storage.getAll())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entregas, loading, refresh }
}

export function useEntrega(id: string) {
  const [entrega, setEntrega] = useState<Entrega | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storage.getById(id).then((e) => {
      setEntrega(e)
      setLoading(false)
    })
  }, [id])

  const update = useCallback(
    async (data: Partial<Omit<Entrega, "id" | "createdAt">>) => {
      const updated = await storage.update(id, data)
      setEntrega(updated)
      return updated
    },
    [id]
  )

  return { entrega, loading, update }
}
