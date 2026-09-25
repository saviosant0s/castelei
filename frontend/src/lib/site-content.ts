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
    slug: "sistemas-operacionais",
    name: "Sistemas Operacionais",
    pitch:
      "O conteúdo do semestre na ordem das aulas, do que o sistema faz até como um programa pede algo a ele.",
    lessons: [
      "O que é um sistema operacional?",
      "De onde vieram os sistemas operacionais",
      "O hardware que o sistema operacional comanda",
      "Componentes e funções de um SO",
      "O terminal na prática (Windows e Linux)",
      "Chamadas de sistema: como funcionam",
      "Chamadas de sistema: arquivos e processos",
      "Estrutura de um SO: como ele é montado por dentro",
      "Tipos de sistema operacional",
      "Processos: como um programa vira coisa viva",
      "Estados de um processo: correndo, pronto ou parado",
      "Escalonamento: quem usa o processador agora",
      "Threads: vários caminhos dentro do mesmo programa",
      "Threads por dentro: quem cuida da troca",
      "Condição de corrida: quando dois caminhos brigam pelo mesmo dado",
      "Exclusão mútua: só um por vez no trecho perigoso",
      "Semáforos e mutexes: dormir em vez de girar em falso",
      "Monitores e mensagens: quando a linguagem ou a rede resolvem",
      "Os problemas clássicos que toda prova cobra",
      "Memória: por que um programa não escolhe onde mora",
      "Memória virtual: o endereço que o programa vê não é o de verdade",
      "A memória encheu: quem sai da sala",
      "Segmentação: dividir por sentido, não por tamanho",
      "Arquivos e pastas: o que o sistema promete a você",
      "Como o disco guarda um arquivo de verdade",
      "Quando falta luz no meio da gravação",
      "Entrada e saída: como o sistema conversa com as peças",
      "O disco: a peça mais lenta da casa",
      "Vários discos trabalhando como um só",
      "Virtualização: uma máquina fingindo ser várias",
      "Contêineres: dividir sem duplicar o sistema",
      "Estudo de caso: Linux e Android",
      "Estudo de caso: Windows",
    ],
  },
  {
    slug: "matematica-basica",
    name: "Matemática Básica",
    pitch:
      "A base que volta em toda prova de exatas, explicada do começo — inclusive o passo que todo mundo pula.",
    lessons: ["Equações do 1º grau", "Porcentagem"],
  },
  {
    slug: "portugues",
    name: "Português",
    pitch:
      "As duas regras que as bancas mais adoram, com as pegadinhas mapeadas uma a uma.",
    lessons: ["Crase", "Concordância verbal"],
  },
  {
    slug: "servidores-vps",
    name: "Servidores, VPS e Infraestrutura",
    pitch:
      "Do zero até colocar uma aplicação no ar: o caminho de um acesso, a máquina, a rede e o que fazer quando cai.",
    lessons: [
      "O que é um servidor e o que é uma VPS",
      "Linux para servidores",
      "Acesso remoto com SSH",
      "Redes, IPs, portas e sockets",
      "DNS e domínios",
      "Firewall e superfície de ataque",
      "Processos, serviços e systemd",
      "Discos, armazenamento, usuários e permissões",
      "HTTPS, TLS e certificados",
      "Servidor web com Nginx",
      "Bancos de dados em servidores",
      "Deploy de aplicações em uma VPS",
      "Containers e Docker",
      "Monitoramento, métricas e logs",
      "Backups, restauração e recuperação de desastre",
      "Git, CI/CD e automação de infraestrutura",
      "Performance, capacidade e otimização",
      "Arquitetura de produção e alta disponibilidade",
      "Troubleshooting avançado",
      "Segurança de servidores em nível avançado",
      "Cloud, VPS e serviços gerenciados",
      "Projeto final: colocar uma aplicação em produção",
    ],
  },
  {
    slug: "refatoracao",
    name: "Refatoração",
    pitch:
      "Mexer num código antigo sem quebrar nada: testes antes, passos pequenos, os cheiros que pedem arrumação e como dirigir uma IA que refatora por você.",
    lessons: [
      "Refatorar: mudar por dentro sem mudar por fora",
      "Por que o código fica difícil de mexer",
      "A rede de segurança: testes antes de mexer",
      "Passos pequenos, um commit por vez",
      "Método longo e classe que faz tudo",
      "Código repetido, números mágicos e nomes ruins",
      "Switch por tipo, parâmetros demais e estado global",
      "Renomear e extrair método",
      "Extrair classe, mover e encapsular",
      "Trocar o switch por polimorfismo",
      "O laço do jogo: atualizar e desenhar separados",
      "Telas como estados e o tempo que não depende do FPS",
      "Melhorar o visual sem mexer nas regras",
      "Medir antes de otimizar",
      "Os vilões do desempenho num jogo Java",
      "Refatorar sem abrir brecha de segurança",
      "Refatorar com IA sem quebrar o jogo",
    ],
  },
  {
    slug: "producao-textual",
    name: "Produção Textual",
    pitch:
      "Escrever por partes até o texto inteiro: a tese, a introdução, os argumentos e a conclusão, conferindo a forma e a língua a cada etapa.",
    lessons: [
      "O que é um artigo de opinião",
      "A tese e a introdução",
      "Argumentos que convencem",
      "Contra-argumento e conclusão",
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
  questions: 632,
};
