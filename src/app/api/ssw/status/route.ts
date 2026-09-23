const WSDL = "https://ssw.inf.br/ws/sswCotacaoColeta/index.php"

export async function GET() {
  try {
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ssw="urn:sswinfbr.sswCotacaoColeta">
  <soapenv:Header/>
  <soapenv:Body>
    <ssw:getMercadoria>
      <dominio>${process.env.SSW_DOMINIO}</dominio>
      <login>${process.env.SSW_LOGIN}</login>
      <senha>${process.env.SSW_SENHA}</senha>
    </ssw:getMercadoria>
  </soapenv:Body>
</soapenv:Envelope>`

    const res = await fetch(WSDL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "urn:sswinfbr.sswCotacaoColeta#getMercadoria",
      },
      body: envelope,
    })

    if (!res.ok) {
      return Response.json({ ok: false, error: `SSW HTTP ${res.status}` }, { status: 502 })
    }

    const raw = await res.text()
    const hasReturn = raw.includes("<return>")

    // extrai mercadorias do XML
    const mercadorias: string[] = []
    const rx = /<descricao>([^<]+)<\/descricao>/g
    let m: RegExpExecArray | null
    while ((m = rx.exec(raw)) !== null) mercadorias.push(m[1])

    return Response.json({
      ok: hasReturn,
      domain: process.env.SSW_DOMINIO,
      mercadorias: mercadorias.slice(0, 10),
    })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 502 }
    )
  }
}
