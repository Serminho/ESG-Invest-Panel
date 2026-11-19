import { CatalogView } from "./CatalogView.js";
import { OverviewView } from "./OverviewView.js";
import { ThemeView } from "./ThemeView.js";

/**
 * Cria as páginas a partir do catálogo: visão geral, uma página por tema e catálogo.
 * Para adicionar uma página nova, crie a classe com { id, navLabel, render } e inclua aqui.
 * @returns {Map<string, { id: string, navLabel: string, render(catalog, filter): object }>}
 */
export function createViews(catalog, config) {
  const views = [
    new OverviewView({ highlightsPerTheme: config.highlightsPerTheme }),
    ...catalog.themes.map((theme) => new ThemeView(theme)),
    new CatalogView(),
  ];
  return new Map(views.map((view) => [view.id, view]));
}
