import { compareIds } from "./Indicator.js";

/** Repositório em memória dos indicadores e temas carregados da planilha. */
export class IndicatorCatalog {
  /**
   * @param {{ indicators: import("./Indicator.js").Indicator[], themes: import("./Theme.js").Theme[], sourceName: string }} data
   */
  constructor({ indicators, themes, sourceName }) {
    // Ordem pelo código (T8-01 ... T12-30), independente da ordem das linhas.
    this.indicators = Object.freeze([...indicators].sort(compareIds));
    this.themes = Object.freeze([...themes]);
    this.sourceName = sourceName;
    this.byThemeId = groupBy(this.indicators, (indicator) => indicator.themeId);
    Object.freeze(this);
  }

  search(filter) {
    return this.indicators.filter((indicator) => filter.matches(indicator));
  }

  indicatorsOf(themeId) {
    return this.byThemeId.get(themeId) ?? [];
  }

  theme(themeId) {
    return this.themes.find((theme) => theme.id === themeId) ?? null;
  }

  /** Valores distintos de um campo, ordenados, para montar os filtros. */
  distinctValues(field) {
    const values = new Set(this.indicators.map((indicator) => indicator[field]).filter(Boolean));
    return [...values].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  }

  get measuredCount() {
    return this.indicators.filter((indicator) => indicator.hasMeasuredValue).length;
  }

  get internalCount() {
    return this.indicators.filter((indicator) => indicator.isInternal).length;
  }

  get sourceCount() {
    return new Set(this.indicators.map((indicator) => indicator.source?.id).filter(Boolean)).size;
  }
}

/** Agrupa preservando a ordem de chegada. */
export function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}
