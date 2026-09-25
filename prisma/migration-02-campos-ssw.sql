-- Ajusta o schema para bater 100% com o payload real do SSW (programa EDI SSW2658).
-- Rode no console do Neon: console.neon.tech -> SQL Editor

ALTER TABLE faturas
  ADD COLUMN IF NOT EXISTS nosso_numero     TEXT,
  ADD COLUMN IF NOT EXISTS valor_credito    NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS valor_total_ctrc NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS valor_pago       NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS valor_juros      NUMERIC(12,2);

ALTER TABLE fatura_ctrc
  ADD COLUMN IF NOT EXISTS chave_cte      TEXT,
  ADD COLUMN IF NOT EXISTS tipo_documento TEXT;

ALTER TABLE fatura_nf
  ADD COLUMN IF NOT EXISTS pedido INTEGER;
