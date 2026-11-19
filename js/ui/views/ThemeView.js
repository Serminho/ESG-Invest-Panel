import { html } from "../html.js";
import { emptyState, metricStrip, note, pageTitle, recordList, sectionCard, sectionHeading } from "../components.js";
import { groupBy } from "../../domain/IndicatorCatalog.js";

/** Página de um tema; uma instância por tema da planilha. */
export class ThemeView {
  constructor(theme) {
    this.theme = theme;
    this.id = theme.id;
    this.navLabel = theme.label;
  }

  render(catalog, filter) {
    const { theme } = this;
    const all = catalog.indicatorsOf(theme.id);
    const visible = catalog.search(filter.withTheme(theme.id));
    const internal = visible.filter((indicator) => indicator.isInternal);

    return html`
      ${pageTitle({ title: theme.label, subtitle: theme.description, tag: `${all.length} indicadores na planilha` })}
      ${theme.readings.map(({ reading, caution }) => note("Leitura:", `${reading} Cautela: ${caution}`))}
      ${metricStrip([
        { label: "Indicadores no filtro", value: visible.length, sub: `de ${all.length} no tema` },
        { label: "Com valor publicado", value: visible.filter((i) => i.hasMeasuredValue).length, sub: "benchmarks externos" },
        { label: "Internos propostos", value: internal.length, sub: "ainda sem medição" },
        { label: "Períodos cobertos", value: new Set(visible.map((i) => i.year).filter(Boolean)).size, sub: "anos ou recortes" },
      ])}
      ${visible.length ? sections(visible) : emptyState("Nenhum indicador deste tema corresponde aos filtros atuais.")}
      ${sectionHeading("Catálogo do tema", "Em ordem de código. Abra uma linha para ver definição, universo e fonte.")}
      ${recordList(visible)}`;
  }
}

/** Externos agrupados por universo de pesquisa; internos agrupados por pilar ASG. */
function sections(indicators) {
  const groups = groupBy(indicators, (indicator) =>
    indicator.isInternal ? `internal:${indicator.pillar}` : `universe:${indicator.universe?.id ?? ""}`);

  return [...groups.values()].map((group) => {
    const [first] = group;
    if (first.isInternal) {
      return sectionCard({
        title: `Indicadores internos propostos${first.pillar ? ` · Pilar ${first.pillar}` : ""}`,
        description: "Propostas para a Investe Piauí; ainda sem valores coletados.",
        indicators: group,
        pendingLabel: "Propostos:",
      });
    }
    return sectionCard({
      title: first.universe?.name ?? "Universo não informado",
      description: [first.universe?.definition, first.universe?.limit].filter(Boolean).join(" "),
      indicators: group,
    });
  });
}
