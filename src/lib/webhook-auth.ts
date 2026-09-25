export function verificarWebhookAuth(request: Request): boolean {
  const auth = request.headers.get("authorization") ?? ""
  if (!auth.startsWith("Basic ")) return false

  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8")
  const [user, pass] = decoded.split(":")

  return (
    user === process.env.WEBHOOK_USER &&
    pass === process.env.WEBHOOK_PASS
  )
}
