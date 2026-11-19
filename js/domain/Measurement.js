import { toNumber, toText } from "../data/parse.js";

/** Observação de um indicador (linha da Fato_Indicador), já ligada a período e geografia. */
export class Measurement {
  /**
   * @param {object} record campos lidos da planilha
   * @param {{ period: import("./references.js").Period, geography: string }} links
   */
  constructor({ id, indicatorId, value, unit, kind, locator, method, note }, { period, geography }) {
    this.id = toText(id);
    this.indicatorId = toText(indicatorId);
    this.period = period;
    this.geography = geography;
    this.value = toNumber(value);
    this.unit = toText(unit);
    this.kind = toText(kind);
    this.locator = toText(locator);
    this.method = toText(method);
    this.note = toText(note);
    Object.freeze(this);
  }

  get hasValue() {
    return this.value !== null;
  }
}
