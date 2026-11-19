import { DataSourceError } from "./DataSourceError.js";
import { toText } from "./parse.js";

/** Quantas linhas do topo da aba são examinadas à procura do cabeçalho. */
const HEADER_SCAN_ROWS = 10;

/**
 * Converte as linhas de uma aba em objetos com os nomes de campo do código,
 * conforme o mapeamento `columns` da configuração. O cabeçalho é a primeira
 * linha que contém todas as colunas obrigatórias, então títulos acima dele
 * (como na Fato_Indicador) são ignorados.
 */
export function readRecords(workbook, spec) {
  if (!workbook.hasSheet(spec.name)) {
    if (spec.required) throw new DataSourceError(`Aba obrigatória "${spec.name}" não encontrada na planilha.`);
    return [];
  }

  const matrix = workbook.matrix(spec.name);
  if (!matrix.length) return [];

  const optional = new Set(spec.optional ?? []);
  const required = Object.entries(spec.columns).filter(([field]) => !optional.has(field)).map(([, header]) => header);
  const headerIndex = findHeaderRow(matrix, required, spec.name);
  const headers = matrix[headerIndex].map(toText);
  const positions = Object.entries(spec.columns).map(([field, header]) => [field, headers.indexOf(header)]);

  return matrix
    .slice(headerIndex + 1)
    .map((row) => Object.fromEntries(positions.map(([field, index]) => [field, index >= 0 ? row[index] ?? null : null])))
    .filter((record) => toText(record.id) !== "");
}

function findHeaderRow(matrix, required, sheetName) {
  let closest = { missing: required };
  for (let index = 0; index < Math.min(HEADER_SCAN_ROWS, matrix.length); index += 1) {
    const cells = new Set(matrix[index].map(toText));
    const missing = required.filter((header) => !cells.has(header));
    if (!missing.length) return index;
    if (missing.length < closest.missing.length) closest = { missing };
  }
  throw new DataSourceError(
    `A aba "${sheetName}" não tem as colunas: ${closest.missing.join(", ")}. Ajuste a planilha ou o arquivo js/config.js.`,
  );
}
