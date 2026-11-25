// Datas são guardadas no banco no formato ISO "AAAA-MM-DD", que pode ser
// comparado e ordenado como texto. Na tela usamos o formato "dd/mm/aaaa".

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Mês selecionado no app (month vai de 1 a 12). */
export interface YearMonth {
  year: number;
  month: number;
}

const pad = (n: number) => n.toString().padStart(2, '0');

/** Converte um Date (no fuso local) para "AAAA-MM-DD". */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

/** "2026-11-25" -> "25/11/2026" */
export function isoToBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Testa se o texto está no formato dd/mm/aaaa (sem verificar se a data existe). */
export function hasBRDateFormat(text: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(text);
}

/**
 * "25/11/2026" -> "2026-11-25".
 * Retorna `null` se o formato for inválido ou se a data não existir (ex.: 31/02).
 */
export function brToISO(text: string): string | null {
  if (!hasBRDateFormat(text)) return null;
  const [d, m, y] = text.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  // Se o dia/mês "transbordar" (31/02 vira 03/03), a data não existe.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Aplica a máscara dd/mm/aaaa enquanto o usuário digita. */
export function maskDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/** Intervalo [início, fim) do mês em ISO, para usar em consultas SQL. */
export function monthRange(ym: YearMonth): { start: string; end: string } {
  const next = addMonths(ym, 1);
  return {
    start: `${ym.year}-${pad(ym.month)}-01`,
    end: `${next.year}-${pad(next.month)}-01`,
  };
}

export function monthLabel({ year, month }: YearMonth): string {
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

/** Título amigável para agrupar lançamentos por dia: "Hoje", "Ontem" ou "Terça, 18 de novembro". */
export function dayLabel(iso: string): string {
  if (iso === todayISO()) return 'Hoje';
  if (iso === yesterdayISO()) return 'Ontem';
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()];
  return `${weekday}, ${d} de ${MONTH_NAMES[m - 1].toLowerCase()}`;
}
