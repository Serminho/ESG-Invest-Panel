/** Erro de leitura ou de formato da planilha, com mensagem pronta para o usuário. */
export class DataSourceError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "DataSourceError";
  }
}
