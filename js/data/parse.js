/** Conversões dos valores crus das células para tipos do domínio. */

const NUMERIC_TEXT = /^-?\d+(\.\d+)?$/;

/** Texto limpo ou "" para células vazias. */
export function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Número ou null. Aceita números e textos como "2025.0" ou "12,5". */
export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = toText(value).replace(",", ".");
  return NUMERIC_TEXT.test(text) ? Number(text) : null;
}

/** Período como texto: 2025 e "2025.0" viram "2025"; "dez/2025" fica igual. */
export function toPeriod(value) {
  const number = toNumber(value);
  if (number !== null && Number.isInteger(number)) return String(number);
  return toText(value);
}

/**
 * Anos cobertos por um período: "2025" -> { from: 2025, to: 2025 },
 * "2023–2024" -> { from: 2023, to: 2024 }. Sem ano reconhecível, null.
 */
export function toYearRange(value) {
  const years = (toText(value).match(/\b(1[89]|2\d)\d{2}\b/g) ?? []).map(Number);
  if (!years.length) return null;
  return { from: Math.min(...years), to: Math.max(...years) };
}
