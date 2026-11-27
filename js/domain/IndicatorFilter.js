/**
 * Critérios de filtro imutáveis. Cada método `with*` devolve um novo filtro.
 * `criteria` liga um campo do Indicator ao valor exigido ("" = qualquer valor).
 */
export class IndicatorFilter {
  constructor({ query = "", criteria = {}, themeId = "" } = {}) {
    this.query = query.trim().toLocaleLowerCase("pt-BR");
    this.criteria = Object.freeze({ ...criteria });
    this.themeId = themeId;
    Object.freeze(this);
  }

  withTheme(themeId) {
    return new IndicatorFilter({ query: this.query, criteria: this.criteria, themeId });
  }

  matches(indicator) {
    if (this.themeId && indicator.themeId !== this.themeId) return false;
    const criteriaOk = Object.entries(this.criteria).every(([field, value]) => !value || hasValue(indicator[field], value));
    return criteriaOk && (!this.query || indicator.searchText.includes(this.query));
  }
}

/** Campos simples comparam igualdade; campos com lista (ex.: normas GRI) exigem o valor na lista. */
function hasValue(actual, expected) {
  return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
}
