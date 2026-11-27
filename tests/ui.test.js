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

test("Conexão GRI vira filtro: não há mais página GRI na navegação", async () => {
  const { CONFIG } = await import("../js/config.js");
  const { buildCatalog } = await import("../js/data/CatalogBuilder.js");
  const { createViews } = await import("../js/ui/views/index.js");
  const { fakeWorkbook, indicatorRow } = await import("./fakeWorkbook.js");

  const catalog = buildCatalog(fakeWorkbook({
    Dim_Indicador: [indicatorRow()],
    Dim_GRI: [{ "Codigo_GRI": "203-2", "Norma": "GRI 203", "Grupo": "Econômico", "Divulgação": "Impactos" }],
    Ponte_Indicador_GRI: [{ "ID_Indicador": "T8-01", "Codigo_GRI": "203-2", "Tipo_Vinculo": "Contexto" }],
  }), CONFIG);
  assert.equal(createViews(catalog, CONFIG).has("gri"), false);
  assert.ok(CONFIG.filters.some((spec) => spec.field === "griConnection"));
  assert.ok(!CONFIG.filters.some((spec) => spec.field === "griStandards"), "filtro de normas GRI removido");
});

test("janela do filtro de período: últimos 10 anos até o ano atual", async () => {
  const { periodYears } = await import("../js/ui/DashboardController.js");
  assert.deepEqual(periodYears(2026, 10), [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
});
