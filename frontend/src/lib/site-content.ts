/*
| O catálogo, do ponto de vista do site público — e a rede de segurança dele.
|
| A vitrine lê do backend (ver `site-catalog.ts`), para matéria criada no
| painel aparecer sem ninguém editar código. Mas o site de divulgação é a
| porta de entrada e a página que o Google indexa: ele não pode depender de o
| backend estar de pé, nem exibir "não deu para carregar" para quem chega
| pela primeira vez. Quando a API falha, demora ou responde algo estranho, é
| esta lista que vai ao ar.
|
| Por isso ela precisa continuar verdadeira, e o preço está pago em
| `site-content.test.ts`: o teste lê os JSON de conteúdo do backend e reprova
| se este arquivo ficar desatualizado.
|
| Matéria PRIVADA (`"visibility": "private"` no arquivo) não entra aqui: ela
| só existe para quem administra o conteúdo, e a vitrine fala com todo mundo.
|
| A frase de vitrine (`pitch`) não tem equivalente no banco: é texto de venda,
| escrito com capricho. Matéria que tem a sua aqui mantém a sua; matéria nova,
| vinda do painel, se anuncia com a própria descrição.
*/

export interface SiteSubject {
  slug: string;
  name: string;
  /** Uma frase de vitrine — mais concreta que a descrição do catálogo. */
  pitch: string;
  lessons: string[];
}

export const SUBJECTS: SiteSubject[] = [
  {
    slug: "portugues",
    name: "Português",
    pitch:
      "O básico da língua do zero: as classes de palavras, a frase, as regras que a prova mais cobra e a leitura de textos.",
    lessons: [
      "Substantivo, adjetivo, artigo e numeral",
      "Pronomes: as palavras que apontam",
      "Verbos: pessoa, tempo e modo",
      "Advérbio, preposição e conjunção",
      "Sujeito e predicado",
      "Os complementos do verbo",
      "Período composto: coordenação e subordinação",
      "Concordância nominal",
      "Concordância verbal",
      "Regência: a preposição que a palavra exige",
      "Crase",
      "Colocação pronominal: antes, depois ou no meio",
      "A vírgula: onde ela vai e onde não pode ir",
      "Acentuação: onde vai o acento",
      "Interpretação de texto: o que ele diz e o que permite concluir",
      "Tipos e gêneros textuais",
      "Coesão e coerência",
      "Sentido das palavras e figuras de linguagem",
    ],
  },
  {
    slug: "matematica-basica",
    name: "Matemática Básica",
    pitch:
      "A base que volta em toda prova de exatas, explicada do começo — inclusive o passo que todo mundo pula.",
    lessons: [
      "Números inteiros e o sinal de menos",
      "Frações e números decimais",
      "Razão, proporção e regra de três",
      "Porcentagem",
      "Potenciação: multiplicar o mesmo número várias vezes",
      "Radiciação: a conta que desfaz a potência",
      "Notação científica: números gigantes e minúsculos",
      "Expressões algébricas: letras no lugar de números",
      "Equações do 1º grau",
      "Equações do 2º grau e a fórmula de Bhaskara",
      "Sistemas de equações: duas pistas para dois valores",
      "Noções de conjuntos",
      "O plano cartesiano: um endereço para cada ponto",
      "O que é uma função",
      "Função afim: o gráfico que é uma reta",
      "Função quadrática: a curva da bola chutada",
      "Função exponencial: o que cresce multiplicando",
      "Logaritmos: quantas vezes multiplicar",
    ],
  },
  {
    slug: "matematica-do-dia-a-dia",
    name: "Matemática do dia a dia",
    pitch:
      "A conta que a prova cobra e a vida usa: medidas, horários, juros, preço por quilo, áreas, volumes, gráficos e chances.",
    lessons: [
      "Medidas: comprimento, massa e capacidade",
      "Tempo, horários e velocidade",
      "Juros simples e compostos",
      "Comprar bem: preço por unidade, descontos e parcelas",
      "Ângulos e triângulos",
      "Perímetro e área",
      "O círculo: raio, contorno e área",
      "O teorema de Pitágoras",
      "Volume: caixas, latas e litros",
      "Média, moda e mediana",
      "Ler gráficos e tabelas",
      "Contar sem listar: o princípio multiplicativo",
      "Probabilidade: a chance em números",
    ],
  },
  {
    slug: "logica",
    name: "Lógica",
    pitch:
      "Proposições, tabela-verdade, equivalências e as negações que as bancas mais cobram, de “todo” a “se… então”.",
    lessons: [
      "Proposição: a frase que é verdadeira ou falsa",
      "Negação: virar o valor lógico",
      "E, ou e ou exclusivo",
      "Condicional: se… então",
      "Bicondicional: se e somente se",
      "Montar uma tabela-verdade",
      "Tautologia, contradição e contingência",
      "Equivalência lógica e contrapositiva",
      "Leis de De Morgan: negar “e” e “ou”",
      "Negar condicional e bicondicional",
      "Todo, algum e nenhum: quantificadores e negações",
      "Argumento válido: modus ponens e modus tollens",
      "Falácias: afirmar o consequente e negar o antecedente",
      "Silogismos com diagramas de Venn",
      "Lógica no dia a dia: regras, filtros e promoções",
    ],
  },
  {
    slug: "producao-textual",
    name: "Produção Textual",
    pitch:
      "Escrever por partes até o texto inteiro: artigo de opinião, redação com proposta de intervenção e fábula, conferindo a forma e a língua a cada etapa.",
    lessons: [
      "O que é um artigo de opinião",
      "A tese e a introdução",
      "Argumentos que convencem",
      "Contra-argumento e conclusão",
      "A redação dissertativa-argumentativa",
      "A proposta de intervenção",
      "Fábula: uma história com lição",
    ],
  },
  {
    slug: "biologia-basica",
    name: "Biologia",
    pitch:
      "A célula, o DNA, a herança de Mendel, a evolução, a ecologia e os biomas do Brasil, o corpo humano e as vacinas: o básico que toda prova de Biologia cobra.",
    lessons: [
      "A célula: a menor parte viva",
      "As organelas: as peças de dentro da célula",
      "Mitose e meiose: como a célula se divide",
      "Do DNA à proteína: a receita da vida",
      "Herança: as leis de Mendel",
      "Evolução: como as espécies mudam",
      "Cadeias alimentares: quem come quem",
      "Os ciclos da natureza e os biomas do Brasil",
      "Digestão e respiração: combustível e oxigênio",
      "Circulação, nervos e hormônios",
      "Vírus, bactérias e vacinas",
      "Plantas e a classificação dos seres vivos",
    ],
  },
  {
    slug: "historia-basica",
    name: "História",
    pitch:
      "Da Grécia e de Roma à Constituição de 1988: Idade Média, navegações, revoluções, Brasil Colônia, Império, Vargas, guerras mundiais e ditadura, na ordem em que uma coisa explica a outra.",
    lessons: [
      "Para que serve a História",
      "Os primeiros povos: Pré-história, Egito e Mesopotâmia",
      "Grécia e Roma: a Antiguidade que deixou herança",
      "Idade Média: feudos, servos e Igreja",
      "África e América antes dos europeus",
      "Navegações, Renascimento e Reforma",
      "Brasil Colônia: pau-brasil, açúcar e ouro",
      "Iluminismo, Revolução Francesa e Revolução Industrial",
      "Brasil Império e o fim da escravidão",
      "Da Primeira República à Era Vargas",
      "Guerras mundiais e Guerra Fria",
      "Ditadura militar e a volta da democracia",
    ],
  },
  {
    slug: "geografia-basica",
    name: "Geografia",
    pitch:
      "Mapas, escala, coordenadas e fusos; relevo, clima e as questões ambientais; população, cidades, economia, globalização e as regiões do Brasil.",
    lessons: [
      "Mapas: escala, legenda e projeções",
      "Coordenadas e fusos horários",
      "A Terra por dentro e o relevo",
      "Tempo, clima e os climas do Brasil",
      "A água: rios, bacias e quem gasta",
      "Biomas e questões ambientais",
      "População, migração e cidades",
      "Economia: setores, indústria e campo",
      "Energia: a do Brasil e a do mundo",
      "Globalização e blocos econômicos",
      "O mundo de hoje: poder, conflitos e refugiados",
      "As regiões do Brasil e suas diferenças",
    ],
  },
  {
    slug: "fisica-basica",
    name: "Física",
    pitch:
      "Medidas, movimento, as leis de Newton, energia, calor, ondas, luz e eletricidade, com a conta de luz e outros exemplos de casa.",
    lessons: [
      "Grandezas, unidades e notação científica",
      "Movimento: velocidade e aceleração",
      "Os gráficos do movimento",
      "As três leis de Newton",
      "Movimento circular: rodas, engrenagens e satélites",
      "Energia: movimento, altura e potência",
      "Calor, temperatura e mudanças de estado",
      "Pressão, densidade e empuxo: por que o navio flutua",
      "Ondas e som",
      "Luz: reflexão, refração e cores",
      "Eletricidade: corrente, tensão e a conta de luz",
      "Ímãs, motores e geradores",
      "De onde vem a energia: usinas e rendimento",
    ],
  },
  {
    slug: "quimica-basica",
    name: "Química",
    pitch:
      "Misturas e separação, átomos e tabela periódica, ligações, ácidos e bases, reações e mol, soluções, química orgânica e o impacto no ambiente.",
    lessons: [
      "Matéria, misturas e como separá-las",
      "O átomo e a tabela periódica",
      "Ligações químicas: como os átomos se unem",
      "Ácidos, bases, sais e óxidos",
      "Reações químicas, balanceamento e mol",
      "Reações que esquentam e reações que esfriam",
      "A velocidade das reações",
      "Equilíbrio químico: a reação que vai e volta",
      "Soluções e concentração",
      "Pilhas, baterias e ferrugem",
      "Química orgânica: o mundo do carbono",
      "Química e ambiente: combustíveis, poluição e reciclagem",
      "Radioatividade e energia nuclear",
    ],
  },
  {
    slug: "ingles-basico",
    name: "Inglês",
    pitch:
      "O verbo to be, presente, passado e futuro, o vocabulário do dia a dia e como ler um texto em inglês com estratégia, de olho nos falsos cognatos.",
    lessons: [
      "Cumprimentos, pronomes e o verbo to be",
      "Substantivos, artigos e de quem é",
      "Presente simples e presente contínuo",
      "Preposições: in, on e at",
      "Passado simples e os verbos irregulares",
      "Present perfect: o passado que chega até hoje",
      "Futuro: will e going to",
      "Can, must e should: poder, dever e aconselhar",
      "Comparar: taller, more expensive, the best",
      "Vocabulário do dia a dia: números, horas, família e rotina",
      "Conectivos: and, but, however e because",
      "Ler um texto em inglês com estratégia",
    ],
  },
  {
    slug: "informatica-basica",
    name: "Informática básica",
    pitch:
      "Como o computador funciona, arquivos e pastas, internet, golpes e senhas, texto, planilha e apresentação, e o primeiro algoritmo: para quem parte do zero.",
    lessons: [
      "O computador por dentro: hardware, software e sistema",
      "Arquivos e pastas: organizar e encontrar",
      "Como a internet funciona e como buscar bem",
      "Redes em casa: Wi-Fi, roteador e velocidade",
      "A nuvem: guardar e compartilhar arquivos",
      "Segurança digital: senhas, golpes e cópias",
      "Privacidade e dados pessoais: a LGPD",
      "Texto, planilha e apresentação",
      "Planilhas: fórmulas, funções e gráficos",
      "E-mail: para, cópia, cópia oculta e anexo",
      "O que é um algoritmo",
      "Inteligência artificial no dia a dia",
    ],
  },
  {
    slug: "filosofia-basica",
    name: "Filosofia",
    pitch:
      "Do mito à razão, Sócrates, Platão e Aristóteles, razão e experiência, ética, política e contrato social, Marx, Nietzsche e o existencialismo.",
    lessons: [
      "O que é filosofia: do mito à razão",
      "Os pré-socráticos: de que o mundo é feito",
      "Sócrates, Platão e Aristóteles",
      "Como viver bem: estoicos, epicuristas e cínicos",
      "Razão e experiência: de onde vem o conhecimento",
      "Argumentar bem: dedução, indução e falácias",
      "Ciência: como sabemos o que sabemos",
      "Ética: o certo e o errado",
      "Política: poder, Estado e contrato social",
      "Estética e indústria cultural: o belo e a arte de massa",
      "Filosofia contemporânea: Marx, Nietzsche e o existencialismo",
      "Pensar o século XX: Arendt, Foucault e Beauvoir",
    ],
  },
  {
    slug: "sociologia-basica",
    name: "Sociologia",
    pitch:
      "Indivíduo e sociedade, Durkheim, Weber e Marx, cultura e diversidade, trabalho e desigualdade, Estado e cidadania, movimentos sociais e direitos humanos.",
    lessons: [
      "O que é sociologia: indivíduo e sociedade",
      "Os clássicos: Durkheim, Weber e Marx",
      "Cultura, identidade e diversidade",
      "Trabalho e desigualdade social",
      "Raça, racismo e desigualdade racial",
      "Gênero: papéis, desigualdade e violência",
      "Religião e sociedade",
      "Escola e desigualdade",
      "A cidade: periferia, segregação e violência",
      "Mídia, consumo e redes sociais",
      "Poder, Estado, democracia e cidadania",
      "Movimentos sociais e direitos humanos",
    ],
  },
  {
    slug: "espanhol-basico",
    name: "Espanhol",
    pitch:
      "Saudações, ser e estar, artigos, os verbos no presente, passado e futuro, vocabulário do dia a dia e os falsos amigos que o ENEM mais cobra.",
    lessons: [
      "Saudações, pronomes, ser e estar",
      "Artigos, gênero e as palavras que trocam de gênero",
      "Possessivos e demonstrativos: mi, su, este, ese",
      "O presente: verbos em -ar, -er e -ir",
      "Verbos que mudam: quiero, puedo e os reflexivos",
      "Gustar: me gusta, me gustan",
      "Passado e futuro",
      "O imperativo: ordens, pedidos e anúncios",
      "Comparar: más que, menos que, tan como",
      "Vocabulário do dia a dia: números, horas, família e rotina",
      "Conectivos: pero, sin embargo, aunque",
      "Falsos amigos e como ler um texto em espanhol",
    ],
  },
  {
    slug: "artes-basica",
    name: "Artes",
    pitch:
      "Para olhar uma obra e saber o que ela diz: as linguagens da arte, cor e composição, os grandes movimentos, a arte brasileira e a arte de hoje.",
    lessons: [
      "As linguagens da arte",
      "Cor, forma e composição",
      "Da caverna à catedral: a arte antes do Renascimento",
      "Do Renascimento ao Surrealismo",
      "Arte brasileira: do Barroco mineiro à Semana de 22",
      "Arte indígena e afro-brasileira",
      "Arquitetura e patrimônio cultural",
      "Música: som, silêncio e os seus elementos",
      "Música brasileira: do choro ao rap",
      "Teatro: o corpo em cena",
      "Fotografia e cinema: ler a imagem",
      "Arte contemporânea e cultura digital",
    ],
  },
  {
    slug: "educacao-fisica-basica",
    name: "Educação Física",
    pitch:
      "Corpo, saúde e cultura em movimento: capacidades físicas, quanto se mexer, esportes e regras, capoeira e danças do Brasil, e o corpo na mídia.",
    lessons: [
      "O corpo em movimento",
      "Ossos, músculos e articulações",
      "Princípios do treinamento",
      "Atividade física e saúde",
      "Primeiros socorros: o que fazer até a ajuda chegar",
      "Esportes coletivos e suas regras",
      "Atletismo, natação e ginástica",
      "Lutas, danças e jogos do Brasil",
      "Jogos Olímpicos e Paralímpicos",
      "Corpo, mídia e padrões de beleza",
      "Esporte, mídia e sociedade",
      "Lazer, trabalho e qualidade de vida",
    ],
  },
  {
    slug: "literatura-brasileira",
    name: "Literatura brasileira",
    pitch:
      "Do Quinhentismo à literatura de hoje: cada escola com seus autores e obras, o jeito de ler um poema e as pistas que a prova dá.",
    lessons: [
      "O que é literatura",
      "O poema: verso, estrofe, rima e métrica",
      "Quinhentismo e Barroco",
      "Arcadismo: a vida simples no campo",
      "Romantismo: as três gerações da poesia",
      "Romantismo: o romance brasileiro",
      "Realismo e Naturalismo",
      "Parnasianismo e Simbolismo",
      "Pré-Modernismo: o Brasil que ninguém mostrava",
      "Modernismo: a Semana de 22 e a primeira fase",
      "A geração de 30: o romance do Nordeste e a poesia",
      "Guimarães Rosa, Clarice Lispector e João Cabral",
      "Literatura contemporânea: novas vozes",
    ],
  },
  {
    slug: "geometria-e-trigonometria",
    name: "Geometria e trigonometria",
    pitch:
      "Retas e ângulos, semelhança, polígonos e áreas, seno e cosseno, o círculo trigonométrico, sólidos e a reta no plano: a geometria da prova, com conta feita passo a passo.",
    lessons: [
      "Retas paralelas e ângulos",
      "Semelhança de triângulos e o teorema de Tales",
      "Polígonos: ângulos e diagonais",
      "Áreas de figuras planas",
      "Seno, cosseno e tangente",
      "Os ângulos notáveis: 30°, 45° e 60°",
      "Lei dos senos e lei dos cossenos",
      "O círculo trigonométrico e o radiano",
      "Funções trigonométricas: as ondas que se repetem",
      "Poliedros e prismas",
      "Pirâmide, cilindro, cone e esfera",
      "Distância entre dois pontos e ponto médio",
      "A equação da reta e a da circunferência",
    ],
  },
  {
    slug: "historia-do-brasil",
    name: "História do Brasil",
    pitch:
      "Colônia, Império e República em detalhe: as revoltas, as leis e os governos que o ENEM cobra, sempre com a data e o porquê.",
    lessons: [
      "Os povos indígenas e a chegada dos portugueses",
      "Açúcar e escravidão",
      "Holandeses, bandeirantes e as novas fronteiras",
      "O ouro e as revoltas coloniais",
      "Da chegada da família real à Independência",
      "Primeiro Reinado e Regências",
      "Segundo Reinado: café, guerra e imigrantes",
      "A abolição e o fim do Império",
      "A Primeira República (1889–1930)",
      "A Era Vargas (1930–1945)",
      "A República de 1946 a 1964",
      "A ditadura militar (1964–1985)",
      "A Nova República: de 1985 aos dias de hoje",
    ],
  },
  {
    slug: "geografia-do-brasil",
    name: "Geografia do Brasil",
    pitch:
      "O território, o relevo, os climas e os domínios, as cidades, o campo e a Amazônia: a Geografia do país em detalhe, com os números que o ENEM cobra.",
    lessons: [
      "O território: tamanho, limites e formação",
      "Três jeitos de dividir o Brasil",
      "O relevo brasileiro e suas classificações",
      "Climas do Brasil e as massas de ar",
      "Os domínios morfoclimáticos",
      "Rios, regiões hidrográficas e a água do Brasil",
      "A população brasileira: quantos somos e quem somos",
      "Migrações: quem saiu, para onde e por quê",
      "Cidades brasileiras: crescimento, rede urbana e problemas",
      "A indústria brasileira: onde nasceu e para onde foi",
      "O campo: agronegócio, terra e conflitos",
      "Transportes: por onde a carga viaja",
      "Amazônia, desmatamento e as leis que protegem",
    ],
  },
  {
    slug: "corpo-humano-e-saude",
    name: "Corpo humano e saúde",
    pitch:
      "Os sistemas do corpo por dentro, os tipos sanguíneos, a imunidade, a reprodução e as doenças do saneamento, do jeito que o ENEM cobra.",
    lessons: [
      "Da célula ao organismo: tecidos, órgãos e sistemas",
      "Alimentos e nutrientes: o que a comida dá ao corpo",
      "O sistema digestório por dentro: enzimas e absorção",
      "Respirar: o caminho do ar e as trocas gasosas",
      "Coração e vasos: as duas circulações",
      "O sangue e os tipos sanguíneos",
      "Os rins e a urina: o filtro do corpo",
      "O sistema nervoso: neurônios, reflexos e drogas",
      "Os hormônios: as mensagens lentas do corpo",
      "As defesas do corpo: imunidade, vacinas e soros",
      "Reprodução humana: ciclo, gravidez e métodos contraceptivos",
      "ISTs: as infecções do sexo e como se prevenir",
      "Doenças, vetores e saneamento básico",
    ],
  },
];

/** Números da vitrine. Calculados, para nunca discordarem da lista acima. */
export const CATALOG = {
  subjects: SUBJECTS.length,
  lessons: SUBJECTS.reduce(
    (total, subject) => total + subject.lessons.length,
    0,
  ),
  /*
  | Nulo desde Produção Textual: as lições de escrita têm tantas partes quantas
  | o texto pede, e "8 questões por lição" deixou de ser verdade para todas. A
  | vitrine para de prometer um número em vez de mentir.
  */
  questionsPerLesson: null as number | null,
  /** Questões de prática publicadas (sem as propostas do simulado). O teste confere. */
  questions: 3892,
};
