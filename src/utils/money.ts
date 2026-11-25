// Valores monetários são guardados em CENTAVOS (número inteiro) para evitar
// erros de arredondamento de ponto flutuante (ex.: 0.1 + 0.2 !== 0.3).

/** Formata centavos no padrão brasileiro: 123456 -> "R$ 1.234,56". */
export function formatMoney(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = (abs % 100).toString().padStart(2, '0');
  return `${negative ? '-' : ''}R$ ${reais},${centavos}`;
}

/** Converte centavos para o texto usado em campos de edição: 123456 -> "1234,56". */
export function centsToInput(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = (cents % 100).toString().padStart(2, '0');
  return `${reais},${centavos}`;
}

// Formatos aceitos:
//   1.234,56   (milhar com ponto, decimal com vírgula)
//   1234,56    (decimal com vírgula)
//   1234.56    (decimal com ponto, como em alguns teclados)
//   1234       (inteiro)
const BR_WITH_THOUSANDS = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/;
const BR_PLAIN = /^\d+(,\d{1,2})?$/;
const DOT_DECIMAL = /^\d+\.\d{1,2}$/;

/**
 * Converte o texto digitado pelo usuário em centavos.
 * Retorna `null` quando o formato é inválido.
 */
export function parseMoney(input: string): number | null {
  const text = input.trim().replace(/^R\$/i, '').replace(/\s/g, '');
  if (text === '') return null;

  let integerPart: string;
  let decimalPart: string;

  if (BR_WITH_THOUSANDS.test(text) || BR_PLAIN.test(text)) {
    [integerPart, decimalPart = ''] = text.replace(/\./g, '').split(',');
  } else if (DOT_DECIMAL.test(text)) {
    [integerPart, decimalPart] = text.split('.');
  } else {
    return null;
  }

  return Number(integerPart) * 100 + Number(decimalPart.padEnd(2, '0'));
}
