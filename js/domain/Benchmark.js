import { toPeriod, toText } from "../data/parse.js";

/** Referência externa (linha da aba Benchmark_T08) ligada a um ou mais indicadores. */
export class Benchmark {
  constructor({ id, type, indicatorIds, description, value, unit, scope, year, source, note }) {
    this.id = toText(id);
    this.type = toText(type);
    this.indicatorIds = Object.freeze(splitIds(indicatorIds));
    this.description = toText(description);
    this.value = value;
    this.unit = toText(unit);
    this.scope = toText(scope);
    this.year = toPeriod(year);
    this.source = toText(source);
    this.note = toText(note);
    Object.freeze(this);
  }
}

/** "IND39, IND45" -> ["IND39", "IND45"]. */
export function splitIds(text) {
  return toText(text).split(/[,;]/).map((id) => id.trim()).filter(Boolean);
}
