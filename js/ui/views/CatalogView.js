import { html } from "../html.js";
import { callout, pageTitle, recordList } from "../components.js";

/** Lista completa e detalhada, para conferência. */
export class CatalogView {
  id = "catalog";
  navLabel = "Catálogo completo";

  render(catalog, filter) {
    const visible = catalog.search(filter);
    return html`
      ${pageTitle({
        title: "Catálogo completo",
        subtitle: "Definições e medições em formato detalhado para conferência e para a etapa do Power BI.",
        tag: `${visible.length} de ${catalog.indicators.length} indicadores`,
      })}
      ${callout("↳", "Use os filtros e a busca acima. Cada linha mantém o vínculo entre valor, universo, período, geografia e fonte.")}
      ${recordList(visible)}`;
  }
}
