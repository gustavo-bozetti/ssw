import type { Entrega, StorageAdapter } from "./types"

const STORAGE_KEY = "logistica:entregas:v1"

function readAll(): Entrega[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Entrega[]
  } catch {
    return []
  }
}

function writeAll(data: Entrega[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const localStorageAdapter: StorageAdapter = {
  async getAll() {
    return readAll().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async getById(id) {
    return readAll().find((e) => e.id === id) ?? null
  },

  async save(data) {
    const entrega: Entrega = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    writeAll([...readAll(), entrega])
    return entrega
  },

  async update(id, data) {
    const all = readAll()
    const idx = all.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error(`Entrega ${id} não encontrada`)
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() }
    writeAll(all)
    return all[idx]
  },

  async remove(id) {
    writeAll(readAll().filter((e) => e.id !== id))
  },
}
