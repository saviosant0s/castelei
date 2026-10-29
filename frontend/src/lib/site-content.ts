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
      "As duas regras que as bancas mais adoram, com as pegadinhas mapeadas uma a uma.",
    lessons: [
      "Crase",
      "Concordância verbal",
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
      "Lógica no código: and, or e not",
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
  questions: 322,
};
