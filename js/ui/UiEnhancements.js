export function initExpandAll(button, pageRoot) {
  if (!button || !pageRoot) return;

  const updateLabel = () => {
    const records = [...pageRoot.querySelectorAll("details.record")];
    const allOpen = records.length > 0 && records.every((el) => el.open);
    button.textContent = allOpen ? "Recolher detalhes" : "Expandir detalhes";
  };

  button.addEventListener("click", () => {
    const records = [...pageRoot.querySelectorAll("details.record")];
    if (records.length === 0) return;

    const shouldOpen = records.some((el) => !el.open);
    for (const record of records) {
      record.open = shouldOpen;
    }
    updateLabel();
  });

  // Atualiza o rótulo automaticamente quando o usuário muda de aba ou filtro
  const observer = new MutationObserver(updateLabel);
  observer.observe(pageRoot, { childList: true, subtree: true });
}

export function initShortcuts({ searchInput, themeButton, exportButton }) {
  document.addEventListener("keydown", (event) => {
    const tag = event.target?.tagName;
    const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

    if (event.key === "Escape" && document.activeElement === searchInput) {
      searchInput.blur();
      return;
    }

    if (event.key === "/" && !isTyping && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      searchInput?.focus();
      searchInput?.select();
      return;
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const key = event.key.toLowerCase();
      if (key === "d") {
        event.preventDefault();
        themeButton?.click();
      } else if (key === "p") {
        event.preventDefault();
        exportButton?.click();
      }
    }
  });
}

export function initBackToTop(button) {
  if (!button) return;

  const toggleVisibility = () => {
    button.classList.toggle("visible", globalThis.scrollY > 300);
  };

  globalThis.addEventListener("scroll", toggleVisibility, { passive: true });
  button.addEventListener("click", () => {
    globalThis.scrollTo({ top: 0, behavior: "smooth" });
  });

  toggleVisibility();
}