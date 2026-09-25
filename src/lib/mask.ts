export function onlyDigitsKey(e: React.KeyboardEvent) {
  if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
  }
}

export function digits(v: string) {
  return v.replace(/\D/g, "")
}

export function maskCNPJ(v: string) {
  const d = digits(v).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

export function maskCPF(v: string) {
  const d = digits(v).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
}

export function maskCEP(v: string) {
  const d = digits(v).slice(0, 8)
  return d.replace(/^(\d{5})(\d)/, "$1-$2")
}

export function maskPhone(v: string) {
  const d = digits(v).slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

export function validarCPF(v: string): boolean {
  const d = digits(v)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const calc = (len: number) => {
    const sum = d.slice(0, len).split("").reduce((acc, n, i) => acc + Number(n) * (len + 1 - i), 0)
    const r = (sum * 10) % 11
    return r >= 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

export function maskDate(v: string) {
  const d = digits(v).slice(0, 8)
  return d
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
}
