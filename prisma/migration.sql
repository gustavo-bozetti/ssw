-- Cole este SQL no painel do Neon: console.neon.tech → SQL Editor

CREATE TYPE fatura_status AS ENUM ('EMITIDA', 'LIQUIDADA', 'CANCELADA');

CREATE TABLE faturas (
  id                  TEXT        PRIMARY KEY,
  numero_fatura       INTEGER     NOT NULL,
  cnpj_transportadora TEXT        NOT NULL,
  nome_transportadora TEXT,
  cnpj_devedor        TEXT,
  nome_devedor        TEXT,
  banco               TEXT,
  agencia             TEXT,
  conta               TEXT,
  carteira            TEXT,
  data_emissao        TIMESTAMPTZ,
  data_vencimento     TIMESTAMPTZ,
  data_liquidacao     TIMESTAMPTZ,
  data_cancelamento   TIMESTAMPTZ,
  data_credito        TIMESTAMPTZ,
  valor_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_acrescimo     NUMERIC(12,2),
  valor_desconto      NUMERIC(12,2),
  url_impressao       TEXT,
  status              fatura_status NOT NULL DEFAULT 'EMITIDA',
  protocolo           TEXT,
  unidade_cobranca    TEXT,
  tipo_cobranca       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fatura_ctrc (
  id          TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fatura_id   TEXT    NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
  serie       TEXT,
  numero      INTEGER,
  cte_numero  TEXT,
  cte_serie   TEXT,
  valor_frete NUMERIC(12,2)
);

CREATE TABLE fatura_nf (
  id        TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fatura_id TEXT    NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
  serie     TEXT,
  numero    INTEGER,
  chave_nfe TEXT
);

CREATE INDEX idx_faturas_cnpj_devedor   ON faturas(cnpj_devedor);
CREATE INDEX idx_faturas_status         ON faturas(status);
CREATE INDEX idx_faturas_data_vencimento ON faturas(data_vencimento);
