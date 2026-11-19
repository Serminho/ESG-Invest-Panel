import { toText } from "../data/parse.js";

/** Tema ASG (linha da Dim_Tema) com as leituras analíticas do tema. */
export class Theme {
  constructor({ id, name, description, accent, readings = [] }) {
    this.id = toText(id);
    this.name = toText(name) || this.id;
    this.description = toText(description);
    this.accent = accent;
    this.readings = Object.freeze([...readings]);
    Object.freeze(this);
  }

  get label() {
    return `${this.id} · ${this.name}`;
  }
}
