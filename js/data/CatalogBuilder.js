import { readRecords } from "./RecordReader.js";
import { DataSourceError } from "./DataSourceError.js";
import { toText } from "./parse.js";
import { groupBy, IndicatorCatalog } from "../domain/IndicatorCatalog.js";
import { compareLinks, GriDisclosure, GriLink, unknownDisclosure } from "../domain/Gri.js";
import { Indicator } from "../domain/Indicator.js";
import { Measurement } from "../domain/Measurement.js";
import { Geography, Period, Source, Universe, unknownPeriod } from "../domain/references.js";
import { Theme } from "../domain/Theme.js";

/**
 * Monta o catálogo a partir da planilha, seguindo a aba Relacionamentos:
 * Dim_Tema -> Dim_Indicador (ID_Tema), Dim_Indicador -> Fato_Indicador (ID_Indicador),
 * Fato_Indicador -> Dim_Periodo / Dim_Geografia, Dim_Indicador -> Dim_Universo / Dim_Fonte,
 * Dim_Indicador -> Ponte_Indicador_GRI <- Dim_GRI.
 *
 * @param {{ hasSheet(name: string): boolean, matrix(name: string): unknown[][] }} workbook
 * @param {typeof import("../config.js").CONFIG} config
 * @param {string} sourceName nome exibido no rodapé
 */
export function buildCatalog(workbook, config, sourceName = config.dataFile) {
  const { sheets } = config;
  const scope = config.themesInScope ? new Set(config.themesInScope) : null;
  const read = (spec, Type) => readRecords(workbook, spec).map((record) => new Type(record));

  const indicatorRecords = readRecords(workbook, sheets.indicators)
    .filter((record) => !scope || scope.has(toText(record.themeId)));
  if (!indicatorRecords.length) {
    throw new DataSourceError(`Nenhum indicador encontrado em "${sheets.indicators.name}" para os temas configurados.`);
  }

  const periods = indexById(read(sheets.periods, Period));
  const geographies = indexById(read(sheets.geographies, Geography));
  const universes = indexById(read(sheets.universes, Universe));
  const sources = indexById(read(sheets.sources, Source));
  const periodOf = (id) => periods.get(toText(id)) ?? unknownPeriod(toText(id));

  const measurementsById = groupBy(
    readRecords(workbook, sheets.measurements).map((record) => new Measurement(record, {
      period: periodOf(record.periodId),
      geography: geographies.get(toText(record.geographyId))?.name ?? toText(record.geographyId),
    })),
    (measurement) => measurement.indicatorId,
  );

  const themes = buildThemes(workbook, indicatorRecords, config);
  const themeById = indexById(themes);
  const { disclosures, linksByIndicator } = buildGri(workbook, sheets);

  const indicators = indicatorRecords.map((record) => new Indicator(record, {
    theme: themeById.get(toText(record.themeId)),
    universe: universes.get(toText(record.universeId)) ?? null,
    source: sources.get(toText(record.sourceId)) ?? null,
    referencePeriod: toText(record.referencePeriodId) ? periodOf(record.referencePeriodId) : null,
    measurements: measurementsById.get(toText(record.id)) ?? [],
    isInternal: toText(record.origin).startsWith(config.internalOriginPrefix),
    griLinks: linksByIndicator.get(toText(record.id)) ?? [],
  }));

  // Só entram no catálogo as divulgações com ao menos um indicador no escopo.
  const usedCodes = new Set(indicators.flatMap((indicator) => indicator.griLinks.map((link) => link.disclosure.id)));
  const griDisclosures = disclosures.filter((disclosure) => usedCodes.has(disclosure.id));

  return new IndicatorCatalog({ indicators, themes, griDisclosures, sourceName });
}

/**
 * Lê Dim_GRI e Ponte_Indicador_GRI. Códigos da ponte sem cadastro viram
 * divulgações só com o código, no fim da lista; linhas sem código são ignoradas.
 */
function buildGri(workbook, sheets) {
  const registered = readRecords(workbook, sheets.gri).map((record) => new GriDisclosure(record));
  const byCode = indexById(registered);
  const order = new Map(registered.map((disclosure, index) => [disclosure.id, index]));

  const links = readRecords(workbook, sheets.griLinks)
    .filter((record) => toText(record.code))
    .map((record) => {
      const code = toText(record.code);
      if (!byCode.has(code)) byCode.set(code, unknownDisclosure(code));
      return { indicatorId: toText(record.id), link: new GriLink(record, byCode.get(code)) };
    });

  const linksByIndicator = new Map();
  for (const [indicatorId, group] of groupBy(links, (item) => item.indicatorId)) {
    // Vínculo repetido (mesmo indicador e código): vale a primeira linha.
    const unique = group.map(({ link }) => link)
      .filter((link, index, all) => all.findIndex((other) => other.disclosure.id === link.disclosure.id) === index);
    linksByIndicator.set(indicatorId, unique.sort(compareLinks(order)));
  }
  return { disclosures: [...byCode.values()], linksByIndicator };
}

/** Um Theme por código usado nos indicadores, na ordem da Dim_Tema, com suas leituras. */
function buildThemes(workbook, indicatorRecords, config) {
  const { sheets } = config;
  const themeRecords = readRecords(workbook, sheets.themes);
  const readingsByTheme = groupBy(readRecords(workbook, sheets.readings), (reading) => toText(reading.id));
  const recordById = new Map(themeRecords.map((record) => [toText(record.id), record]));
  const order = themeRecords.map((record) => toText(record.id));

  const usedIds = [...new Set(indicatorRecords.map((record) => toText(record.themeId)))];
  usedIds.sort((a, b) => rank(order, a) - rank(order, b) || a.localeCompare(b, "pt-BR", { numeric: true }));

  return usedIds.map((id, index) => new Theme({
    ...(recordById.get(id) ?? { id }),
    accent: config.themeAccents[id] ?? config.fallbackAccents[index % config.fallbackAccents.length],
    readings: (readingsByTheme.get(id) ?? []).map((r) => ({ reading: toText(r.reading), caution: toText(r.caution) })),
  }));
}

function indexById(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function rank(order, id) {
  const position = order.indexOf(id);
  return position === -1 ? Number.MAX_SAFE_INTEGER : position;
}
