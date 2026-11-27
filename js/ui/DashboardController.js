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
   * @param {{ field: string, label?: string, allLabel: string, ariaLabel: string, options?: { value: string, label: string }[], onlyWithGri?: boolean }[]} deps.filterFields
   * @param {(file: File) => void} deps.onFileSelected
   * @param {{ windowYears: number }} [deps.periodFilter] janela do filtro De / Até
   * @param {number} [deps.currentYear] ano de referência da janela (padrão: ano atual)
   */
  constructor({ dom, store, createViews, filterFields, onFileSelected, periodFilter = { windowYears: 10 }, currentYear = new Date().getFullYear() }) {
    this.dom = dom;
    this.store = store;
    this.createViews = createViews;
    this.filterFields = filterFields;
    this.onFileSelected = onFileSelected;
    this.periodYears = periodYears(currentYear, periodFilter.windowYears);
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
    this.store.update({ ...initialState(this.filterFields), view: this.#viewFromHash() });
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
    const { nav, filterSelects, search, clearFilters, fileInput, filtersToggle, filtersPanel } = this.dom;

    // Painel "Filtros": abre e fecha os seletores, que ficam fora da tela quando não estão em uso.
    filtersToggle.addEventListener("click", () => this.#setFiltersOpen(filtersPanel.hidden));
    filtersPanel.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      this.#setFiltersOpen(false);
      filtersToggle.focus();
    });

    // A página ativa fica no endereço (#T8, #catalog…): dá para compartilhar o link e usar o botão Voltar.
    nav.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-view]");
      if (!button) return;
      window.location.hash = button.dataset.view;
      this.store.update({ view: button.dataset.view });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("hashchange", () => {
      const view = this.#viewFromHash();
      if (view !== this.store.state.view) this.store.update({ view });
    });

    filterSelects.addEventListener("change", (event) => {
      if (event.target.dataset.period) {
        this.#updatePeriod(event.target.dataset.period);
        return;
      }
      const { field } = event.target.dataset;
      if (!field) return;
      this.store.update({ criteria: { ...this.store.state.criteria, [field]: event.target.value } });
    });

    search.addEventListener("input", (event) => this.store.update({ query: event.target.value }));

    clearFilters.addEventListener("click", () => {
      search.value = "";
      filterSelects.querySelectorAll("select").forEach((select) => { select.value = ""; });
      const { criteria, yearFrom, yearTo } = initialState(this.filterFields);
      this.store.update({ query: "", criteria, yearFrom, yearTo });
    });

    fileInput.addEventListener("change", () => {
      const [file] = fileInput.files;
      if (file) this.onFileSelected(file);
      fileInput.value = "";
    });
  }

  /**
   * Lê De / Até. Se o ano escolhido passar do outro limite, o outro limite acompanha
   * (ex.: Até 2020 e a pessoa escolhe De 2023 -> Até vira 2023), respeitando a última escolha.
   */
  #updatePeriod(changed) {
    const from = this.dom.filterSelects.querySelector('[data-period="from"]');
    const to = this.dom.filterSelects.querySelector('[data-period="to"]');
    if (from.value && to.value && Number(from.value) > Number(to.value)) {
      if (changed === "from") to.value = from.value;
      else from.value = to.value;
    }
    this.store.update({ yearFrom: from.value, yearTo: to.value });
  }

  #setFiltersOpen(open) {
    this.dom.filtersPanel.hidden = !open;
    this.dom.filtersToggle.setAttribute("aria-expanded", String(open));
    this.dom.filtersToggle.classList.toggle("open", open);
  }

  /** Quantos filtros do painel estão ativos (o período conta como um). */
  #renderActiveCount() {
    const { criteria, yearFrom, yearTo } = this.store.state;
    const count = Object.values(criteria).filter(Boolean).length + (yearFrom || yearTo ? 1 : 0);
    const { filtersCount, filtersToggle } = this.dom;
    filtersCount.hidden = count === 0;
    filtersCount.textContent = String(count);
    filtersToggle.setAttribute("aria-label", count ? `Filtros (${count} ativo${count > 1 ? "s" : ""})` : "Filtros");
  }

  #viewFromHash() {
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      // Endereço malformado (ex.: "#%E0"): cai na página padrão.
    }
    return this.#views.has(id) ? id : DEFAULT_VIEW;
  }

  #renderHeader() {
    const catalog = this.#catalog;
    this.dom.themeSummary.textContent = catalog.themes.map((theme) => theme.label).join(" | ");
    this.dom.headerStats.innerHTML = render(html`
      <span class="pill"><i class="status-dot"></i>Dados da planilha</span>
      <span class="pill">${pluralize(catalog.indicators.length, "indicador", "indicadores")}</span>
      <span class="pill">${pluralize(catalog.measuredCount, "com valor", "com valor")}</span>
      <span class="pill">${pluralize(catalog.internalCount, "interno proposto", "internos propostos")}</span>
      ${catalog.hasGri && html`<span class="pill">${catalog.griLinkedCount} com vínculo GRI</span>`}
      <span class="pill">${pluralize(catalog.sourceCount, "fonte", "fontes")}</span>`);
    this.dom.sourceName.textContent = catalog.sourceName;
  }

  #renderNav() {
    this.dom.nav.innerHTML = render(
      [...this.#views.values()].map((view) => html`<button type="button" data-view="${view.id}">${view.navLabel}</button>`),
    );
  }

  /**
   * Painel de filtros: período (De / Até, últimos anos) e um select por filtro,
   * cada um com rótulo. Filtros sem nenhum valor na planilha não aparecem.
   */
  #renderFilterSelects() {
    const fields = this.filterFields
      .filter((spec) => !spec.onlyWithGri || this.#catalog.hasGri)
      .map((spec) => ({ ...spec, options: filterOptions(spec, this.#catalog.distinctValues(spec.field)) }))
      .filter(({ options }) => options.length > 0);
    const years = this.periodYears;
    this.dom.filterSelects.innerHTML = render(html`
      <div class="filter-field" role="group" aria-labelledby="filter-label-period"
        title="Mostra indicadores com algum ano no intervalo. Os internos propostos, ainda sem período, saem quando há limite.">
        <span class="filter-label" id="filter-label-period">Período</span>
        <span class="period-filter">
          <select class="filter-control" data-period="from" aria-label="Período: ano inicial">
            <option value="">De: qualquer ano</option>
            ${years.map((year) => html`<option value="${year}">De ${year}</option>`)}
          </select>
          <select class="filter-control" data-period="to" aria-label="Período: ano final">
            <option value="">Até: qualquer ano</option>
            ${[...years].reverse().map((year) => html`<option value="${year}">Até ${year}</option>`)}
          </select>
        </span>
      </div>
      ${fields.map(({ field, label, allLabel, ariaLabel, options }) => html`
      <label class="filter-field">
        <span class="filter-label">${label ?? ariaLabel}</span>
        <select class="filter-control" data-field="${field}" aria-label="${ariaLabel}">
          <option value="">${allLabel}</option>
          ${options.map((option) => html`<option value="${option.value}">${option.label}</option>`)}
        </select>
      </label>`)}`);
    this.dom.search.value = "";
  }

  #render() {
    if (!this.#catalog) return;
    const { state } = this.store;
    const view = this.#views.get(state.view) ?? this.#views.get(DEFAULT_VIEW);
    const filter = new IndicatorFilter({
      query: state.query, criteria: state.criteria, yearFrom: state.yearFrom, yearTo: state.yearTo,
    });

    this.dom.page.innerHTML = render(view.render(this.#catalog, filter));
    this.#renderActiveCount();
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
    yearFrom: "",
    yearTo: "",
  };
}

/**
 * Opções de um filtro: a lista fixa de `spec.options` (só as que têm indicador)
 * ou, sem ela, os valores da planilha.
 */
export function filterOptions(spec, values) {
  if (!spec.options) return values.map((value) => ({ value, label: value }));
  return spec.options.filter((option) => values.includes(option.value));
}

/** Anos da janela do filtro de período, do mais antigo ao atual (ex.: 2017…2026). */
export function periodYears(currentYear, windowYears) {
  return Array.from({ length: windowYears }, (_, index) => currentYear - windowYears + 1 + index);
}
