/**
 * Planilha falsa em memória, com a mesma interface de Workbook.
 * Cada aba é uma lista de objetos { cabeçalho: valor }; `titleRows` simula
 * linhas de título acima do cabeçalho.
 */
export function fakeWorkbook(sheets, { titleRows = {} } = {}) {
  return {
    hasSheet: (name) => name in sheets,
    matrix: (name) => {
      const rows = sheets[name];
      const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      return [...(titleRows[name] ?? []), headers, ...rows.map((row) => headers.map((h) => row[h] ?? null))];
    },
  };
}

export const indicatorRow = (overrides = {}) => ({
  "ID_Indicador": "T8-01",
  "ID_Tema": "T8",
  "Indicador": "Estoque de empregos formais no Piauí — dez/2025",
  "Atuação": "Externo — benchmark público",
  "Propósito gerencial": "Dimensionar o mercado formal.",
  "Definição / critério": "Contagem de vínculos.",
  "Unidade": "vínculos",
  "ID_Universo": "POP-CAGED",
  "Período de referência": "PER-2025-12",
  "ID_Fonte": "SRC-01",
  "Classificação do dado": "Observado em fonte pública",
  "Limite / uso correto": "Não classifica empregos verdes.",
  ...overrides,
});

export const internalRow = (overrides = {}) => indicatorRow({
  "Atuação": "Interno — indicador fictício proposto",
  "Unidade": "%",
  "ID_Universo": "POP-INVESTE",
  "Período de referência": null,
  "ID_Fonte": "SRC-09",
  "Classificação do dado": "Proposto - sem dado",
  "Pilar ASG": "Ambiental",
  "Periodicidade": "Mensal",
  ...overrides,
});

export const factRow = (overrides = {}) => ({
  "ID_Observacao": "OBS-001",
  "ID_Indicador": "T8-01",
  "ID_Periodo": "PER-2025-12",
  "ID_Geografia": "GEO-PI",
  "ID_Universo": "POP-CAGED",
  "Valor": 382684,
  "Unidade": "vínculos",
  "Tipo_Valor": "Observado em fonte pública",
  "ID_Fonte": "SRC-01",
  "Localizador_Fonte": "Gráfico 1",
  "Metodo_Calculo": "Contagem.",
  "Nota_Interpretacao": "Contexto.",
  ...overrides,
});
