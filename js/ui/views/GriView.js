import { html } from "../html.js";
import { callout, emptyState, griLegend, griTypePill, metricStrip, note, pageTitle, recordList, sectionHeading } from "../components.js";
import { groupBy } from "../../domain/IndicatorCatalog.js";
import { LINK_TYPES } from "../../domain/Gri.js";

const UNLINKED = Object.freeze({ key: "sem", label: "Sem vínculo" });

/**
 * Conexão GRI: cobertura dos indicadores por tema e índice das divulgações GRI,
 * cada uma com os indicadores ligados. Respeita a busca e os filtros.
 */
export class GriView {
  id = "gri";
  navLabel = "Conexão GRI";

  render(catalog, filter) {
    const visible = catalog.search(filter);
    const linked = visible.filter((indicator) => indicator.griLinks.length > 0);
    const unlinked = visible.filter((indicator) => indicator.griLinks.length === 0);
    const byDisclosure = indicatorsByDisclosure(linked);
    // Com o filtro "norma GRI" ativo, o índice mostra só as divulgações dessa norma.
    const standard = filter.criteria.griStandards;
    const disclosures = catalog.griDisclosures.filter((disclosure) => byDisclosure.has(disclosure.id)
      && (!standard || (disclosure.standard || disclosure.label) === standard));
    const meets = linked.filter((indicator) => indicator.griLinks[0].type === LINK_TYPES[0]).length;

    return html`
      ${pageTitle({
        title: "Conexão GRI",
        subtitle: "Como cada indicador do painel se relaciona com as Normas GRI de relato de sustentabilidade (Dim_GRI e Ponte_Indicador_GRI da planilha).",
        tag: `${linked.length} de ${visible.length} indicadores com vínculo`,
      })}
      ${note("Como ler:", "um indicador pode se ligar a mais de uma divulgação. Vínculos de Contexto vêm de benchmarks públicos e servem para situar o tema; não são resultado da Investe e não devem entrar no relato como desempenho próprio.")}
      ${griLegend(LINK_TYPES)}
      ${metricStrip([
        { label: "Indicadores com vínculo", value: linked.length, sub: `${percent(linked.length, visible.length)} dos ${visible.length} no filtro` },
        { label: "Divulgações GRI cobertas", value: disclosures.length, sub: `de ${catalog.griDisclosures.length} cadastradas na Dim_GRI` },
        { label: "Atendem a divulgação", value: meets, sub: "mesma métrica da GRI" },
        { label: "Sem correspondência", value: unlinked.length, sub: "candidatos a relato via GRI 3-3" },
      ])}
      ${visible.length ? coverage(catalog.themes, visible) : emptyState("Nenhum indicador corresponde aos filtros atuais.")}
      ${disclosures.length > 0 && html`
        ${sectionHeading("Índice de divulgações", "Na ordem da Dim_GRI. Passe o mouse num código para ver a divulgação; abra as justificativas para ver o porquê de cada vínculo.")}
        ${[...groupBy(disclosures, (disclosure) => disclosure.group)].map(([group, items]) => groupCard(group, items, byDisclosure))}`}
      ${unlinked.length > 0 && html`
        ${sectionHeading("Indicadores sem correspondência GRI", `${unlinked.length} no filtro atual`)}
        ${callout("ⓘ", "Não há divulgação temática GRI para estes assuntos (ex.: adoção de tecnologias digitais, automação, prazos internos). Se o tema for material para a Investe, relate a gestão dele pela GRI 3-3 e use o indicador como métrica própria.")}
        ${recordList(unlinked, { withCount: false })}`}`;
  }
}

/** Mapa código GRI -> [{ indicator, link }] preservando a ordem de código dos indicadores. */
function indicatorsByDisclosure(indicators) {
  const map = new Map();
  for (const indicator of indicators) {
    for (const link of indicator.griLinks) {
      if (!map.has(link.disclosure.id)) map.set(link.disclosure.id, []);
      map.get(link.disclosure.id).push({ indicator, link });
    }
  }
  return map;
}

/** Barra empilhada por tema, classificando cada indicador pelo vínculo mais forte. */
function coverage(themes, indicators) {
  const rows = themes
    .map((theme) => ({ theme, items: indicators.filter((indicator) => indicator.themeId === theme.id) }))
    .filter(({ items }) => items.length > 0);
  const categories = [...LINK_TYPES, UNLINKED];

  return html`
    <article class="section-card">
      <h3>Cobertura por tema</h3>
      <p class="section-desc">Cada indicador conta uma vez, pelo vínculo mais forte que tem. A porcentagem é a parcela do tema com algum vínculo.</p>
      <div class="gri-legend">${categories.map((category) => html`<span><i class="gri-swatch gri-${category.key}"></i>${category.label}</span>`)}</div>
      <div class="gri-coverage">${rows.map(({ theme, items }) => {
        const counts = categories.map((category) => ({
          category,
          count: items.filter((indicator) => (indicator.griLinks[0]?.type ?? UNLINKED) === category).length,
        }));
        const summary = counts.filter(({ count }) => count).map(({ category, count }) => `${category.label}: ${count}`).join(", ");
        return html`
          <div class="gri-coverage-row">
            <span class="bar-label">${theme.label}</span>
            <div class="gri-stack" role="img" aria-label="${theme.label} — ${summary}">${counts.filter(({ count }) => count).map(({ category, count }) => html`
              <span class="gri-${category.key}" style="flex-grow:${count}" title="${category.label}: ${count}">${count}</span>`)}
            </div>
            <span class="bar-value">${percent(items.length - counts.at(-1).count, items.length)}</span>
          </div>`;
      })}
      </div>
    </article>`;
}

function groupCard(group, disclosures, byDisclosure) {
  return html`
    <article class="section-card">
      <h3>${group}</h3>
      <p class="section-desc">${disclosures.length === 1 ? "1 divulgação" : `${disclosures.length} divulgações`} com indicadores no filtro atual.</p>
      <div class="gri-index">${disclosures.map((disclosure) => disclosureRow(disclosure, byDisclosure.get(disclosure.id)))}</div>
    </article>`;
}

function disclosureRow(disclosure, entries) {
  const code = disclosure.safeUrl
    ? html`<a href="${disclosure.safeUrl}" target="_blank" rel="noopener">${disclosure.label}</a>`
    : disclosure.label;
  return html`
    <div class="gri-row">
      <div class="gri-code">${code}</div>
      <div class="gri-main">
        <strong>${disclosure.title || "Divulgação não cadastrada na Dim_GRI"}</strong>
        <small>${[disclosure.standard, disclosure.status].filter(Boolean).join(" · ")}</small>
        <div class="gri-chips">${entries.map(({ indicator, link }) => html`
          <span class="gri-chip gri-${link.type.key}" title="${indicator.name} — ${link.type.label}">${indicator.id}</span>`)}
        </div>
        <details class="gri-notes">
          <summary>Justificativas (${entries.length})</summary>
          <ul>${entries.map(({ indicator, link }) => html`
            <li>${griTypePill(link.type)}
              <span><strong>${indicator.id} · ${indicator.name}</strong>${link.note && html`<small>${link.note}</small>`}</span></li>`)}
          </ul>
        </details>
      </div>
    </div>`;
}

function percent(part, total) {
  return total ? `${Math.round((part / total) * 100)}%` : "0%";
}
