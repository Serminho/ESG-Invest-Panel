import { DataSourceError } from "../data/DataSourceError.js";

/**
 * Lê arquivos .xlsx com a biblioteca SheetJS.
 * A biblioteca é recebida no construtor (injeção de dependência), então
 * este módulo pode ser testado em Node sem navegador.
 */
export class XlsxWorkbookSource {
  /** @param {object} xlsxLib objeto global `XLSX` do SheetJS */
  constructor(xlsxLib) {
    if (!xlsxLib) {
      throw new DataSourceError(
        "Biblioteca SheetJS não carregada. Verifique a conexão com a internet ou o <script> do xlsx no index.html.",
      );
    }
    this.xlsx = xlsxLib;
  }

  /** Busca a planilha por HTTP. Exige que o painel seja servido por um servidor local. */
  async fromUrl(url) {
    let response;
    try {
      response = await fetch(encodeURI(url), { cache: "no-store" });
    } catch (cause) {
      throw new DataSourceError(
        `Não foi possível abrir "${url}". Rode o painel por um servidor local (veja o README) ou abra a planilha manualmente.`,
        { cause },
      );
    }
    if (!response.ok) {
      throw new DataSourceError(`Planilha "${url}" não encontrada (HTTP ${response.status}).`);
    }
    return this.fromArrayBuffer(await response.arrayBuffer());
  }

  /** Lê uma planilha escolhida pelo usuário em um <input type="file">. */
  async fromFile(file) {
    return this.fromArrayBuffer(await file.arrayBuffer());
  }

  fromArrayBuffer(buffer) {
    const workbook = this.xlsx.read(buffer, { type: "array" });
    return new Workbook(workbook, this.xlsx.utils);
  }
}

/** Adaptador: expõe cada aba como matriz de células (linhas x colunas). */
export class Workbook {
  constructor(sheetJsWorkbook, utils) {
    this.book = sheetJsWorkbook;
    this.utils = utils;
  }

  hasSheet(name) {
    return Boolean(this.book.Sheets[name]);
  }

  /** @returns {unknown[][]} linhas não vazias, incluindo títulos e cabeçalho */
  matrix(sheetName) {
    const sheet = this.book.Sheets[sheetName];
    if (!sheet) throw new DataSourceError(`Aba "${sheetName}" não encontrada na planilha.`);
    return this.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
  }
}
