/**
 * Template tag que escapa toda interpolação por padrão (evita XSS).
 * Resultados de `html` podem ser aninhados sem escape duplo; arrays são concatenados.
 *
 *   html`<p>${texto}</p>`        // texto escapado
 *   html`<ul>${itens.map(item)}</ul>`
 */
const MARKUP = Symbol("markup");
const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

export function html(strings, ...values) {
  const markup = strings.reduce((out, text, i) => out + text + (i < values.length ? toMarkup(values[i]) : ""), "");
  return { [MARKUP]: markup };
}

/** Converte o resultado de `html` em string para innerHTML. */
export function render(fragment) {
  return toMarkup(fragment);
}

function toMarkup(value) {
  if (value === null || value === undefined || value === false) return "";
  if (Array.isArray(value)) return value.map(toMarkup).join("");
  if (typeof value === "object" && MARKUP in value) return value[MARKUP];
  return escapeHtml(value);
}
