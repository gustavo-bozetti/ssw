# SSW Domain Implementation Workflow

Cada novo domínio SSW segue este processo em ordem. Nunca pule uma etapa.

---

## Checklist por Domain

### 1. Investigar Documentação
- [ ] Fetch `https://ssw.inf.br/ajuda/<endpoint>.html`
- [ ] Identificar: endpoint URL, método HTTP, autenticação necessária
- [ ] Mapear todos os campos obrigatórios e opcionais com tipos
- [ ] Verificar se existe REST (`/api/` ou `/ws/.../v1/`) ou apenas SOAP
- [ ] Se SOAP: buscar `/ws/<service>/openapi.json` — se 404, confirmar SOAP puro
- [ ] Anotar estrutura completa da resposta e códigos de erro

### 2. Testar com curl (ANTES de implementar)
- [ ] Montar payload mínimo válido com credenciais `tes/fabio/fabio`
- [ ] Executar curl direto no SSW (não na API local ainda)
- [ ] Confirmar: endpoint responde, autenticação funciona, estrutura da resposta bate com docs
- [ ] Se SOAP: testar envelope XML manualmente
- [ ] Documentar o resultado real (campos retornados, valores de exemplo)
- [ ] **Não avançar se curl falhar por razão desconhecida**

### 3. Implementar
Ordem obrigatória dos arquivos:

```
src/lib/ssw/<domain>.ts          ← tipos + função cliente SSW
src/app/api/<domain>/route.ts    ← API route Next.js (validação Zod + chamada client)
src/components/<domain>/...tsx   ← UI mobile-first
src/app/<domain>/page.tsx        ← página (importa componente)
```

Regras:
- Validação com Zod em toda API route
- Credenciais SSW NUNCA no cliente — sempre via API route server-side
- UI mobile-first: tap targets grandes, sem hover-only states
- Campos condicionais só aparecem quando relevantes
- Abstrações mínimas: não criar helpers "pra usar futuramente"

### 4. Build
- [ ] `npm run build`
- [ ] Zero erros TypeScript
- [ ] Se erros: corrigir antes de testar

### 5. Testar curl DEPOIS (na API local)
- [ ] Subir servidor: `npm run dev` (se não estiver rodando)
- [ ] Testar `POST http://localhost:3000/api/<domain>` com payload válido
- [ ] Testar com payload inválido → confirmar 422
- [ ] Comparar resposta local com resposta direta no SSW — devem ser equivalentes
- [ ] Testar edge cases: sem campo obrigatório, valor fora do range

### 6. Fix
- [ ] Corrigir qualquer divergência encontrada nos testes
- [ ] Re-build se houve mudança de código
- [ ] Re-testar até passar

### 7. Atualizar SSW_APIS.md
- [ ] Adicionar endpoint ao arquivo de documentação
- [ ] Marcar como ✅ implementado no Roadmap

---

## Domains — Status

| Domain | Endpoint SSW | Status |
|--------|-------------|--------|
| Criar Entrega | `POST /ws/sswColeta/v1/coleta` | ✅ Implementado |
| Ocorrências | `POST /api/ocorrenciaParceiro` | ✅ Implementado |
| Cotação | SOAP `/ws/sswCotacaoColeta/` | ✅ Implementado |
| **NOTFIS** | `POST /api/notfis` | ✅ Implementado |
| consultaNr | `GET /api/consultaNr` | ✅ Implementado |
| Etiqueta Impressão | `GET /api/consultaNrImp` | ✅ Implementado |
| CT-e XML | `POST /api/cte` | ✅ Implementado |
| Tracking PF | `POST /api/trackingpf` | ✅ Implementado |
| Tracking Dest | `POST /api/trackingdest` | ✅ Implementado |
| Tracking Pag | `POST /api/trackingpag` | ✅ Implementado |

---

## Padrões de Código

### API Route (template)
```typescript
import { z } from "zod"
import { sswFunction } from "@/lib/ssw/client"

const schema = z.object({ /* campos */ })

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() }
  catch { return Response.json({ error: "Corpo inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await sswFunction(parsed.data)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro SSW"
    return Response.json({ error: message }, { status: 502 })
  }
}
```

### SSW Client (template)
```typescript
// Autenticado: usa postWithAuth() de client.ts
// Não autenticado: usa post() de client.ts
// SOAP: buildEnvelope() + callSoap() (ver cotacao.ts)
```

### Limites de veículo (validação client-side)
```typescript
// MOTO: peso ≤ 10kg, qtd ≤ 1
// CARRO: peso ≤ 100kg, qtd ≤ 10
// CAMINHAO: sem limite
```

---

## Notas de Infraestrutura

- **Token SSW** (`generateToken`): expira em 6h, cache em `lib/ssw/auth.ts`
- **Rate limit SSW**: 20 req/s — não implementar polling agressivo
- **CNPJ EDI**: obrigatório para endpoints autenticados — configurar `SSW_CNPJ_EDI` no `.env.local`
- **Storage**: localStorage adapter — trocar por DB alterando apenas `src/lib/storage/index.ts`
- **SOAP**: usar `buildEnvelope()` + `callSoap()` de `lib/ssw/cotacao.ts` como referência
