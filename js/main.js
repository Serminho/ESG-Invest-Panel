/**
 * Ponto de entrada: monta as dependências e carrega a planilha.
 * Fluxo: XlsxWorkbookSource -> buildCatalog -> DashboardController.
 */
import { CONFIG } from "./config.js";
import { buildCatalog } from "./data/CatalogBuilder.js";
import { XlsxWorkbookSource } from "./infra/XlsxWorkbookSource.js";
import { Store } from "./state/Store.js";
import { DashboardController, initialState } from "./ui/DashboardController.js";
import { initThemeToggle } from "./ui/ThemeToggle.js";
import { initExpandAll, initShortcuts, initBackToTop } from "./ui/UiEnhancements.js";
import { createViews } from "./ui/views/index.js";

export function queryDom(root = document) {
  const get = (selector) => {
    const element = root.querySelector(selector);
    if (!element) throw new Error(`Elemento ${selector} não encontrado no index.html.`);
    return element;
  };
  return {
    nav: get("#nav"),
    page: get("#page"),
    filterSelects: get("#filterSelects"),
    filtersToggle: get("#filtersToggle"),
    filtersPanel: get("#filtersPanel"),
    filtersCount: get("#filtersCount"),
    search: get("#search"),
    clearFilters: get("#clearFilters"),
    fileInput: get("#fileInput"),
    themeSummary: get("#themeSummary"),
    headerStats: get("#headerStats"),
    sourceName: get("#sourceName"),
  };
}

function start() {
  initThemeToggle(document.querySelector("#themeToggle"));
  document
    .querySelector("#exportReport")
    ?.addEventListener("click", () => globalThis.print());

  initExpandAll(
    document.querySelector("#toggleAllDetails"),
    document.querySelector("#page"),
  );
  initShortcuts({
    searchInput: document.querySelector("#search"),
    themeButton: document.querySelector("#themeToggle"),
    exportButton: document.querySelector("#exportReport"),
  });
  initBackToTop(document.querySelector("#backToTop"));

  const controller = new DashboardController({
    dom: queryDom(),
    store: new Store(initialState(CONFIG.filters)),
    createViews: (catalog) => createViews(catalog, CONFIG),
    filterFields: CONFIG.filters,
    periodFilter: CONFIG.periodFilter,
    onFileSelected: (file) => load(() => getSource().fromFile(file), file.name),
  });

  let source = null;
  function getSource() {
    source ??= new XlsxWorkbookSource(globalThis.XLSX);
    return source;
  }

  async function load(readWorkbook, sourceName) {
    controller.showMessage(`Carregando ${sourceName}…`);
    try {
      const workbook = await readWorkbook();
      controller.setCatalog(buildCatalog(workbook, CONFIG, sourceName));
    } catch (error) {
      controller.showError(error);
    }
  }

  load(() => getSource().fromUrl(CONFIG.dataFile), CONFIG.dataFile);
}

start();