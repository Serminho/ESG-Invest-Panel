/** Formatação de valores para exibição (pt-BR). */

const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatNumber(value) {
  return numberFormat.format(value);
}

/** Valor com unidade: "12,5%", "R$ 1.234/mês", "Sim", "382.684 vínculos". */
export function formatValue(value, unit = "") {
  if (value === null || value === undefined) return "Sem dado";
  const normalizedUnit = unit.trim();
  if (normalizedUnit === "%") return `${formatNumber(value)}%`;
  if (normalizedUnit.startsWith("R$")) return `R$ ${formatNumber(value)}${normalizedUnit.slice(2)}`;
  if (normalizedUnit.toLowerCase() === "sim/não") return value ? "Sim" : "Não";
  return normalizedUnit ? `${formatNumber(value)} ${normalizedUnit}` : formatNumber(value);
}

/** Valor mais recente do indicador; internos sem medição aparecem como "Proposto". */
export function formatIndicatorValue(indicator) {
  const measurement = indicator.latestMeasurement;
  if (measurement) return formatValue(measurement.value, measurement.unit || indicator.unit);
  return indicator.isInternal ? "Proposto" : "Sem dado";
}

/** Contexto do valor: "dez/2025 · Piauí", ou a periodicidade de um indicador proposto. */
export function valueContext(indicator) {
  const measurement = indicator.latestMeasurement;
  if (measurement) return [measurement.period.label, measurement.geography].filter(Boolean).join(" · ");
  return [indicator.periodicity, indicator.unit].filter(Boolean).join(" · ");
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
