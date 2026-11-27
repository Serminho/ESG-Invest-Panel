import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../js/config.js";
import { buildCatalog } from "../js/data/CatalogBuilder.js";
import { DataSourceError } from "../js/data/DataSourceError.js";
import { IndicatorFilter } from "../js/domain/IndicatorFilter.js";
import { factRow, fakeWorkbook, indicatorRow, internalRow } from "./fakeWorkbook.js";

const sheets = () => ({
  Dim_Indicador: [
    internalRow({ "ID_Indicador": "T9-21", "ID_Tema": "T9", "Indicador": "Taxa de Projetos de Inovação Verde" }),
    indicatorRow({ "ID_Indicador": "T8-10" }),
    indicatorRow(),
    indicatorRow({ "ID_Indicador": "T12-01", "ID_Tema": "T12", "Indicador": "Plano de adequação à LGPD", "Unidade": "%", "ID_Universo": "POP-CETIC", "Período de referência": "PER-2025", "ID_Fonte": "SRC-07" }),
    indicatorRow({ "ID_Indicador": null }),
  ],
  Fato_Indicador: [
    factRow(),
    factRow({ "ID_Observacao": "OBS-002", "ID_Indicador": "T12-01", "ID_Periodo": "PER-2025", "ID_Geografia": "GEO-BR", "Valor": 25, "Unidade": "%" }),
  ],
  Dim_Tema: [
    { "ID_Tema": "T8", "Tema_ASG": "Empregos verdes", "Descrição do recorte neste arquivo": "Emprego formal." },
    { "ID_Tema": "T9", "Tema_ASG": "Inovação", "Descrição do recorte neste arquivo": "Inovação e sustentabilidade." },
    { "ID_Tema": "T12", "Tema_ASG": "Privacidade", "Descrição do recorte neste arquivo": "LGPD." },
  ],
  Dim_Periodo: [
    { "ID_Periodo": "PER-2025", "Ano/intervalo": 2025, "Tipo": "Ano", "Descrição": "" },
    { "ID_Periodo": "PER-2025-12", "Ano/intervalo": 2025, "Tipo": "Mês", "Descrição": "" },
  ],
  Dim_Geografia: [{ "ID_Geografia": "GEO-PI", "Nome": "Piauí" }, { "ID_Geografia": "GEO-BR", "Nome": "Brasil" }],
  Dim_Universo: [{ "ID_Universo": "POP-CAGED", "Nome do universo": "Novo Caged", "Definição/abrangência": "Formais.", "Limite de interpretação": "Recorte estadual." }],
  Dim_Fonte: [
    { "ID_Fonte": "SRC-01", "Documento / conjunto": "Relatório Caged", "Instituição": "SEPLAN-PI", "Localizador consultado": "Tabela 3", "URL pública": "https://example.org/caged", "Escopo e cautela": "" },
    { "ID_Fonte": "SRC-07", "Documento / conjunto": "TIC Empresas", "Instituição": "Cetic", "Localizador consultado": "", "URL pública": "javascript:alert(1)", "Escopo e cautela": "" },
  ],
  Leitura_Analitica: [
    { "Tema": "T8", "Leitura dos dados públicos": "Caged em alta.", "Aplicação e cautela": "Não é emprego verde." },
    { "Tema": "MVP", "Leitura dos dados públicos": "Geral.", "Aplicação e cautela": "—" },
  ],
});

const ids = (items) => items.map((item) => item.id);

test("ordena por código (T8 < T9 < T12, T8-01 < T8-10) e ignora linhas sem código", () => {
  const catalog = buildCatalog(fakeWorkbook(sheets()), CONFIG);
  assert.deepEqual(ids(catalog.indicators), ["T8-01", "T8-10", "T9-21", "T12-01"]);
  assert.deepEqual(ids(catalog.themes), ["T8", "T9", "T12"]);
});

test("liga observação, período, geografia, universo e fonte", () => {
  const catalog = buildCatalog(fakeWorkbook(sheets()), CONFIG);
  const [jobs] = catalog.indicators;
  const m = jobs.latestMeasurement;
  assert.deepEqual([m.value, m.period.label, m.period.year, m.geography], [382684, "dez/2025", "2025", "Piauí"]);
  assert.equal(jobs.universe.name, "Novo Caged");
  assert.equal(jobs.source.safeUrl, "https://example.org/caged");
  assert.equal(catalog.indicators[3].source.safeUrl, "", "URL que não é http(s) não vira link");
  assert.equal(jobs.year, "2025");
});

test("indicador interno: sem valor, com pilar e periodicidade", () => {
  const catalog = buildCatalog(fakeWorkbook(sheets()), CONFIG);
  const internal = catalog.indicators.find((i) => i.id === "T9-21");
  assert.equal(internal.isInternal, true);
  assert.equal(internal.hasMeasuredValue, false);
  assert.deepEqual([internal.pillar, internal.periodicity, internal.year], ["Ambiental", "Mensal", ""]);
  assert.deepEqual([catalog.internalCount, catalog.measuredCount, catalog.sourceCount], [1, 2, 2]);
});

test("leituras analíticas ficam no tema certo", () => {
  const catalog = buildCatalog(fakeWorkbook(sheets()), CONFIG);
  assert.equal(catalog.theme("T8").readings[0].reading, "Caged em alta.");
  assert.equal(catalog.theme("T9").readings.length, 0);
});

test("encontra o cabeçalho abaixo de linhas de título", () => {
  const workbook = fakeWorkbook(sheets(), { titleRows: { Fato_Indicador: [["FATO DE VALORES PÚBLICOS"], ["descrição"], []] } });
  assert.equal(buildCatalog(workbook, CONFIG).measuredCount, 2);
});

test("colunas Pilar ASG e Periodicidade são opcionais", () => {
  const data = sheets();
  data.Dim_Indicador = [indicatorRow()];
  assert.equal(buildCatalog(fakeWorkbook(data), CONFIG).indicators[0].pillar, "");
});

test("erro claro quando falta coluna obrigatória ou a aba de indicadores", () => {
  const data = sheets();
  data.Dim_Indicador = [{ "ID_Indicador": "T8-01", "ID_Tema": "T8" }];
  assert.throws(() => buildCatalog(fakeWorkbook(data), CONFIG), (error) =>
    error instanceof DataSourceError && /não tem as colunas: Indicador, Atuação/.test(error.message));
  assert.throws(() => buildCatalog(fakeWorkbook({}), CONFIG), /Aba obrigatória "Dim_Indicador"/);
});

test("escopo limita os temas", () => {
  const catalog = buildCatalog(fakeWorkbook(sheets()), { ...CONFIG, themesInScope: ["T12"] });
  assert.deepEqual(ids(catalog.indicators), ["T12-01"]);
});

test("filtro combina busca, período, atuação e tema", () => {
  const catalog = buildCatalog(fakeWorkbook(sheets()), CONFIG);
  const search = (options) => ids(catalog.search(new IndicatorFilter(options)));
  assert.deepEqual(search({ query: " lgpd " }), ["T12-01"]);
  assert.deepEqual(search({ criteria: { year: "2025" } }), ["T8-01", "T8-10", "T12-01"]);
  assert.deepEqual(search({ criteria: { origin: "Interno — indicador fictício proposto" } }), ["T9-21"]);
  assert.deepEqual(ids(catalog.search(new IndicatorFilter().withTheme("T8"))), ["T8-01", "T8-10"]);
  assert.deepEqual(catalog.distinctValues("year"), ["2025"]);
});

const griSheets = () => ({
  ...sheets(),
  Dim_GRI: [
    { "Codigo_GRI": "404-1", "Norma": "GRI 404: Capacitação e Educação 2016", "Grupo": "Social", "Divulgação": "Média de horas de capacitação", "Vigência": "Em vigor.", "URL pública": "https://example.org/gri-404" },
    { "Codigo_GRI": "203-2", "Norma": "GRI 203: Impactos Econômicos Indiretos 2016", "Grupo": "Econômico", "Divulgação": "Impactos econômicos indiretos significativos", "Vigência": "", "URL pública": "javascript:alert(1)" },
    { "Codigo_GRI": "418-1", "Norma": "GRI 418: Privacidade do Cliente 2016", "Grupo": "Social", "Divulgação": "Queixas comprovadas", "Vigência": "", "URL pública": "" },
  ],
  Ponte_Indicador_GRI: [
    { "ID_Indicador": "T8-01", "Codigo_GRI": "203-2", "Tipo_Vinculo": "Contexto", "Justificativa": "Mercado formal." },
    { "ID_Indicador": "T9-21", "Codigo_GRI": "203-2", "Tipo_Vinculo": "apoia", "Justificativa": "" },
    { "ID_Indicador": "T9-21", "Codigo_GRI": "404-1", "Tipo_Vinculo": "Atende", "Justificativa": "Mesma métrica." },
    { "ID_Indicador": "T9-21", "Codigo_GRI": "404-1", "Tipo_Vinculo": "Atende", "Justificativa": "Linha repetida." },
    { "ID_Indicador": "T12-01", "Codigo_GRI": "999-9", "Tipo_Vinculo": "Parcial", "Justificativa": "Código sem cadastro." },
    { "ID_Indicador": "T8-10", "Codigo_GRI": null, "Tipo_Vinculo": "Atende", "Justificativa": "Sem código: ignorada." },
    { "ID_Indicador": "X-99", "Codigo_GRI": "418-1", "Tipo_Vinculo": "Atende", "Justificativa": "Indicador inexistente." },
  ],
});

test("GRI: liga indicadores às divulgações, do vínculo mais forte ao mais fraco", () => {
  const catalog = buildCatalog(fakeWorkbook(griSheets()), CONFIG);
  const byId = (id) => catalog.indicators.find((i) => i.id === id);
  const innovation = byId("T9-21");
  assert.deepEqual(innovation.griLinks.map((l) => [l.disclosure.id, l.type.key]), [["404-1", "atende"], ["203-2", "apoia"]]);
  assert.equal(innovation.griLinks[0].note, "Mesma métrica.", "linha repetida não duplica o vínculo");
  assert.equal(byId("T8-01").griLinks[0].type.label, "Contexto");
  assert.deepEqual(byId("T8-10").griLinks, [], "linha sem código é ignorada");
  assert.equal(catalog.griLinkedCount, 3);
});

test("GRI: código sem cadastro aparece só com o código; divulgação sem indicador fica de fora", () => {
  const catalog = buildCatalog(fakeWorkbook(griSheets()), CONFIG);
  const [link] = catalog.indicators.find((i) => i.id === "T12-01").griLinks;
  assert.deepEqual([link.disclosure.label, link.disclosure.title, link.type.key, link.type.label], ["GRI 999-9", "", "outro", "Parcial"]);
  assert.deepEqual(ids(catalog.griDisclosures), ["404-1", "203-2", "999-9"], "418-1 só tinha indicador inexistente");
  assert.equal(catalog.griDisclosures[0].safeUrl, "https://example.org/gri-404");
  assert.equal(catalog.griDisclosures[1].safeUrl, "", "URL que não é http(s) não vira link");
});

test("GRI: filtro por norma, busca por código e planilha sem as abas", () => {
  const catalog = buildCatalog(fakeWorkbook(griSheets()), CONFIG);
  const search = (options) => ids(catalog.search(new IndicatorFilter(options)));
  assert.deepEqual(search({ criteria: { griStandards: "GRI 203: Impactos Econômicos Indiretos 2016" } }), ["T8-01", "T9-21"]);
  assert.deepEqual(search({ query: "404-1" }), ["T9-21"]);
  assert.deepEqual(catalog.distinctValues("griStandards"),
    ["GRI 203: Impactos Econômicos Indiretos 2016", "GRI 404: Capacitação e Educação 2016", "GRI 999-9"]);

  const plain = buildCatalog(fakeWorkbook(sheets()), CONFIG);
  assert.equal(plain.hasGri, false);
  assert.deepEqual(plain.distinctValues("griStandards"), []);
  assert.deepEqual(plain.indicators[0].griLinks, []);
});

test("período De / Até: sobreposição de anos, intervalos e indicadores sem período", async () => {
  const { toYearRange } = await import("../js/data/parse.js");
  assert.deepEqual(toYearRange("2025"), { from: 2025, to: 2025 });
  assert.deepEqual(toYearRange("2023–2024"), { from: 2023, to: 2024 });
  assert.equal(toYearRange(""), null);

  const data = sheets();
  data.Dim_Indicador.push(indicatorRow({ "ID_Indicador": "T9-01", "ID_Tema": "T9", "Período de referência": "PER-2017" }));
  data.Dim_Indicador.push(indicatorRow({ "ID_Indicador": "T8-16", "Período de referência": "PER-2023-2024" }));
  data.Dim_Periodo.push({ "ID_Periodo": "PER-2017", "Ano/intervalo": 2017, "Tipo": "Ano", "Descrição": "" });
  data.Dim_Periodo.push({ "ID_Periodo": "PER-2023-2024", "Ano/intervalo": "2023–2024", "Tipo": "Intervalo", "Descrição": "" });
  const catalog = buildCatalog(fakeWorkbook(data), CONFIG);
  const search = (options) => ids(catalog.search(new IndicatorFilter(options)));

  assert.deepEqual(search({}), ["T8-01", "T8-10", "T8-16", "T9-01", "T9-21", "T12-01"], "sem limite, todos aparecem");
  assert.deepEqual(search({ yearFrom: "2024" }), ["T8-01", "T8-10", "T8-16", "T12-01"], "intervalo 2023–2024 toca 2024");
  assert.deepEqual(search({ yearTo: "2023" }), ["T8-16", "T9-01"]);
  assert.deepEqual(search({ yearFrom: "2018", yearTo: "2022" }), [], "nenhum ano no intervalo");
  assert.deepEqual(search({ yearFrom: "2025", yearTo: "2017" }), search({ yearFrom: "2017", yearTo: "2025" }), "De maior que Até é invertido");
  assert.ok(!search({ yearFrom: "2017" }).includes("T9-21"), "interno sem período sai quando há limite");
  assert.deepEqual(ids(catalog.search(new IndicatorFilter({ yearFrom: 2025 }).withTheme("T12"))), ["T12-01"], "withTheme mantém o período");
});
