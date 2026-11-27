import { test } from "node:test";
import assert from "node:assert/strict";
import { html, render } from "../js/ui/html.js";
import { formatIndicatorValue, formatValue } from "../js/ui/format.js";
import { toNumber, toPeriod } from "../js/data/parse.js";
import { Period } from "../js/domain/references.js";
import { pickHighlights } from "../js/ui/views/OverviewView.js";

test("html escapa interpolações e não escapa fragmentos aninhados", () => {
  const inner = html`<b>${"<x>"}</b>`;
  assert.equal(render(html`<p title="${'"a"'}">${inner}${["&", null, false]}</p>`),
    '<p title="&quot;a&quot;"><b>&lt;x&gt;</b>&amp;</p>');
});

test("formatValue respeita a unidade", () => {
  assert.equal(formatValue(12.5, "%"), "12,5%");
  assert.equal(formatValue(2510.4, "R$/mês"), "R$ 2.510,4/mês");
  assert.equal(formatValue(1, "Sim/Não"), "Sim");
  assert.equal(formatValue(382684, "vínculos"), "382.684 vínculos");
  assert.equal(formatValue(null, "%"), "Sem dado");
});

test("indicador interno sem valor aparece como Proposto", () => {
  assert.equal(formatIndicatorValue({ latestMeasurement: null, isInternal: true }), "Proposto");
  assert.equal(formatIndicatorValue({ latestMeasurement: null, isInternal: false }), "Sem dado");
});

test("rótulo de período", () => {
  assert.equal(new Period({ id: "PER-2025-12", year: 2025, type: "Mês" }).label, "dez/2025");
  assert.equal(new Period({ id: "PER-2023-2024", year: "2023–2024", type: "Intervalo" }).label, "2023–2024");
  assert.equal(new Period({ id: "PER-2017", year: "2017.0", type: "Ano" }).year, "2017");
});

test("parse aceita números como texto", () => {
  assert.equal(toNumber("2025.0"), 2025);
  assert.equal(toNumber("12,5"), 12.5);
  assert.equal(toNumber("abc"), null);
  assert.equal(toPeriod("2025.0"), "2025");
});

test("destaques: com valor primeiro, na ordem de código", () => {
  const item = (id, hasMeasuredValue) => ({ id, hasMeasuredValue });
  const result = pickHighlights([item("a", false), item("b", true), item("c", false), item("d", true)], 3);
  assert.deepEqual(result.map((i) => i.id), ["b", "d", "a"]);
});

test("página Conexão GRI: cobertura, índice e lacunas respeitam o filtro", async () => {
  const { CONFIG } = await import("../js/config.js");
  const { buildCatalog } = await import("../js/data/CatalogBuilder.js");
  const { IndicatorFilter } = await import("../js/domain/IndicatorFilter.js");
  const { GriView } = await import("../js/ui/views/GriView.js");
  const { createViews } = await import("../js/ui/views/index.js");
  const { fakeWorkbook, indicatorRow } = await import("./fakeWorkbook.js");

  const workbook = fakeWorkbook({
    Dim_Indicador: [indicatorRow(), indicatorRow({ "ID_Indicador": "T8-02", "Indicador": "Sem GRI <b>" })],
    Dim_GRI: [{ "Codigo_GRI": "203-2", "Norma": "GRI 203", "Grupo": "Econômico", "Divulgação": "Impactos <indiretos>" }],
    Ponte_Indicador_GRI: [{ "ID_Indicador": "T8-01", "Codigo_GRI": "203-2", "Tipo_Vinculo": "Contexto" }],
  });
  const catalog = buildCatalog(workbook, CONFIG);
  assert.ok(createViews(catalog, CONFIG).has("gri"));

  const page = render(new GriView().render(catalog, new IndicatorFilter()));
  assert.match(page, /1 de 2 indicadores com vínculo/);
  assert.match(page, /Impactos &lt;indiretos&gt;/, "texto da planilha é escapado");
  assert.match(page, /gri-chip gri-contexto[^>]*>T8-01</);
  assert.match(page, /Indicadores sem correspondência GRI/);
  assert.match(page, /Sem GRI &lt;b&gt;/);

  const filtered = render(new GriView().render(catalog, new IndicatorFilter({ query: "T8-02" })));
  assert.doesNotMatch(filtered, /Índice de divulgações/);

  const noGri = buildCatalog(fakeWorkbook({ Dim_Indicador: [indicatorRow()] }), CONFIG);
  assert.equal(createViews(noGri, CONFIG).has("gri"), false, "sem Dim_GRI a página não aparece");
});
