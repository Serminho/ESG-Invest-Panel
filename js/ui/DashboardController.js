import { html, render } from "./html.js";
import { emptyState } from "./components.js";
import { pluralize } from "./format.js";
import { IndicatorFilter } from "../domain/IndicatorFilter.js";

const DEFAULT_VIEW = "overview";

/**
 * Liga o DOM ao estado: monta navegação e filtros, escuta eventos
 * e redesenha a página ativa. Não conhece a planilha, só o catálogo.
 */
export class DashboardController {
  #catalog = null;
  #views = new Map();

  /**
   * @param {object} deps
   * @param {ReturnType<typeof import("../main.js").queryDom>} deps.dom
   * @param {import("../state/Store.js").Store} deps.store
   * @param {(catalog: object) => Map<string, object>} deps.createViews
   * @param {{ field: string, allLabel: string, ariaLabel: string }[]} deps.filterFields
   * @param {(file: File) => void} deps.onFileSelected
   */
  constructor({ dom, store, createViews, filterFields, onFileSelected }) {
    this.dom = dom;
    this.store = store;
    this.createViews = createViews;
    this.filterFields = filterFields;
    this.onFileSelected = onFileSelected;
    this.#bindEvents();
    store.subscribe(() => this.#render());
  }

  /** Recebe um catálogo novo (primeira carga ou planilha trocada). */
  setCatalog(catalog) {
    this.#catalog = catalog;
    this.#views = this.createViews(catalog);
    this.#renderHeader();
    this.#renderNav();
    this.#renderFilterSelects();
    this.store.update(initialState(this.filterFields));
  }

  showMessage(message) {
    this.dom.page.innerHTML = render(emptyState(message));
  }

  showError(error) {
    console.error(error);
    this.dom.page.innerHTML = render(html`
      <div class="note"><strong>Não foi possível carregar a planilha.</strong> ${error.message}</div>
      <div class="callout"><span class="icon">↳</span><div>Use o botão "Abrir planilha…" acima para escolher o arquivo .xlsx manualmente.</div></div>`);
  }

  #bindEvents() {
    const { nav, filterSelects, search, clearFilters, fileInput } = this.dom;

    nav.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-view]");
      if (!button) return;
      this.store.update({ view: button.dataset.view });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    filterSelects.addEventListener("change", (event) => {
      const { field } = event.target.dataset;
      if (!field) return;
      this.store.update({ criteria: { ...this.store.state.criteria, [field]: event.target.value } });
    });

    search.addEventListener("input", (event) => this.store.update({ query: event.target.value }));

    clearFilters.addEventListener("click", () => {
      search.value = "";
      filterSelects.querySelectorAll("select").forEach((select) => { select.value = ""; });
      this.store.update({ query: "", criteria: initialState(this.filterFields).criteria });
    });

    fileInput.addEventListener("change", () => {
      const [file] = fileInput.files;
      if (file) this.onFileSelected(file);
      fileInput.value = "";
    });
  }

  #renderHeader() {
    const catalog = this.#catalog;
    this.dom.themeSummary.textContent = catalog.themes.map((theme) => theme.label).join(" | ");
    this.dom.headerStats.innerHTML = render(html`
      <span class="pill"><i class="status-dot"></i>Dados da planilha</span>
      <span class="pill">${pluralize(catalog.indicators.length, "indicador", "indicadores")}</span>
      <span class="pill">${pluralize(catalog.measuredCount, "com valor", "com valor")}</span>
      <span class="pill">${pluralize(catalog.internalCount, "interno proposto", "internos propostos")}</span>
      <span class="pill">${pluralize(catalog.sourceCount, "fonte", "fontes")}</span>`);
    this.dom.sourceName.textContent = catalog.sourceName;
  }

  #renderNav() {
    this.dom.nav.innerHTML = render(
      [...this.#views.values()].map((view) => html`<button type="button" data-view="${view.id}">${view.navLabel}</button>`),
    );
  }

  #renderFilterSelects() {
    this.dom.filterSelects.innerHTML = render(this.filterFields.map(({ field, allLabel, ariaLabel }) => html`
      <select class="filter-control" data-field="${field}" aria-label="${ariaLabel}">
        <option value="">${allLabel}</option>
        ${this.#catalog.distinctValues(field).map((value) => html`<option value="${value}">${value}</option>`)}
      </select>`));
    this.dom.search.value = "";
  }

  #render() {
    if (!this.#catalog) return;
    const { state } = this.store;
    const view = this.#views.get(state.view) ?? this.#views.get(DEFAULT_VIEW);
    const filter = new IndicatorFilter({ query: state.query, criteria: state.criteria });

    this.dom.page.innerHTML = render(view.render(this.#catalog, filter));
    this.dom.nav.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.view === view.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
  }
}

export function initialState(filterFields) {
  return {
    view: DEFAULT_VIEW,
    query: "",
    criteria: Object.fromEntries(filterFields.map(({ field }) => [field, ""])),
  };
}
