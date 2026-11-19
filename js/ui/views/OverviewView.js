import { html } from "../html.js";
import { callout, metricStrip, note, pageTitle, recordList, sectionHeading, themeCard } from "../components.js";

/** Visão geral: números do catálogo, destaques por tema e lista completa filtrada. */
export class OverviewView {
  id = "overview";
  navLabel = "Visão geral";

  constructor({ highlightsPerTheme }) {
    this.highlightsPerTheme = highlightsPerTheme;
  }

  render(catalog, filter) {
    const visible = catalog.search(filter);
    const cards = catalog.themes.map((theme) => {
      const visibleInTheme = visible.filter((indicator) => indicator.themeId === theme.id);
      return themeCard({
        theme,
        highlights: pickHighlights(visibleInTheme, this.highlightsPerTheme),
        visibleCount: visibleInTheme.length,
        totalCount: catalog.indicatorsOf(theme.id).length,
      });
    });
    const external = catalog.indicators.length - catalog.internalCount;

    return html`
      ${pageTitle({
        title: "Visão geral",
        subtitle: "Leitura executiva dos indicadores da planilha.",
        tag: `${visible.length} de ${catalog.indicators.length} indicadores no filtro`,
      })}
      ${note("Como ler:", "benchmarks externos contextualizam o Piauí e o setor; não medem a performance da Investe. Indicadores internos são propostas, ainda sem medição. Período e universo aparecem junto de cada valor.")}
      ${metricStrip([
        { label: "Indicadores na planilha", value: catalog.indicators.length, sub: `${external} externos · ${catalog.internalCount} internos` },
        { label: "Com valor publicado", value: catalog.measuredCount, sub: "observações da Fato_Indicador" },
        { label: "Temas", value: catalog.themes.length, sub: catalog.themes.map((theme) => theme.id).join(" · ") },
        { label: "Fontes", value: catalog.sourceCount, sub: "da Dim_Fonte usadas pelos indicadores" },
      ])}
      ${sectionHeading("Indicadores em destaque", "Benchmarks com valor; os períodos e universos variam por indicador.")}
      <div class="theme-grid">${cards}</div>
      ${callout("ⓘ", "Para mudar os números, edite a planilha e recarregue a página, ou use \"Abrir planilha…\" para carregar outra versão.")}
      ${sectionHeading("Todos os indicadores no filtro atual", "Em ordem de código. Abra uma linha para ver definição, universo e fonte.")}
      ${recordList(visible)}`;
  }
}

/** Indicadores com valor primeiro, mantendo a ordem de código. */
export function pickHighlights(indicators, count) {
  const measured = indicators.filter((indicator) => indicator.hasMeasuredValue);
  const pending = indicators.filter((indicator) => !indicator.hasMeasuredValue);
  return [...measured, ...pending].slice(0, count);
}
