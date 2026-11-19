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
    const criteriaOk = Object.entries(this.criteria).every(([field, value]) => !value || indicator[field] === value);
    return criteriaOk && (!this.query || indicator.searchText.includes(this.query));
  }
}
