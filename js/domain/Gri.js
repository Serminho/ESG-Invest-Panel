/** Normas GRI: divulgações (Dim_GRI) e vínculos com indicadores (Ponte_Indicador_GRI). */
import { toText } from "../data/parse.js";

/**
 * Tipos de vínculo, do mais forte ao mais fraco. A ordem define a ordenação
 * e a contagem de cobertura; `key` é usado em classes CSS.
 */
export const LINK_TYPES = Object.freeze([
  Object.freeze({ key: "atende", label: "Atende", description: "Mesma métrica da divulgação; confira as desagregações exigidas." }),
  Object.freeze({ key: "apoia", label: "Apoia", description: "Contribui para a divulgação, mas não a cumpre sozinho." }),
  Object.freeze({ key: "contexto", label: "Contexto", description: "Benchmark externo sobre o tema; não é desempenho da Investe." }),
]);

const OTHER_TYPE = Object.freeze({ key: "outro", label: "", description: "" });

/** Linha da Dim_GRI: uma divulgação (ex.: 404-1) ou tópico setorial (ex.: 13.22). */
export class GriDisclosure {
  constructor({ id, standard, group, title, status, url }) {
    this.id = toText(id);
    this.standard = toText(standard);
    this.group = toText(group) || "Sem grupo";
    this.title = toText(title);
    this.status = toText(status);
    this.url = toText(url);
    Object.freeze(this);
  }

  /** "GRI 404-1"; tópicos setoriais já trazem o número da norma (13.22). */
  get label() {
    return `GRI ${this.id}`;
  }

  /** Só links http(s) viram <a>; evita "javascript:" vindo da planilha. */
  get safeUrl() {
    return /^https?:\/\//i.test(this.url) ? this.url : "";
  }
}

/** Código citado na ponte sem cadastro na Dim_GRI: aparece só com o código. */
export function unknownDisclosure(id) {
  return new GriDisclosure({ id, standard: "", group: "", title: "", status: "", url: "" });
}

/** Linha da Ponte_Indicador_GRI já ligada à divulgação. */
export class GriLink {
  constructor({ type, note }, disclosure) {
    this.disclosure = disclosure;
    const text = toText(type);
    const known = LINK_TYPES.find((t) => normalize(t.label) === normalize(text));
    this.type = known ?? Object.freeze({ ...OTHER_TYPE, label: text || "Vínculo" });
    this.note = toText(note);
    Object.freeze(this);
  }

  get rank() {
    const index = LINK_TYPES.indexOf(this.type);
    return index === -1 ? LINK_TYPES.length : index;
  }
}

/** Ordem do vínculo mais forte para o mais fraco e, no empate, pela ordem da Dim_GRI. */
export function compareLinks(order) {
  const position = (link) => order.get(link.disclosure.id) ?? Number.MAX_SAFE_INTEGER;
  return (a, b) => a.rank - b.rank || position(a) - position(b);
}

function normalize(text) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
