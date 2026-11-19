/** Estado observável mínimo: substitui as variáveis globais mutáveis. */
export class Store {
  #state;
  #listeners = new Set();

  constructor(initialState) {
    this.#state = Object.freeze({ ...initialState });
  }

  get state() {
    return this.#state;
  }

  update(patch) {
    this.#state = Object.freeze({ ...this.#state, ...patch });
    this.#listeners.forEach((listener) => listener(this.#state));
  }

  /** @returns {() => void} função para cancelar a inscrição */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}
