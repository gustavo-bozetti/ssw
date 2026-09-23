# SSW WebAPIs — Documentação de Endpoints

Base URL: `https://ssw.inf.br`  
Rate limit: **20 requisições/segundo** — chamadas extras são recusadas.

---

## Autenticação

### `POST /api/generateToken`

Gera um Bearer token para as APIs que exigem autenticação (ex: NOTFIS).  
Tokens expiram em **6 horas**. Se já existir token válido, o mesmo é retornado (a não ser que `force: true`).

**Corpo da requisição:**
```json
{
  "domain": "TES",
  "username": "user",
  "password": "pass",
  "cnpj_edi": "12345678910124",
  "force": false
}
```

| Campo      | Tipo    | Obrigatório | Descrição                                      |
|------------|---------|-------------|------------------------------------------------|
| domain     | string  | Sim         | Sigla da transportadora no SSW                 |
| username   | string  | Sim         | Usuário de acesso                              |
| password   | string  | Sim         | Senha (sem caracteres acentuados)              |
| cnpj_edi   | string  | Sim         | CNPJ do cliente (pré-autorizado via ssw2173)   |
| force      | boolean | Não         | Forçar geração de novo token mesmo se válido   |

**Resposta (200):**
```json
{
  "sucess": true,
  "date_time": "2024-01-01T10:00:00",
  "domain": "TES",
  "username": "user",
  "token": "eyJ...",
  "validity": "06:00:00",
  "message": "Token gerado com sucesso"
}
```

---

## Rastreamento

### `POST /api/trackingdanfe`

Rastreia uma NF-e pela chave de acesso (44 dígitos).  
**Não requer autenticação.**

**Content-Type:** `application/json` → resposta JSON  
**Content-Type:** `application/x-www-form-urlencoded` → resposta XML

**Corpo da requisição:**
```json
{
  "chave_nfe": "43160400850257000132550010000083991000083990"
}
```

| Campo     | Tipo   | Obrigatório | Descrição                        |
|-----------|--------|-------------|----------------------------------|
| chave_nfe | string | Sim         | Chave de acesso da NF-e (44 dígitos) |

**Exemplo curl:**
```bash
curl https://ssw.inf.br/api/trackingdanfe \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"chave_nfe": "43160400850257000132550010000083991000083990"}'
```

---

## NOTFIS (Recepção de Notas Fiscais)

### `POST /api/notfis`

Envia notas fiscais para o sistema da transportadora.  
**Requer Bearer token** obtido via `/api/generateToken`.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Corpo da requisição:**
```json
{
  "lote": "LOTE-001",
  "dados": [
    {
      "remetente": { },
      "destinatario": [{ }],
      "nf": {
        "numero": "000083990",
        "serie": "1",
        "chave_nfe": "43160400850257000132550010000083991000083990",
        "data_emissao": "2024-01-01",
        "volumes": 1,
        "valor": 150.00,
        "peso": 2.5
      }
    }
  ]
}
```

| Campo            | Tipo   | Obrigatório | Descrição                                            |
|------------------|--------|-------------|------------------------------------------------------|
| lote             | string | Não         | Identificador do lote. Se informado, qualquer erro cancela o lote inteiro |
| dados            | array  | Sim         | Lista de objetos de nota fiscal                      |
| dados[].remetente| object | Sim         | Dados do remetente (CNPJ, nome, endereço)            |
| dados[].destinatario | array | Sim      | Dados do(s) destinatário(s)                         |
| dados[].nf       | object | Sim         | Dados da nota fiscal                                 |
| dados[].nf.chave_nfe | string | Não     | Chave de acesso NF-e                                |

**Resposta:**
```json
[
  {
    "sucesso": true,
    "mensagem": "NF processada com sucesso",
    "remetente": { },
    "destinatario": { },
    "notaFiscal": { },
    "pedido": { },
    "protocolo": "PROT-20240101-001"
  }
]
```

> **Atenção:** Se `lote` for informado e não vazio, um erro em qualquer NF do lote invalida **todas** as NFs do lote.

---

## Cotação de Frete

### `GET https://ssw.inf.br/2/cotacao`

Link direto para cotação de frete da transportadora.

| Parâmetro | Tipo   | Obrigatório | Descrição                       |
|-----------|--------|-------------|---------------------------------|
| sigla_emp | string | Sim         | Sigla da transportadora (ex: `FDJ`) |

**Exemplo:**
```
https://ssw.inf.br/2/cotacao?sigla_emp=FDJ
```

> Documentação técnica completa (parâmetros de cálculo, resposta JSON) ainda não mapeada — explorar diretamente com credenciais.

---

## Roadmap de Integração

### MVP (fase atual)
- [ ] Autenticação com token (geração + cache 6h)
- [ ] Rastreamento por DANFE (`/api/trackingdanfe`)
- [ ] Envio de NOTFIS (`/api/notfis`)

### Próximas fases
- [ ] Rastreamento por remetente (com autenticação)
- [ ] Rastreamento por destinatário
- [ ] Rastreamento por pagador
- [ ] Cotação de frete (parâmetros completos)
- [ ] **Criação de envios sem NF** — estrutura preparada para automatização futura
- [ ] CTe e manifestos
- [ ] Integração com equipamentos (sorter, cubadora, balança)
- [ ] Gestão de faturas

---

## Variáveis de Ambiente

Criar `.env.local` com:

```env
SSW_DOMAIN=
SSW_USERNAME=
SSW_PASSWORD=
SSW_CNPJ_EDI=
```
