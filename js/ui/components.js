/**
 * Componentes de apresentação: funções puras que recebem dados e
 * devolvem marcação. Mantêm as classes CSS do style.css original.
 */
import { html } from "./html.js";
import { formatIndicatorValue, formatValue, valueContext } from "./format.js";

export const emptyState = (message) => html`<div class="empty">${message}</div>`;

export const pageTitle = ({ title, subtitle, tag }) => html`
  <div class="page-title">
    <div><h2>${title}</h2><p>${subtitle}</p></div>
    <span class="tag">${tag}</span>
  </div>`;

export const note = (label, text) => html`<div class="note"><strong>${label}</strong> ${text}</div>`;

export const callout = (icon, text) => html`<div class="callout"><span class="icon">${icon}</span><div>${text}</div></div>`;

export const sectionHeading = (title, hint) => html`<div class="section-heading"><h3>${title}</h3><span>${hint}</span></div>`;

export const countLine = (label, value) => html`<div class="count-line"><span>${label}</span><strong>${value}</strong></div>`;

/** @param {{ label: string, value: string|number, sub: string }[]} metrics */
export const metricStrip = (metrics) => html`
  <div class="metric-strip">${metrics.map((metric) => html`
    <article class="metric">
      <div class="label">${metric.label}</div>
      <div class="value">${metric.value}</div>
      <div class="sub">${metric.sub}</div>
    </article>`)}
  </div>`;

export const miniMetric = (indicator) => html`
  <div class="mini-metric">
    <strong>${formatIndicatorValue(indicator)}</strong>
    <span>${indicator.name}<small class="small-source">${indicator.id} · ${valueContext(indicator)}</small></span>
  </div>`;

const statCard = (indicator) => html`
  <div class="stat-card">
    <div class="big">${formatIndicatorValue(indicator)}</div>
    <div class="stat-label">${indicator.id} · ${indicator.name}</div>
    <div class="stat-meta">${valueContext(indicator)}</div>
  </div>`;

const barItem = (indicator) => {
  const width = Math.max(1, Math.min(100, indicator.latestMeasurement.value));
  const text = formatIndicatorValue(indicator);
  return html`
    <div class="bar-item">
      <span class="bar-label">${indicator.id} · ${indicator.name.replace(/ — .*$/, "")}</span>
      <div class="bar-track" role="img" aria-label="${text}"><div class="bar-fill" style="width:${width}%"></div></div>
      <span class="bar-value">${text}</span>
    </div>`;
};

const pendingText = (indicator) => `${indicator.id} · ${indicator.name} (${valueContext(indicator)})`;

/**
 * Gráfico só com indicadores que têm valor: barras para %, cartões para o resto.
 * Os sem valor viram uma linha só, em vez de vários cartões vazios.
 */
export function sectionCard({ title, description, indicators, pendingLabel = "Sem valor registrado:" }) {
  const measured = indicators.filter((indicator) => indicator.hasMeasuredValue);
  const percent = measured.filter((indicator) => indicator.latestMeasurement.unit === "%" || indicator.unit === "%");
  const others = measured.filter((indicator) => !percent.includes(indicator));
  const pending = indicators.filter((indicator) => !indicator.hasMeasuredValue);

  return html`
    <article class="section-card">
      <h3>${title}</h3>
      <p class="section-desc">${description}</p>
      ${percent.length > 0 && html`<div class="bar-list">${percent.map(barItem)}</div>`}
      ${others.length > 0 && html`<div class="section-cards">${others.map(statCard)}</div>`}
      ${pending.length > 0 && html`<p class="chart-foot"><strong>${pendingLabel}</strong> ${pending.map(pendingText).join("; ")}.</p>`}
    </article>`;
}

export const themeCard = ({ theme, highlights, visibleCount, totalCount }) => html`
  <article class="theme-card" style="--accent:${theme.accent}">
    <h3>${theme.label}</h3>
    <p class="theme-sub">${theme.description}</p>
    ${highlights.length ? highlights.map(miniMetric) : emptyState("Nenhum destaque para o filtro atual.")}
    ${countLine("Indicadores visíveis", `${visibleCount} / ${totalCount}`)}
  </article>`;

const detail = (label, content) => html`
  <div><div class="detail-label">${label}</div><div class="detail-text">${content || "—"}</div></div>`;

const join = (...parts) => parts.filter(Boolean).join(" · ");

function sourceDetail(indicator) {
  const { source } = indicator;
  if (!source) return "";
  const locator = indicator.latestMeasurement?.locator || source.locator;
  const title = source.safeUrl
    ? html`<a class="source-link" href="${source.safeUrl}" target="_blank" rel="noopener">${source.title}</a>`
    : source.title;
  return html`${join(source.institution, locator)}${(source.institution || locator) && " · "}${title}`;
}

const measurementLine = (indicator, m) =>
  join(m.period.label, formatValue(m.value, m.unit || indicator.unit), m.geography, m.kind, m.method, m.note);

const recordItem = (indicator) => html`
  <details class="record">
    <summary>
      <span class="record-name">${indicator.id} · ${indicator.name}</span>
      <span class="record-value">${formatIndicatorValue(indicator)}</span>
      <span class="record-period">${valueContext(indicator)}</span>
      <span class="record-toggle">＋</span>
    </summary>
    <div class="record-body">
      ${detail("Propósito gerencial", indicator.purpose)}
      ${detail("Método / definição", indicator.definition)}
      ${detail("Universo e denominador", join(indicator.universe?.name, indicator.universe?.definition, indicator.universe?.limit))}
      ${detail("Limite de interpretação", indicator.limit)}
      ${detail("Classificação", join(indicator.origin, indicator.status, indicator.pillar && `Pilar ${indicator.pillar}`, indicator.periodicity))}
      ${detail("Fonte e localizador", sourceDetail(indicator))}
      ${indicator.measurements.length > 0 && detail("Observações", indicator.measurements.map((m) => measurementLine(indicator, m)).join(" | "))}
    </div>
  </details>`;

export function recordList(indicators, { withCount = true } = {}) {
  if (!indicators.length) return emptyState("Nenhum resultado encontrado. Ajuste a busca ou os filtros.");
  return html`
    ${withCount && countLine("Indicadores encontrados", indicators.length)}
    <div class="record-list">${indicators.map(recordItem)}</div>`;
}
