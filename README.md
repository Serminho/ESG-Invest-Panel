# Painel ASG — Grupo 2

Painel web que lê a planilha `data/DataBase - Grupo 2.xlsx` no navegador e monta todas as páginas, filtros e indicadores a partir dela. Não há indicadores escritos no código.

Para atualizar os dados, edite ou substitua a planilha e recarregue a página. Ou use o botão **Abrir planilha…** para carregar outro `.xlsx` sem reiniciar nada.

## Como rodar

O navegador só lê a planilha e os módulos JavaScript se a página for servida por HTTP. Abrir o `index.html` com duplo clique (`file://`) não funciona.

1. Na pasta do projeto, inicie um servidor local:

```bash
python3 -m http.server 8000
```

2. Abra http://localhost:8000.

Alternativa: a extensão Live Server do VS Code.

A biblioteca SheetJS (leitura do `.xlsx`) é carregada do CDN em `index.html`; sem internet, o painel mostra erro.

## Testes

```bash
npm test
```

Usa o executor nativo do Node (`node --test`), sem dependências. Os testes usam uma planilha falsa em memória e não precisam do navegador.

## De onde vêm os dados

| Aba | Uso | Obrigatória |
|---|---|---|
| `Dim_Indicador` | Lista de indicadores: externos (benchmarks) e internos (propostas) | Sim |
| `Fato_Indicador` | Valores observados. O painel mostra o mais recente de cada indicador | Não |
| `Dim_Tema` | Nome e descrição de cada tema (T8, T9, T12) | Não |
| `Dim_Periodo` | Rótulo do período (ex.: "dez/2025") | Não |
| `Dim_Geografia` | Nome do local (ex.: Piauí, Brasil) | Não |
| `Dim_Universo` | Universo ou denominador da pesquisa, com definição e limite | Não |
| `Dim_Fonte` | Documento, instituição, localizador e link público | Não |
| `Leitura_Analitica` | Leituras e cautelas exibidas no topo de cada tema | Não |

As abas são ligadas pelos IDs (`ID_Tema`, `ID_Indicador`, `ID_Periodo`, `ID_Geografia`, `ID_Universo`, `ID_Fonte`), como descrito na aba `Relacionamentos`.

O cabeçalho de cada aba é procurado nas 10 primeiras linhas. Por isso a `Fato_Indicador` pode ter títulos acima do cabeçalho.

### Como cada indicador aparece

- **Externo** (`Atuação` = "Externo — benchmark público"): mostra o valor mais recente da `Fato_Indicador`. Sem valor, aparece como "Sem dado".
- **Interno** (`Atuação` começando com "Interno"): aparece como "Proposto" até ganhar uma linha na `Fato_Indicador`.
- As colunas `Pilar ASG` e `Periodicidade` são opcionais. Os internos as usam; nos externos ficam vazias.
- Um indicador pode ter várias observações. Só a de período mais recente vai para o destaque.

### Adicionar um indicador

1. Em `Dim_Indicador`, acrescente uma linha com um `ID_Indicador` novo, no padrão do tema (`T9-31`, `T12-31`…), e `ID_Tema` igual a `T8`, `T9` ou `T12`.
2. Para o indicador ter valor, acrescente uma linha em `Fato_Indicador`:
   - `ID_Indicador` igual ao do passo 1;
   - `ID_Periodo` cadastrado em `Dim_Periodo`;
   - `Valor` como número. Para 32,7%, digite `32,7`, não use o formato de porcentagem do Excel, que guarda `0,327`.
3. Salve a planilha e recarregue a página.

Para usar um universo ou uma fonte novos, cadastre-os antes em `Dim_Universo` ou `Dim_Fonte`. Sem cadastro, o indicador é exibido sem universo ou fonte.

### Mudar o formato da planilha

Tudo que depende do formato fica em `js/config.js`:

- `dataFile`: caminho da planilha, relativo ao `index.html`.
- `themesInScope`: temas exibidos. `null` mostra todos; ex.: `["T8", "T12"]`.
- `sheets`: nome de cada aba e o cabeçalho de cada coluna. Se renomear uma coluna na planilha, ajuste aqui.
- `filters`: campos dos filtros de seleção (`year`, `origin`, `status`) e seus textos.
- `internalOriginPrefix`: início da coluna `Atuação` que marca um indicador interno.
- `themeAccents` e `fallbackAccents`: cores de cada tema.
- `highlightsPerTheme`: quantos indicadores aparecem em destaque por tema na visão geral.

Se faltar uma aba obrigatória ou uma coluna, o painel mostra qual está faltando.

## Páginas

- **Visão geral:** números do catálogo, destaques por tema e a lista completa filtrada.
- **Uma página por tema (T8, T9, T12):** leituras do tema no topo, indicadores agrupados por universo de pesquisa (externos) ou por pilar (internos), e a lista de catálogo.
- **Catálogo completo:** lista detalhada de todos os indicadores filtrados.

Cada indicador tem um detalhe expansível com propósito, definição, universo, limite de interpretação, classificação, fonte com link e observações.

## Filtros

- **Período:** ano da observação mais recente do indicador ou, na falta dela, do período de referência cadastrado em `Dim_Indicador`.
- **Atuação:** a origem exata de cada indicador (ex.: "Externo — benchmark público" ou "Interno — indicador fictício proposto").
- **Classificação do dado:** valores da coluna `Classificação do dado`.
- **Busca:** texto livre em código, nome, tema, atuação, propósito, definição, unidade, limite, pilar, periodicidade, universo, fonte, instituição e nas observações (período e geografia).

## Arquitetura

```
index.html                    estrutura da página (sem lógica)
js/
  main.js                     ponto de entrada: monta as dependências e carrega a planilha
  config.js                   abas, colunas, temas, filtros e cores
  infra/
    XlsxWorkbookSource.js     lê o .xlsx com SheetJS, por URL ou arquivo escolhido
  data/
    RecordReader.js           acha o cabeçalho de cada aba e converte linhas em objetos
    CatalogBuilder.js         liga as abas pelos IDs e monta o catálogo
    parse.js                  conversão de células (número, período, texto)
    DataSourceError.js        erro com mensagem para o usuário
  domain/                     regras de negócio, sem DOM
    Indicator.js              indicador, com tema, universo, fonte, observações e busca
    Measurement.js            observação (valor, período, geografia, método)
    Theme.js                  tema com leituras analíticas
    references.js             período, geografia, universo e fonte
    IndicatorCatalog.js       repositório em memória (busca, agrupamentos, contagens)
    IndicatorFilter.js        critérios de filtro imutáveis
  state/Store.js              estado observável (página, busca, filtros)
  ui/
    html.js                   template `html` com escape automático (evita XSS)
    format.js                 formatação pt-BR de valores e unidades
    components.js             componentes visuais puros
    DashboardController.js    eventos do DOM -> estado -> redesenho
    views/
      OverviewView.js         visão geral
      ThemeView.js            uma página por tema
      CatalogView.js          catálogo completo
      index.js                registra as páginas
tests/
  catalog.test.js             montagem do catálogo, ligações e filtros
  ui.test.js                  escape, formatação, parse e destaques
  fakeWorkbook.js             planilha falsa usada pelos testes
```

Princípios aplicados:

- **Responsabilidade única:** leitura do arquivo, montagem do domínio, estado e apresentação ficam em módulos separados.
- **Aberto/fechado:** temas, indicadores, universos e fontes vêm da planilha. Uma página nova é uma classe nova, registrada em `ui/views/index.js`.
- **Inversão de dependência:** a biblioteca SheetJS é injetada em `XlsxWorkbookSource`. O `CatalogBuilder` só conhece a interface `hasSheet`/`matrix`, então os testes usam uma planilha falsa.
- **Sem estado global mutável:** o estado fica no `Store`, e as entidades do domínio são imutáveis (`Object.freeze`).
- **Segurança:** todo texto da planilha é escapado. Links só são criados para `http`/`https`.
