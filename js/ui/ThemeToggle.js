const STORAGE_KEY = "esg-investe-theme";

export function initThemeToggle(button, root = document.documentElement) {
  if (!button) return;

  const apply = (theme) => {
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";
    button.setAttribute("aria-pressed", String(isDark));
    button.textContent = isDark ? "☀ Modo claro" : "☾ Modo escuro";
  };

  let saved = "light";
  try {
    saved = globalThis.localStorage?.getItem(STORAGE_KEY) ?? "light";
  } catch {
    // Fallback silencioso se o navegador bloquear localStorage
  }

  apply(saved);

  button.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, next);
    } catch {
    }
  });
}