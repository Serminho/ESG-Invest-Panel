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
| `Dim_GRI` | Divulgações GRI usadas (código, norma, grupo, título, vigência e link) | Não |
| `Ponte_Indicador_GRI` | Vínculos indicador ↔ divulgação GRI, com tipo e justificativa | Não |

As abas são ligadas pelos IDs (`ID_Tema`, `ID_Indicador`, `ID_Periodo`, `ID_Geografia`, `ID_Universo`, `ID_Fonte`, `Codigo_GRI`), como descrito na aba `Relacionamentos`.

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

### Conexão com as Normas GRI

Cada indicador pode se ligar a uma ou mais divulgações GRI (ex.: `404-1`) ou tópicos da norma setorial GRI 13 (ex.: `13.22`). A ligação fica na `Ponte_Indicador_GRI`, uma linha por par indicador + divulgação:

| Coluna | Conteúdo |
|---|---|
| `ID_Indicador` | Código da `Dim_Indicador` |
| `Codigo_GRI` | Código cadastrado na `Dim_GRI` |
| `Tipo_Vinculo` | `Atende`, `Apoia` ou `Contexto` (veja abaixo) |
| `Justificativa` | Por que o indicador se liga à divulgação e o que falta para atendê-la |

- **Atende:** o indicador calcula a mesma métrica da divulgação. Ainda assim, confira as desagregações que a GRI exige (ex.: a 404-1 pede gênero e categoria funcional).
- **Apoia:** o indicador contribui para a divulgação, mas não a cumpre sozinho.
- **Contexto:** benchmark público sobre o tema. Serve para situar o assunto; **não** é desempenho da Investe e não entra no relato como dado próprio.

Para ligar um indicador novo, acrescente uma linha na ponte. Se a divulgação ainda não existir, cadastre-a antes na `Dim_GRI`; um código sem cadastro aparece no painel só com o número. Linhas repetidas valem uma vez (a primeira).

A coluna `Vigência` da `Dim_GRI` registra transições já publicadas pela GRI. As principais para este painel:

- **GRI 102: Mudança do Clima 2025** e **GRI 103: Energia 2025** valem para relatos publicados a partir de 1º/1/2027 e substituem a GRI 305 e a GRI 302. Por isso o mapeamento já usa 102-x e 103-x. A GRI 102 exclui emissões evitadas dos inventários e das metas: o T9-23 aparece como *Apoia* ao plano de transição (102-1), não como redução de emissões.
- **GRI 101: Biodiversidade 2024** está em vigor desde 1º/1/2026 e substitui a GRI 304.
- As normas trabalhistas (202, 401, 404, 405) estão em revisão. A GRI 104 (Emprego) e a GRI 105 (Remuneração e Jornada) foram aprovadas em 2026, com vigência ainda a definir. Revise esses vínculos quando a data sair.

Oito indicadores não têm correspondência GRI (tecnologias digitais, automação, prazo de aprovação, ROI). Se o tema for material, a gestão dele é relatada pela GRI 3-3 e o indicador vira métrica própria.

### Mudar o formato da planilha

Tudo que depende do formato fica em `js/config.js`:

- `dataFile`: caminho da planilha, relativo ao `index.html`.
- `themesInScope`: temas exibidos. `null` mostra todos; ex.: `["T8", "T12"]`.
- `sheets`: nome de cada aba e o cabeçalho de cada coluna. Se renomear uma coluna na planilha, ajuste aqui.
- `periodFilter.windowYears`: quantos anos o filtro De / Até oferece (padrão: 10).
- `filters`: campos dos filtros de seleção (`origin`, `status`, `griStandards`) e seus textos. Um filtro sem nenhum valor na planilha não aparece.
- `internalOriginPrefix`: início da coluna `Atuação` que marca um indicador interno.
- `themeAccents` e `fallbackAccents`: cores de cada tema.
- `highlightsPerTheme`: quantos indicadores aparecem em destaque por tema na visão geral.

Se faltar uma aba obrigatória ou uma coluna, o painel mostra qual está faltando.

## Páginas

- **Visão geral:** números do catálogo, destaques por tema e a lista completa filtrada.
- **Uma página por tema (T8, T9, T12):** leituras do tema no topo, indicadores agrupados por universo de pesquisa (externos) ou por pilar (internos), e a lista de catálogo.
- **Conexão GRI** (aparece quando a planilha tem a `Dim_GRI`): cobertura por tema, índice das divulgações GRI por grupo (Universal, Econômico, Ambiental, Social, Setorial) com os indicadores ligados e as justificativas, e a lista de indicadores sem correspondência.
- **Catálogo completo:** lista detalhada de todos os indicadores filtrados.

Cada indicador tem um detalhe expansível com propósito, definição, universo, limite de interpretação, classificação, fonte com link, observações e normas GRI. Os códigos GRI também aparecem como selos abaixo do nome, coloridos pelo tipo de vínculo.

A página ativa fica no endereço (`#overview`, `#T8`, `#gri`, `#catalog`…), então dá para compartilhar o link de uma página e usar o botão Voltar do navegador.

## Filtros

- **Período (De / Até):** dois seletores com os últimos 10 anos, contados a partir do ano atual (em 2026: de 2017 a 2026). O período de um indicador é o da observação mais recente ou, na falta dela, o período de referência da `Dim_Indicador`. O indicador aparece se algum ano dele cair no intervalo: um período "2023–2024" entra em "De 2024". Basta preencher um dos lados para ter um limite aberto ("De 2024" = de 2024 em diante). Se um ano escolhido passar do outro limite, o outro acompanha. Indicadores sem período (os internos propostos) saem quando há limite.
- **Atuação:** a origem exata de cada indicador (ex.: "Externo — benchmark público" ou "Interno — indicador fictício proposto").
- **Classificação do dado:** valores da coluna `Classificação do dado`.
- **Norma GRI:** indicadores com vínculo à norma escolhida (ex.: "GRI 404: Capacitação e Educação 2016"). Na página Conexão GRI, o índice mostra só as divulgações dessa norma.
- **Busca:** texto livre em código, nome, tema, atuação, propósito, definição, unidade, limite, pilar, periodicidade, universo, fonte, instituição, observações (período e geografia) e normas GRI (código, título e tipo de vínculo; ex.: "404-1").

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
    Gri.js                    divulgação GRI, vínculo e tipos de vínculo
    references.js             período, geografia, universo e fonte
    IndicatorCatalog.js       repositório em memória (busca, agrupamentos, contagens)
    IndicatorFilter.js        critérios de filtro imutáveis
  state/Store.js              estado observável (página, busca, filtros)
  ui/
    ThemeToggle.js            modo claro/escuro
    UiEnhancements.js         expandir detalhes, atalhos e voltar ao topo
    html.js                   template `html` com escape automático (evita XSS)
    format.js                 formatação pt-BR de valores e unidades
    components.js             componentes visuais puros
    DashboardController.js    eventos do DOM -> estado -> redesenho
    views/
      OverviewView.js         visão geral
      ThemeView.js            uma página por tema
      GriView.js              Conexão GRI
      CatalogView.js          catálogo completo
      index.js                registra as páginas
tests/
  catalog.test.js             montagem do catálogo, ligações, filtros e GRI
  ui.test.js                  escape, formatação, parse, destaques e página GRI
  fakeWorkbook.js             planilha falsa usada pelos testes
```

Princípios aplicados:

- **Responsabilidade única:** leitura do arquivo, montagem do domínio, estado e apresentação ficam em módulos separados.
- **Aberto/fechado:** temas, indicadores, universos, fontes e vínculos GRI vêm da planilha. Uma página nova é uma classe nova, registrada em `ui/views/index.js`.
- **Inversão de dependência:** a biblioteca SheetJS é injetada em `XlsxWorkbookSource`. O `CatalogBuilder` só conhece a interface `hasSheet`/`matrix`, então os testes usam uma planilha falsa.
- **Sem estado global mutável:** o estado fica no `Store`, e as entidades do domínio são imutáveis (`Object.freeze`).
- **Segurança:** todo texto da planilha é escapado. Links só são criados para `http`/`https`.
