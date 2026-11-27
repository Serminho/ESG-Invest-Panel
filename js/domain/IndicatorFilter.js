/**
 * Critérios de filtro imutáveis. Cada método `with*` devolve um novo filtro.
 * `criteria` liga um campo do Indicator ao valor exigido ("" = qualquer valor).
 * `yearFrom`/`yearTo` limitam o período (anos inteiros; null = sem limite).
 */
export class IndicatorFilter {
  constructor({ query = "", criteria = {}, themeId = "", yearFrom = null, yearTo = null } = {}) {
    this.query = query.trim().toLocaleLowerCase("pt-BR");
    this.criteria = Object.freeze({ ...criteria });
    this.themeId = themeId;
    [this.yearFrom, this.yearTo] = orderedYears(toYear(yearFrom), toYear(yearTo));
    Object.freeze(this);
  }

  withTheme(themeId) {
    return new IndicatorFilter({ ...this, themeId });
  }

  get hasPeriod() {
    return this.yearFrom !== null || this.yearTo !== null;
  }

  matches(indicator) {
    if (this.themeId && indicator.themeId !== this.themeId) return false;
    if (this.hasPeriod && !this.#overlapsPeriod(indicator.yearRange)) return false;
    const criteriaOk = Object.entries(this.criteria).every(([field, value]) => !value || hasValue(indicator[field], value));
    return criteriaOk && (!this.query || indicator.searchText.includes(this.query));
  }

  /** Passa quem tem algum ano dentro do intervalo; sem período, fica de fora. */
  #overlapsPeriod(range) {
    if (!range) return false;
    return (this.yearFrom === null || range.to >= this.yearFrom) && (this.yearTo === null || range.from <= this.yearTo);
  }
}

/** Campos simples comparam igualdade; campos com lista (ex.: conexão GRI) exigem o valor na lista. */
function hasValue(actual, expected) {
  return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
}

function toYear(value) {
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) ? year : null;
}

/** "De 2024 até 2020" vira 2020–2024, em vez de um intervalo vazio. */
function orderedYears(from, to) {
  return from !== null && to !== null && from > to ? [to, from] : [from, to];
}
