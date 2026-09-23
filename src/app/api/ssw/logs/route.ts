import { getLogs, clearLogs } from "@/lib/ssw/resilience"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level") // info | warn | error
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 300)

  let logs = getLogs()
  if (level) logs = logs.filter((l) => l.level === level)
  logs = logs.slice(0, limit)

  return Response.json({ total: logs.length, logs })
}

export async function DELETE() {
  clearLogs()
  return Response.json({ ok: true })
}
