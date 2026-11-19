/** Dimensões de apoio: período, geografia, universo e fonte. */
import { toPeriod, toText } from "../data/parse.js";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Linha da Dim_Periodo. `label` é o texto curto mostrado no painel. */
export class Period {
  constructor({ id, year, type, description }) {
    this.id = toText(id);
    this.year = toPeriod(year);
    this.type = toText(type);
    this.description = toText(description);
    this.label = monthLabel(this.id, this.type) ?? (this.year || this.id);
    Object.freeze(this);
  }
}

/** "PER-2025-12" do tipo Mês vira "dez/2025". */
function monthLabel(id, type) {
  const match = /(\d{4})-(\d{2})$/.exec(id);
  if (type.toLowerCase() !== "mês" || !match) return null;
  return `${MONTHS[Number(match[2]) - 1]}/${match[1]}`;
}

/** Período citado sem cadastro na Dim_Periodo: usa o próprio texto. */
export function unknownPeriod(id) {
  return new Period({ id, year: null, type: "", description: "" });
}

export class Geography {
  constructor({ id, name }) {
    this.id = toText(id);
    this.name = toText(name) || this.id;
    Object.freeze(this);
  }
}

export class Universe {
  constructor({ id, name, definition, limit }) {
    this.id = toText(id);
    this.name = toText(name) || this.id;
    this.definition = toText(definition);
    this.limit = toText(limit);
    Object.freeze(this);
  }
}

export class Source {
  constructor({ id, title, institution, locator, url, scope }) {
    this.id = toText(id);
    this.title = toText(title) || this.id;
    this.institution = toText(institution);
    this.locator = toText(locator);
    this.url = toText(url);
    this.scope = toText(scope);
    Object.freeze(this);
  }

  /** Só links http(s) viram <a>; evita "javascript:" vindo da planilha. */
  get safeUrl() {
    return /^https?:\/\//i.test(this.url) ? this.url : "";
  }
}
