/**
 * Configuração central do painel.
 * Tudo o que depende do formato da planilha fica aqui: nomes de abas,
 * cabeçalhos de colunas e escopo de temas. Se a planilha mudar de layout,
 * ajuste este arquivo; o restante do código não precisa mudar.
 */
export const CONFIG = Object.freeze({
  /** Caminho da planilha, relativo ao index.html. */
  dataFile: "data/DataBase - Grupo 2.xlsx",

  /**
   * Temas exibidos (códigos da coluna ID_Tema). `null` = todos os temas da planilha.
   * Exemplo para limitar: ["T8", "T12"].
   */
  themesInScope: null,

  /** Quantidade de indicadores em destaque por tema na visão geral. */
  highlightsPerTheme: 3,

  /** Cores de destaque por tema; temas sem cor usam a paleta reserva. */
  themeAccents: { T8: "#13a79a", T9: "#eaa54b", T12: "#6687b7" },
  fallbackAccents: ["#8a79c9", "#d4766a", "#5aa36b", "#c7a23e"],

  /** Valores da coluna Atuação que começam com este texto são indicadores internos. */
  internalOriginPrefix: "Interno",

  /**
   * Filtro de período: dois seletores (De / Até) com os últimos `windowYears` anos,
   * contados a partir do ano atual. Indicadores sem período saem quando há limite.
   */
  periodFilter: { windowYears: 10 },

  /**
   * Filtros de seleção, exibidos no painel "Filtros". Sem `options`, as opções vêm
   * dos valores da planilha; com `options`, a lista é fixa (só aparecem as que têm
   * indicador). `onlyWithGri` esconde o filtro quando a planilha não tem a aba Dim_GRI.
   */
  filters: [
    { field: "origin", label: "Atuação", allLabel: "Externos e internos", ariaLabel: "Filtrar por atuação" },
    { field: "status", label: "Classificação do dado", allLabel: "Todas as classificações", ariaLabel: "Filtrar por classificação do dado" },
    {
      // Campo com vários valores: o indicador passa se tiver o vínculo escolhido.
      field: "griConnection",
      label: "Conexão GRI",
      allLabel: "Com e sem vínculo GRI",
      ariaLabel: "Filtrar por conexão com as Normas GRI",
      onlyWithGri: true,
      options: [
        { value: "com", label: "Com vínculo GRI" },
        { value: "atende", label: "Atende a divulgação" },
        { value: "apoia", label: "Apoia a divulgação" },
        { value: "contexto", label: "Contexto (benchmark)" },
        { value: "sem", label: "Sem vínculo GRI" },
      ],
    },
  ],

  /**
   * Mapeamento aba -> campos. Cada `columns` liga o nome do campo usado no
   * código ao cabeçalho exato da planilha. O cabeçalho pode estar em qualquer
   * uma das 10 primeiras linhas (a Fato_Indicador tem título acima dele).
   * `optional` lista campos cuja coluna pode faltar.
   * Abas `required: false` podem faltar; o painel funciona sem elas.
   */
  sheets: {
    indicators: {
      name: "Dim_Indicador",
      required: true,
      columns: {
        id: "ID_Indicador",
        themeId: "ID_Tema",
        name: "Indicador",
        origin: "Atuação",
        purpose: "Propósito gerencial",
        definition: "Definição / critério",
        unit: "Unidade",
        universeId: "ID_Universo",
        referencePeriodId: "Período de referência",
        sourceId: "ID_Fonte",
        status: "Classificação do dado",
        limit: "Limite / uso correto",
        pillar: "Pilar ASG",
        periodicity: "Periodicidade",
      },
      optional: ["pillar", "periodicity"],
    },
    measurements: {
      name: "Fato_Indicador",
      required: false,
      columns: {
        id: "ID_Observacao",
        indicatorId: "ID_Indicador",
        periodId: "ID_Periodo",
        geographyId: "ID_Geografia",
        value: "Valor",
        unit: "Unidade",
        kind: "Tipo_Valor",
        locator: "Localizador_Fonte",
        method: "Metodo_Calculo",
        note: "Nota_Interpretacao",
      },
    },
    themes: {
      name: "Dim_Tema",
      required: false,
      columns: { id: "ID_Tema", name: "Tema_ASG", description: "Descrição do recorte neste arquivo" },
    },
    periods: {
      name: "Dim_Periodo",
      required: false,
      columns: { id: "ID_Periodo", year: "Ano/intervalo", type: "Tipo", description: "Descrição" },
    },
    geographies: {
      name: "Dim_Geografia",
      required: false,
      columns: { id: "ID_Geografia", name: "Nome" },
    },
    universes: {
      name: "Dim_Universo",
      required: false,
      columns: {
        id: "ID_Universo",
        name: "Nome do universo",
        definition: "Definição/abrangência",
        limit: "Limite de interpretação",
      },
    },
    sources: {
      name: "Dim_Fonte",
      required: false,
      columns: {
        id: "ID_Fonte",
        title: "Documento / conjunto",
        institution: "Instituição",
        locator: "Localizador consultado",
        url: "URL pública",
        scope: "Escopo e cautela",
      },
    },
    readings: {
      name: "Leitura_Analitica",
      required: false,
      columns: { id: "Tema", reading: "Leitura dos dados públicos", caution: "Aplicação e cautela" },
    },
    /** Catálogo de divulgações GRI usadas pelos indicadores. */
    gri: {
      name: "Dim_GRI",
      required: false,
      columns: {
        id: "Codigo_GRI",
        standard: "Norma",
        group: "Grupo",
        title: "Divulgação",
        status: "Vigência",
        url: "URL pública",
      },
      optional: ["status", "url"],
    },
    /** Ponte N:N indicador -> divulgação GRI. `id` é o ID_Indicador da linha. */
    griLinks: {
      name: "Ponte_Indicador_GRI",
      required: false,
      columns: { id: "ID_Indicador", code: "Codigo_GRI", type: "Tipo_Vinculo", note: "Justificativa" },
      optional: ["note"],
    },
  },
});
