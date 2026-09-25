-- Arquivo de XMLs de CT-e recebidos pelo programa EDI SSW3189.
-- Rode no console do Neon: console.neon.tech -> SQL Editor

CREATE TABLE IF NOT EXISTS cte_xml (
  chave             TEXT        PRIMARY KEY,
  numero            INTEGER,
  serie             TEXT,
  cnpj_emitente     TEXT,
  cnpj_remetente    TEXT,
  cnpj_destinatario TEXT,
  cnpj_tomador      TEXT,
  data_emissao      TIMESTAMPTZ,
  valor_prestacao   NUMERIC(12,2),
  xml_base64        TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- O portal filtra por cliente: o embarcador pode ser remetente, destinatário ou tomador.
CREATE INDEX IF NOT EXISTS idx_cte_xml_remetente    ON cte_xml(cnpj_remetente);
CREATE INDEX IF NOT EXISTS idx_cte_xml_destinatario ON cte_xml(cnpj_destinatario);
CREATE INDEX IF NOT EXISTS idx_cte_xml_tomador      ON cte_xml(cnpj_tomador);
CREATE INDEX IF NOT EXISTS idx_cte_xml_data         ON cte_xml(data_emissao);
