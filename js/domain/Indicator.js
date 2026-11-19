import { toText } from "../data/parse.js";

/**
 * Indicador (linha da Dim_Indicador) já ligado a tema, universo, fonte e observações.
 * Pode ser externo (benchmark público com valor) ou interno (proposto, sem valor).
 */
export class Indicator {
  /**
   * @param {object} record campos lidos da planilha
   * @param {object} links
   * @param {import("./Theme.js").Theme} links.theme
   * @param {import("./references.js").Universe | null} links.universe
   * @param {import("./references.js").Source | null} links.source
   * @param {import("./references.js").Period | null} links.referencePeriod
   * @param {import("./Measurement.js").Measurement[]} links.measurements
   * @param {boolean} links.isInternal
   */
  constructor(record, { theme, universe = null, source = null, referencePeriod = null, measurements = [], isInternal = false }) {
    this.id = toText(record.id);
    this.themeId = toText(record.themeId);
    this.name = toText(record.name);
    this.origin = toText(record.origin);
    this.purpose = toText(record.purpose);
    this.definition = toText(record.definition);
    this.unit = toText(record.unit);
    this.status = toText(record.status);
    this.limit = toText(record.limit);
    this.pillar = toText(record.pillar);
    this.periodicity = toText(record.periodicity);
    this.theme = theme;
    this.universe = universe;
    this.source = source;
    this.referencePeriod = referencePeriod;
    this.isInternal = isInternal;
    this.measurements = Object.freeze(
      [...measurements].sort((a, b) => a.period.id.localeCompare(b.period.id, "pt-BR", { numeric: true })),
    );
    this.searchText = [
      this.id, this.name, theme.label, this.origin, this.purpose, this.definition, this.unit, this.status,
      this.limit, this.pillar, this.periodicity, universe?.name, source?.title, source?.institution,
      ...this.measurements.map((m) => `${m.period.label} ${m.geography}`),
    ].join(" ").toLocaleLowerCase("pt-BR");
    Object.freeze(this);
  }

  /** Observação mais recente com valor, ou null. */
  get latestMeasurement() {
    return this.measurements.findLast((m) => m.hasValue) ?? null;
  }

  get hasMeasuredValue() {
    return this.latestMeasurement !== null;
  }

  /** Ano da observação mais recente (usado no filtro de período). */
  get year() {
    return this.latestMeasurement?.period.year ?? this.referencePeriod?.year ?? "";
  }
}

/** Ordena códigos como T8-02 < T8-10 < T9-01 < T12-01. */
export function compareIds(a, b) {
  return a.id.localeCompare(b.id, "pt-BR", { numeric: true });
}
