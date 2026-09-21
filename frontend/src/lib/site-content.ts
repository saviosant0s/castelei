/*
| O catálogo, do ponto de vista do site público.
|
| Por que não buscar da API: o site de divulgação é a porta de entrada e a
| página que o Google indexa. Ele não pode depender de o backend estar de pé,
| nem exibir "não deu para carregar" para quem chega pela primeira vez.
|
| O preço disso é duplicação, e o preço está pago em `site-content.test.ts`:
| o teste lê os JSON de conteúdo do backend e reprova se este arquivo ficar
| desatualizado. Acrescentou lição nova? O teste avisa antes do deploy.
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
    slug: "sistemas-operacionais",
    name: "Sistemas Operacionais",
    pitch: "O conteúdo do semestre na ordem das aulas, do que o sistema faz até como um programa pede algo a ele.",
    lessons: [
      "O que é um sistema operacional?",
      "Componentes e funções de um SO",
      "O terminal na prática (Windows e Linux)",
      "Chamadas de sistema: como funcionam",
      "Chamadas de sistema: arquivos e processos",
      "Estrutura de um SO: como ele é montado por dentro",
      "Processos: como um programa vira coisa viva",
      "Estados de um processo: correndo, pronto ou parado",
      "Escalonamento: quem usa o processador agora",
      "Threads: vários caminhos dentro do mesmo programa",
      "Threads por dentro: quem cuida da troca",
    ],
  },
  {
    slug: "matematica-basica",
    name: "Matemática Básica",
    pitch: "A base que volta em toda prova de exatas, explicada do começo — inclusive o passo que todo mundo pula.",
    lessons: ["Equações do 1º grau", "Porcentagem"],
  },
  {
    slug: "portugues",
    name: "Português",
    pitch: "As duas regras que as bancas mais adoram, com as pegadinhas mapeadas uma a uma.",
    lessons: ["Crase", "Concordância verbal"],
  },
];

/** Números da vitrine. Calculados, para nunca discordarem da lista acima. */
export const CATALOG = {
  subjects: SUBJECTS.length,
  lessons: SUBJECTS.reduce((total, subject) => total + subject.lessons.length, 0),
  /** Cada lição publicada tem 8 questões. O teste confere. */
  questionsPerLesson: 8,
  get questions() {
    return this.lessons * this.questionsPerLesson;
  },
};
