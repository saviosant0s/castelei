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

| Matéria | Área | Situação |
|---|---|---|
| Matemática Básica (18 lições) | Matemática | **Pública** |
| Português (18 lições) | Português | **Pública**, básico completo |
| Matemática do dia a dia (13) | Matemática | **Pública** |
| Lógica (15) | Matemática | **Pública** |
| Produção Textual (7) | Português | **Pública** |
| Sistemas Operacionais (33) | Informática | Privada: é o semestre do Sávio |
| Servidores, VPS e Infraestrutura (22) | Informática | Privada |
| Refatoração (17) | Informática | Privada: projeto de extensão |
| Programação com Python (14) | Informática | Privada, candidata a pública depois de revisar |
| Álgebra Linear, Cálculo, Probabilidade e Estatística | Matemática | Privadas: trilha de LLMs |
| Redes Neurais, as duas de LLMs | Informática | Privadas: trilha de LLMs |
| Montar um PC (15) | Informática | Privada |

Trilhas: **Base para provas** (pública: Português → Matemática Básica →
Matemática do dia a dia → Lógica → Produção Textual) e **LLMs do zero** (privada).

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

### Física — `fisica-basica` (feito: 8 lições em cinco módulos, com os níveis)

1. Grandezas e unidades; notação científica.
2. Cinemática: velocidade, aceleração, movimento uniforme e variado; queda livre.
3. Dinâmica: as três leis de Newton; peso, atrito e força.
4. Energia: trabalho, energia cinética e potencial, conservação; potência.
5. Calor e temperatura; dilatação; mudanças de estado.
6. Ondas e som; luz, reflexão e refração.
7. Eletricidade: carga, corrente, tensão e resistência; circuito simples e conta de luz.

### Química — `quimica-basica` (feito: 8 lições em quatro módulos, com os níveis)

1. Matéria e suas propriedades; misturas e separação de misturas.
2. O átomo: modelos, prótons, nêutrons e elétrons; tabela periódica.
3. Ligações químicas: iônica, covalente e metálica.
4. Funções inorgânicas: ácidos, bases, sais e óxidos; pH.
5. Reações e balanceamento; mol e cálculos simples.
6. Soluções e concentração.
7. Química orgânica: o carbono, as cadeias e as principais funções.
8. Química e ambiente: combustíveis, poluição e reciclagem.

### Biologia — `biologia-basica` (feito: 12 lições em cinco módulos, com os níveis)

1. A célula: partes, tipos e divisão (mitose e meiose).
2. Do DNA à proteína; genética e as leis de Mendel.
3. Evolução e seleção natural.
4. Ecologia: cadeias alimentares, ciclos e biomas brasileiros.
5. Corpo humano: digestão, respiração, circulação, sistema nervoso e hormônios.
6. Saúde: vírus, bactérias, vacinas e doenças que mais caem.
7. Plantas e classificação dos seres vivos.

### História — `historia-basica` (feito: 10 lições em cinco módulos, com os níveis)

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

### Geografia — `geografia-basica` (feito: 9 lições em cinco módulos, com os níveis)

1. Cartografia: escala, coordenadas, fuso horário e projeções.
2. A Terra: estrutura, relevo e clima.
3. Biomas e questões ambientais.
4. População: crescimento, migração e urbanização.
5. Economia: setores, industrialização e agropecuária.
6. Globalização e blocos econômicos.
7. Geografia do Brasil: regiões, recursos e desigualdades.

### Filosofia — `filosofia-basica`

1. O que é filosofia; mito e razão.
2. Os pré-socráticos, Sócrates, Platão e Aristóteles.
3. Filosofia medieval e moderna: razão e experiência (Descartes, Locke, Hume, Kant).
4. Ética: o certo e o errado nas principais correntes.
5. Política: contrato social e Estado (Hobbes, Locke, Rousseau).
6. Filosofia contemporânea: Marx, Nietzsche, existencialismo.

### Sociologia — `sociologia-basica`

1. O que é sociologia; indivíduo e sociedade.
2. Os clássicos: Durkheim, Weber e Marx.
3. Cultura, identidade e diversidade.
4. Trabalho e desigualdade social.
5. Poder, Estado, democracia e cidadania.
6. Movimentos sociais e direitos humanos.

### Inglês — `ingles-basico` (feito: 6 lições em três módulos, com os níveis)

1. Cumprimentos, o verbo *to be* e pronomes.
2. Presente simples e contínuo.
3. Passado simples; verbos irregulares mais usados.
4. Futuro (*will* e *going to*).
5. Vocabulário do dia a dia: números, horas, família, rotina.
6. Ler um texto em inglês: cognatos, falsos cognatos e estratégia de prova.

O formato `match` (ligar os pares) serve bem para vocabulário. Sem áudio por
enquanto: a narração ainda é gravada à mão (ver o `CLAUDE.md`).

### Espanhol — `espanhol-basico`

Mesma espinha do Inglês, com os **falsos amigos** (heterossemânticos) em
destaque, porque é o que a prova do ENEM cobra.

### Artes — `artes-basica`

1. Linguagens da arte: visual, música, teatro e dança.
2. Elementos visuais: cor, forma, composição.
3. Grandes movimentos: do Renascimento ao Modernismo.
4. Arte brasileira: Barroco mineiro, Semana de 22, arte popular.
5. Arte contemporânea e cultura digital.

### Educação Física — `educacao-fisica-basica`

1. Corpo e movimento: aquecimento, capacidades físicas.
2. Saúde: sedentarismo, frequência cardíaca, alimentação.
3. Esportes coletivos e regras básicas.
4. Lutas, danças e jogos da cultura brasileira.
5. Corpo, mídia e padrões de beleza (tema frequente no ENEM).

### Informática — `informatica-basica`

As matérias de Informática que existem hoje são especializadas e ficaram
privadas. A básica é a porta de entrada:

1. O computador por dentro: hardware, software e sistema operacional.
2. Arquivos e pastas; organizar e encontrar.
3. Internet: como funciona, navegador, endereço e busca.
4. Segurança: senhas, golpes, cópia de segurança.
5. Editor de texto, planilha e apresentação: o essencial de cada um.
6. Primeiro contato com programação: o que é um algoritmo.

Daqui saem as especializadas que já existem: Montar um PC, Python, Sistemas
Operacionais.

## Trilhas básicas planejadas

| Trilha | Passos | Situação |
|---|---|---|
| **Base para provas** | Português → Matemática Básica → Matemática do dia a dia → Lógica → Produção Textual | **No ar** |
| ENEM: Linguagens | Português → Produção Textual → Inglês (ou Espanhol) → Artes → Educação Física | **No ar** (os passos sem matéria aparecem como "Em breve") |
| ENEM: Matemática | Matemática Básica → Matemática do dia a dia → Lógica | **No ar** |
| ENEM: Natureza | Física → Química → Biologia | **No ar** (os passos sem matéria aparecem como "Em breve") |
| ENEM: Humanas | História → Geografia → Filosofia → Sociologia | **No ar** (os passos sem matéria aparecem como "Em breve") |
| Primeiros passos na informática | Informática básica → Montar um PC → Python | Planejada; Montar um PC e Python ainda privadas |
| LLMs do zero | Matemática Básica → … → LLMs: treino, uso e limites | Privada |

Uma trilha só entra no ar quando o primeiro passo já existe. Os outros podem
aparecer como "Em breve".

## Ordem de execução

1. Mecanismo de público e privado (feito).
2. Português básico completo (feito).
3. Questões com nível de dificuldade nas matérias públicas (feito: Português, Matemática Básica e Lógica, seis por lição).
4. Matemática do dia a dia (feito: 13 lições em quatro módulos, já com os níveis).
5. **Uma área por rodada** (em andamento; Biologia e História feitas): Geografia, Física, Química,
   Inglês, Informática básica, Filosofia, Sociologia, Espanhol, Artes,
   Educação Física. Cada uma entra com todas as lições de uma vez.
6. As trilhas ENEM entram conforme as matérias delas ficam prontas.
