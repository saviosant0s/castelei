# Plano de conteúdo: o básico de cada área

Decisão do Sávio (outubro de 2026). O app foi crescendo com matérias feitas
para ele: o semestre de ADS, a trilha de LLMs, a montagem do PC. Elas são
boas, mas são de UMA pessoa. Para lançar, o que vai para todo mundo é **o
básico de cada área da escola**, e o que é específico fica guardado.

## Como funciona daqui em diante

1. **Toda área tem uma matéria básica.** É a porta de entrada da área: do
   zero, na ordem da escola, com o que toda prova cobra. Quem nunca viu o
   assunto termina sabendo o que um aluno de ensino médio precisa saber.
2. **Especializar é criar matéria DENTRO da área**, depois que a básica
   existe. Sistemas Operacionais mora em Informática, Produção Textual mora
   em Português. A especializada pode supor a básica, e diz isso na
   descrição.
3. **Matéria nasce privada e vira pública depois de revisada.** Privada
   (`"visibility": "private"` no arquivo, ou "Só quem administra" no painel)
   só aparece para quem administra o conteúdo: some da lista, da busca, da
   vitrine, e quem tiver o endereço recebe 404. É o rascunho que o Sávio
   estuda antes de abrir.
4. **Trilha atravessa áreas.** Ela é uma ordem de estudo com um objetivo
   ("passar no ENEM de Natureza", "entender a internet"). A trilha também
   pode ser privada (`visibility` em `config/castelei.php` → `trails`).
   Passo cuja matéria ainda não existe aparece como "Em breve", então a
   trilha pode ser publicada antes de estar completa.

## O que está público e o que está privado

Público é o básico de cada área e a segunda matéria dela; privado é o que
nasceu para o Sávio.

| Área | Públicas | Privadas |
|---|---|---|
| Português | Português (18), Produção Textual (7), Literatura brasileira (13), Interpretação de texto (12) | — |
| Matemática | Matemática Básica (18), Matemática do dia a dia (13), Lógica (15), Geometria e trigonometria (13), Contagem e probabilidade (12) | Álgebra Linear, Cálculo, Probabilidade e Estatística (trilha de LLMs) |
| Física | Física (13), Termodinâmica, óptica e física moderna (12) | — |
| Química | Química (13), Química orgânica (12) | — |
| Biologia | Biologia (12), Corpo humano e saúde (13), Ecologia e meio ambiente (12) | — |
| História | História (12), História do Brasil (13) | — |
| Geografia | Geografia (12), Geografia do Brasil (13) | — |
| Filosofia | Filosofia (12), Os filósofos que mais caem (12) | — |
| Sociologia | Sociologia (12), Sociedade brasileira (12) | — |
| Inglês | Inglês (12), Leitura em inglês para o ENEM (12) | — |
| Espanhol | Espanhol (12), Leitura em espanhol para o ENEM (12) | — |
| Artes | Artes (12), Música (12) | — |
| Educação Física | Educação Física (12), Treino, saúde e alimentação (12) | — |
| Informática | Informática básica (12), Informática para concursos (12) | Sistemas Operacionais (33, o semestre do Sávio), Servidores (22), Refatoração (17, projeto de extensão), Programação com Python (14, candidata a pública depois de revisar), Redes Neurais e as duas de LLMs, Montar um PC (15) |

São 34 públicas e 11 privadas. As trilhas estão na seção "Trilhas básicas
planejadas", abaixo.

## A régua do básico

- **Tamanho:** de 12 a 20 lições por matéria básica, em 3 a 5 módulos.
  Mais que isso vira duas matérias.
- **Recorte:** o que cai no ENEM e nos vestibulares e concursos de nível
  médio. É o que "toda prova cobra"; o resto é especialização.
- **Tudo do Guia Editorial continua valendo:** analogia antes de definição,
  termo explicado na estreia, oito questões por lição, figura original.
- **Ordem de escrita:** Português e Matemática primeiro (as duas que
  aparecem em toda prova), depois as áreas do ENEM pela quantidade de
  questões, e por último as que a prova quase não cobra.

## O básico de cada área

Cada lista é o sumário planejado. Ao escrever, a ordem pode mudar, mas o
recorte é este.

### Português — `portugues` (feito: 18 lições em quatro módulos)

1. **A língua por dentro:** a palavra e as classes de palavras (substantivo,
   adjetivo, artigo, numeral, pronome); verbo e tempos verbais; advérbio,
   preposição e conjunção.
2. **A frase:** sujeito e predicado; os complementos (objeto direto e
   indireto); orações coordenadas e subordinadas.
3. **As regras que mais caem:** concordância verbal (já existe) e nominal;
   regência; crase (já existe); colocação do pronome; pontuação, com a
   vírgula em destaque; acentuação.
4. **Ler um texto:** interpretação e compreensão; tipos e gêneros de texto;
   coesão e coerência; sentido das palavras (denotação, conotação, figuras
   de linguagem).

### Matemática — `matematica-basica` (já tem 18 lições)

Números, potências e raízes, álgebra e funções já estão escritos. **Falta
o que toda prova cobra e a trilha de LLMs não precisava:** razão e
proporção, regra de três, porcentagem e juros, geometria plana (áreas e
perímetros), geometria espacial (volumes), noções de estatística (média,
moda, mediana, gráficos) e probabilidade básica. Isso virou a segunda
matéria pública, **Matemática do dia a dia** (`matematica-do-dia-a-dia`, feita):
Medidas (unidades; tempo e velocidade), Dinheiro (juros; comprar bem),
Geometria (ângulos e triângulos; perímetro e área; círculo; Pitágoras;
volume) e Dados e chance (média, moda e mediana; gráficos; contagem;
probabilidade). Razão, proporção e porcentagem ficaram na básica.

### Física — `fisica-basica` (feito: 13 lições em seis módulos, com os níveis)

1. Grandezas e unidades; notação científica.
2. Cinemática: velocidade, aceleração, movimento uniforme e variado; queda livre.
3. Dinâmica: as três leis de Newton; peso, atrito e força.
4. Energia: trabalho, energia cinética e potencial, conservação; potência.
5. Calor e temperatura; dilatação; mudanças de estado.
6. Ondas e som; luz, reflexão e refração.
7. Eletricidade: carga, corrente, tensão e resistência; circuito simples e conta de luz.
8. Segunda rodada: os gráficos do movimento; movimento circular, engrenagens e órbitas; pressão, densidade e empuxo; ímãs, motores e geradores; usinas e rendimento.

### Química — `quimica-basica` (feito: 13 lições em quatro módulos, com os níveis)

1. Matéria e suas propriedades; misturas e separação de misturas.
2. O átomo: modelos, prótons, nêutrons e elétrons; tabela periódica.
3. Ligações químicas: iônica, covalente e metálica.
4. Funções inorgânicas: ácidos, bases, sais e óxidos; pH.
5. Reações e balanceamento; mol e cálculos simples.
6. Soluções e concentração.
7. Química orgânica: o carbono, as cadeias e as principais funções.
8. Química e ambiente: combustíveis, poluição e reciclagem.
9. Segunda rodada: reações que esquentam e esfriam (ΔH); a velocidade das reações; equilíbrio químico; pilhas, baterias e ferrugem; radioatividade e energia nuclear.

### Biologia — `biologia-basica` (feito: 12 lições em cinco módulos, com os níveis)

1. A célula: partes, tipos e divisão (mitose e meiose).
2. Do DNA à proteína; genética e as leis de Mendel.
3. Evolução e seleção natural.
4. Ecologia: cadeias alimentares, ciclos e biomas brasileiros.
5. Corpo humano: digestão, respiração, circulação, sistema nervoso e hormônios.
6. Saúde: vírus, bactérias, vacinas e doenças que mais caem.
7. Plantas e classificação dos seres vivos.

### História — `historia-basica` (feito: 12 lições em cinco módulos, com os níveis)

1. Para que serve a História; fontes e tempo histórico.
2. Antiguidade: Grécia e Roma.
3. Idade Média e feudalismo.
4. Idade Moderna: Grandes Navegações, Renascimento e Reforma.
5. Brasil Colônia: ciclos econômicos e escravidão.
6. Revoluções: Iluminismo, Revolução Francesa e Industrial.
7. Brasil Império e a abolição.
8. Brasil República: da Primeira República a Vargas.
9. Guerras mundiais e Guerra Fria.
10. Ditadura militar e redemocratização no Brasil.
11. Segunda rodada: os primeiros povos (Pré-história, Egito e Mesopotâmia); África e América antes dos europeus.

### Geografia — `geografia-basica` (feito: 12 lições em seis módulos, com os níveis)

1. Cartografia: escala, coordenadas, fuso horário e projeções.
2. A Terra: estrutura, relevo e clima.
3. Biomas e questões ambientais.
4. População: crescimento, migração e urbanização.
5. Economia: setores, industrialização e agropecuária.
6. Globalização e blocos econômicos.
7. Geografia do Brasil: regiões, recursos e desigualdades.
8. Segunda rodada: a água (bacias, aquíferos e quem gasta); a matriz energética do Brasil e do mundo; poder, conflitos e refugiados.

### Filosofia — `filosofia-basica` (feito: 12 lições em quatro módulos, com os níveis)

1. O que é filosofia; mito e razão.
2. Os pré-socráticos, Sócrates, Platão e Aristóteles.
3. Filosofia medieval e moderna: razão e experiência (Descartes, Locke, Hume, Kant).
4. Ética: o certo e o errado nas principais correntes.
5. Política: contrato social e Estado (Hobbes, Locke, Rousseau).
6. Filosofia contemporânea: Marx, Nietzsche, existencialismo.
7. Segunda rodada: os pré-socráticos; estoicos, epicuristas e cínicos; argumentação e falácias; ciência (Bacon, Popper e Kuhn); estética e indústria cultural; Arendt, Foucault e Beauvoir.

### Sociologia — `sociologia-basica` (feito: 12 lições em seis módulos, com os níveis)

1. O que é sociologia; indivíduo e sociedade.
2. Os clássicos: Durkheim, Weber e Marx.
3. Cultura, identidade e diversidade.
4. Trabalho e desigualdade social.
5. Poder, Estado, democracia e cidadania.
6. Movimentos sociais e direitos humanos.
7. Segunda rodada: raça e racismo; gênero; religião; escola e desigualdade (Bourdieu); cidade, segregação e violência; mídia, consumo e redes.

### Inglês — `ingles-basico` (feito: 12 lições em quatro módulos, com os níveis)

1. Cumprimentos, o verbo *to be* e pronomes.
2. Presente simples e contínuo.
3. Passado simples; verbos irregulares mais usados.
4. Futuro (*will* e *going to*).
5. Vocabulário do dia a dia: números, horas, família, rotina.
6. Ler um texto em inglês: cognatos, falsos cognatos e estratégia de prova.
7. Segunda rodada: substantivos, artigos e possessivos; preposições in, on e at; present perfect; modais; comparativos e superlativos; conectivos e referência.

O formato `match` (ligar os pares) serve bem para vocabulário. Sem áudio por
enquanto: a narração ainda é gravada à mão (ver o `CLAUDE.md`).

### Espanhol — `espanhol-basico` (feito: 12 lições em três módulos, com os níveis)

Mesma espinha do Inglês, com os **falsos amigos** (heterossemânticos) em
destaque, porque é o que a prova do ENEM cobra.

Na segunda rodada entraram: possessivos e demonstrativos; verbos que mudam a vogal e os reflexivos; gustar e os parecidos; o imperativo dos anúncios; comparativos; conectivos (com sino, todavía e luego).

### Artes — `artes-basica` (feito: 12 lições em cinco módulos, com os níveis)

1. Linguagens da arte: visual, música, teatro e dança.
2. Elementos visuais: cor, forma, composição.
3. Grandes movimentos: do Renascimento ao Modernismo.
4. Arte brasileira: Barroco mineiro, Semana de 22, arte popular.
5. Arte contemporânea e cultura digital.
6. Segunda rodada: da caverna à catedral (arte rupestre, Egito, Grécia, Roma, românico e gótico); arte indígena e afro-brasileira; arquitetura e patrimônio (material e imaterial, tombamento); elementos da música; música brasileira, do choro ao rap; teatro; fotografia e cinema.

### Educação Física — `educacao-fisica-basica` (feito: 12 lições em três módulos, com os níveis)

1. Corpo e movimento: aquecimento, capacidades físicas.
2. Saúde: sedentarismo, frequência cardíaca, alimentação.
3. Esportes coletivos e regras básicas.
4. Lutas, danças e jogos da cultura brasileira.
5. Corpo, mídia e padrões de beleza (tema frequente no ENEM).
6. Segunda rodada: ossos, músculos e articulações; princípios do treinamento; primeiros socorros; atletismo, natação e ginástica; Jogos Olímpicos e Paralímpicos; esporte, mídia e sociedade; lazer, trabalho e qualidade de vida.

### Informática — `informatica-basica` (feito: 12 lições em quatro módulos, com os níveis)

As matérias de Informática que existem hoje são especializadas e ficaram
privadas. A básica é a porta de entrada:

1. O computador por dentro: hardware, software e sistema operacional.
2. Arquivos e pastas; organizar e encontrar.
3. Internet: como funciona, navegador, endereço e busca.
4. Segurança: senhas, golpes, cópia de segurança.
5. Editor de texto, planilha e apresentação: o essencial de cada um.
6. Primeiro contato com programação: o que é um algoritmo.
7. Segunda rodada: redes em casa (Wi-Fi, roteador e velocidade); nuvem e compartilhamento; privacidade e LGPD; planilhas (fórmulas, funções e gráficos); e-mail (para, cópia, cópia oculta e anexo); inteligência artificial no dia a dia.

Daqui saem as especializadas que já existem: Montar um PC, Python, Sistemas
Operacionais.

## Segunda rodada (novembro de 2026)

Pedido do Sávio: "fazer todas as matérias que faltam". Duas partes, nesta ordem.

**1. Completar as básicas até a régua (12 lições).** As matérias da primeira
rodada saíram com o sumário inteiro, mas curtas: de 5 a 10 lições. Cada uma
ganha as lições que a prova cobra e o sumário deixava de fora. As antigas não
mudam (lição é `(matéria, slug)` e questão é `(lição, posição)`): as novas
entram entre elas, já com os níveis.

| Matéria | Antes | Depois | O que entra |
|---|---|---|---|
| Física | 8 | 13 | gráficos do movimento, movimento circular, pressão e empuxo, ímãs e geradores, usinas e rendimento |
| Química | 8 | 13 | termoquímica, velocidade das reações, equilíbrio, pilhas e ferrugem, radioatividade |
| Geografia | 9 | 12 | água e hidrografia, energia e matriz energética, geopolítica e conflitos |
| História | 10 | 12 | primeiros povos e Antiguidade oriental, África e América antes dos europeus |
| Inglês | 6 | 12 | substantivos e possessivos, preposições, modais, comparativos, present perfect, conectivos |
| Espanhol | 6 | 12 | possessivos e demonstrativos, verbos que mudam e reflexivos, gustar, imperativo, comparativos, conectivos |
| Filosofia | 6 | 12 | pré-socráticos, helenísticos, argumentação e falácias, ciência, estética e indústria cultural, Arendt, Foucault e Beauvoir |
| Sociologia | 6 | 12 | raça e racismo, gênero, religião, escola e desigualdade, cidade e violência, mídia e consumo |
| Informática | 6 | 12 | redes e Wi-Fi, nuvem e compartilhamento, privacidade e LGPD, fórmulas e gráficos de planilha, e-mail, IA no dia a dia |
| Artes | 5 | 12 | da caverna à catedral, arte indígena e afro-brasileira, arquitetura e patrimônio, elementos da música, música brasileira, teatro, fotografia e cinema |
| Educação Física | 5 | 12 | ossos e músculos, treinamento, esportes individuais, Olimpíadas e Paralimpíadas, primeiros socorros, esporte e mídia, lazer e trabalho |

**2. A segunda matéria de cada área.** Mais funda que a básica, pública e com
os níveis, na ordem da prova. A lista é a proposta; o recorte pode mudar ao
escrever.

| Área | Matéria |
|---|---|
| Português | Literatura brasileira (feita: 13 lições em quatro módulos, com os níveis) |
| Matemática | Geometria e trigonometria (feita: 13 lições em quatro módulos, com os níveis) |
| História | História do Brasil (feita: 13 lições em três módulos, com os níveis) |
| Geografia | Geografia do Brasil (feita: 13 lições em quatro módulos, com os níveis) |
| Biologia | Corpo humano e saúde (feita: 13 lições em quatro módulos, com os níveis) |
| Química | Química orgânica (feita: 12 lições em quatro módulos, com os níveis) |
| Física | Termodinâmica, óptica e física moderna (feita: 12 lições em três módulos, com os níveis) |
| Sociologia | Sociedade brasileira (feita: 12 lições em quatro módulos, com os níveis) |
| Filosofia | Os filósofos que mais caem (feita: 12 lições em três módulos, com os níveis) |
| Inglês | Leitura em inglês para o ENEM (feita: 12 lições em três módulos, com os níveis) |
| Espanhol | Leitura em espanhol para o ENEM (feita: 12 lições em três módulos, com os níveis) |
| Informática | Informática para concursos (feita: 12 lições em quatro módulos, com os níveis) |
| Artes | Música (feita: 12 lições em três módulos, com os níveis) |
| Educação Física | Treino, saúde e alimentação (feita: 12 lições em três módulos, com os níveis) |

## Trilhas básicas planejadas

| Trilha | Passos | Situação |
|---|---|---|
| **Base para provas** | Português → Matemática Básica → Matemática do dia a dia → Lógica → Produção Textual | **No ar** |
| ENEM: Linguagens | Português → Interpretação de texto → Literatura brasileira → Produção Textual → Inglês → Leitura em inglês para o ENEM → Artes → Música → Educação Física | **No ar**, completa |
| ENEM: Matemática | Matemática Básica → Matemática do dia a dia → Geometria e trigonometria → Contagem e probabilidade → Lógica | **No ar**, completa |
| ENEM: Natureza | Física → Termodinâmica, óptica e física moderna → Química → Química orgânica → Biologia → Corpo humano e saúde → Ecologia e meio ambiente | **No ar**, completa |
| ENEM: Humanas | História → História do Brasil → Geografia → Geografia do Brasil → Filosofia → Os filósofos que mais caem → Sociologia → Sociedade brasileira | **No ar**, completa |
| Concursos de nível médio | Português → Interpretação de texto → Lógica → Matemática Básica → Informática básica → Informática para concursos | **No ar**, completa |
| Primeiros passos na informática | Informática básica → Montar um PC → Python | Planejada; Montar um PC e Python ainda privadas |
| LLMs do zero | Matemática Básica → … → LLMs: treino, uso e limites | Privada |

Nas trilhas do ENEM, a segunda matéria da área vem logo depois da básica: ela
supõe a básica, e assim a área fica junta. Trilha não tem bifurcação, então
quem faz espanhol troca os dois passos de inglês pelos de espanhol, e o
porquê do passo diz isso. Treino, saúde e alimentação ficou fora de
Linguagens: o que a prova cobra de Educação Física está na básica.

Uma trilha só entra no ar quando o primeiro passo já existe. Os outros podem
aparecer como "Em breve".

## Ordem de execução

1. Mecanismo de público e privado (feito).
2. Português básico completo (feito).
3. Questões com nível de dificuldade nas matérias públicas (feito: Português, Matemática Básica e Lógica, seis por lição).
4. Matemática do dia a dia (feito: 13 lições em quatro módulos, já com os níveis).
5. **Uma área por rodada** (feito: todas as áreas da lista têm a sua matéria básica, de Biologia a Educação Física). Cada uma entrou com todas as lições de uma vez.
6. As trilhas ENEM (feito: as quatro estão no ar e completas).
7. A segunda matéria de cada área (feito: as catorze áreas têm a sua, de Literatura brasileira a Treino, saúde e alimentação).
8. As segundas matérias nas trilhas do ENEM, e a trilha de concursos (feito).
9. **A terceira matéria de cada área**, na ordem da tabela abaixo.

## Terceira rodada (proposta, novembro de 2026)

Pedido do Sávio: "se não falta nada, pode avançar nos conteúdos e criar
outras seções para a matéria". Uma terceira matéria por área, pública e com
os níveis, na ordem do peso na prova (o que o ENEM mais cobra vem antes). A
lista é a proposta; o recorte pode mudar ao escrever.

| Ordem | Área | Matéria | Por que ela |
|---|---|---|---|
| 1 | Português | Interpretação de texto (feita: 12 lições em três módulos, com os níveis) | É a maior parte da prova de Linguagens, e a básica só tem uma lição dela |
| 2 | Biologia | Ecologia e meio ambiente (feita: 12 lições em três módulos, com os níveis) | O tema de Biologia que mais cai no ENEM; a básica tem duas lições |
| 3 | Matemática | Contagem e probabilidade (feita: 12 lições em três módulos, com os níveis) | Análise combinatória e probabilidade a fundo, que a do dia a dia só abre |
| 4 | Química | Físico-química | Estequiometria, soluções, energia, velocidade, equilíbrio e pilhas com conta |
| 5 | Física | Eletricidade, magnetismo e ondas | Circuitos, consumo, indução e ondas: a parte de Física que vem com situação de casa |
| 6 | História | História contemporânea | Do imperialismo à globalização: a história do mundo que explica o de hoje |
| 7 | Geografia | Geopolítica e mundo atual | Blocos, conflitos, migrações e a ordem mundial depois da Guerra Fria |
| 8 | Sociologia | Os sociólogos que mais caem | Um autor por vez, como a de Filosofia |
| 9 | Artes | Arte brasileira | Do Barroco à arte contemporânea daqui, que o ENEM cobra com imagem |
| 10 | Filosofia | Ética e questões de hoje | Bioética, ética digital, ambiente e direitos humanos |
| 11 | Informática | Planilhas a fundo | Excel e Calc: fórmulas, PROCV, filtros, tabela dinâmica e gráficos |
| 12 | Inglês | Inglês do dia a dia | Viagem, trabalho e internet: falar e entender, além de ler |
| 13 | Espanhol | Espanhol do dia a dia | O mesmo recorte do inglês |
| 14 | Educação Física | Esportes: regras e jogo | As regras, a tática e a história dos esportes que a escola pratica |

