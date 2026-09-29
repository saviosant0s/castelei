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
    slug: "algebra-linear",
    name: "Álgebra Linear",
    pitch:
      "Vetores, matrizes e tensores explicados com setas e tabelas, até chegar ao jeito como um modelo de linguagem guarda o sentido das palavras.",
    lessons: [
      "O que é um vetor",
      "Somar vetores e multiplicar por um número",
      "Produto escalar: o quanto dois vetores concordam",
      "Norma, distância e semelhança entre vetores",
      "Matrizes: tabelas de números",
      "Somar matrizes e multiplicar por um número",
      "Multiplicação de matrizes: linha com coluna",
      "Determinante e matriz inversa",
      "Sistemas lineares escritos com matrizes",
      "Transformações lineares: a matriz como máquina",
      "Espaços vetoriais, base e dimensão",
      "Autovalores e autovetores",
      "Tensores e broadcasting",
      "Vetores que guardam significado",
    ],
  },
  {
    slug: "calculo",
    name: "Cálculo",
    pitch:
      "Derivada como velocímetro, gradiente como a seta da ladeira: o cálculo que uma rede neural usa para aprender, sem decoreba.",
    lessons: [
      "Funções: domínio, imagem e composição",
      "Limites: chegar cada vez mais perto",
      "Derivada: a rapidez da mudança num instante",
      "A derivada no desenho: a inclinação da tangente",
      "Regras de derivação: atalhos que evitam o limite",
      "Regra da cadeia: derivar funções em fila",
      "Derivadas parciais: mexer numa coisa de cada vez",
      "Gradiente: a seta que aponta para a subida",
      "Máximos e mínimos: achar o melhor valor",
      "Gradiente descendente: descer o morro em passinhos",
      "Taxa de aprendizado: o tamanho certo do passo",
    ],
  },
  {
    slug: "probabilidade-estatistica",
    name: "Probabilidade e Estatística",
    pitch:
      "Chance, média, desvio padrão e a curva do sino, até a máxima verossimilhança: a ideia com que um modelo de linguagem é treinado.",
    lessons: [
      "Probabilidade: medir a chance",
      "Probabilidade condicional: quando uma informação muda tudo",
      "Variáveis aleatórias e distribuições",
      "Esperança: o valor médio que se espera",
      "Média, mediana e moda: o centro dos dados",
      "Variância e desvio padrão: o quanto os dados se espalham",
      "Covariância e correlação: quando duas coisas andam juntas",
      "A distribuição normal: a curva do sino",
      "Logaritmos aplicados à probabilidade",
      "Verossimilhança e máxima verossimilhança",
    ],
  },
  {
    slug: "redes-neurais",
    name: "Redes Neurais",
    pitch:
      "Do neurônio à rede treinada, com cada conta à mostra: uma rede escrita do zero em Python e depois a mesma em PyTorch.",
    lessons: [
      "O neurônio artificial",
      "Funções de ativação: sigmoide, tanh, ReLU e GELU",
      "Regressão linear: a primeira máquina que aprende",
      "Regressão logística: prever sim ou não",
      "Camadas: entrada, ocultas e saída",
      "Softmax: transformar números em chances",
      "Funções de perda: MSE, entropia e entropia cruzada",
      "Retropropagação: o erro voltando pela rede",
      "Épocas, lotes e SGD: como o treino anda",
      "Otimizadores: momentum e Adam",
      "Overfitting e underfitting: decorar ou aprender",
      "Regularização, dropout e normalização",
      "Uma rede do zero, em NumPy",
      "A mesma rede, em PyTorch",
    ],
  },
  {
    slug: "llms-como-funcionam",
    name: "LLMs: do texto ao Transformer",
    pitch:
      "Como um modelo de linguagem lê e escreve: tokens, embeddings, atenção e o Transformer por dentro, até montar um mini-GPT.",
    lessons: [
      "Texto vira número: tokens, vocabulário e IDs",
      "Pedaços de palavra: BPE e SentencePiece",
      "Embeddings: cada token vira um vetor",
      "Parecido com parecido: similaridade entre embeddings",
      "Modelo de linguagem: prever o próximo token",
      "Contexto e geração, um token de cada vez",
      "Perplexidade e teacher forcing: medir e treinar",
      "A ideia da atenção: consulta, chave e valor",
      "Atenção por produto escalar, com escala",
      "Autoatenção e a máscara causal",
      "Várias cabeças: atenção multi-head",
      "Onde está cada palavra: codificação posicional",
      "O bloco do Transformer",
      "Codificador, decodificador e a família GPT",
      "Um mini-GPT em PyTorch",
    ],
  },
  {
    slug: "llms-na-pratica",
    name: "LLMs: treino, uso e limites",
    pitch:
      "Do treino à conversa: dados, ajuste fino, amostragem, quantização, RAG e ferramentas, e onde um modelo de linguagem erra.",
    lessons: [
      "Do texto ao lote: os dados de treino",
      "O laço de treino de um LLM",
      "Treinar um modelo pequeno de verdade",
      "Escala: por que modelos maiores aprendem mais",
      "Da previsão ao texto: guloso e busca em feixe",
      "Amostragem: temperatura, top-k e top-p",
      "KV cache: não refazer conta",
      "Ajuste fino: de modelo base a assistente",
      "Preferências: RLHF, modelo de recompensa e DPO",
      "LoRA, QLoRA e adaptadores",
      "Números em bits: FP32, BF16, INT8, INT4 e quantização",
      "GPU, VRAM e treino em muitas máquinas",
      "Prompt, saída estruturada e ferramentas",
      "RAG: buscar antes de responder",
      "Alucinação, viés e outros limites",
      "Medir um modelo: acurácia, precisão, revocação e F1",
      "Segurança: injeção de prompt e vazamento de dados",
    ],
  },
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
    slug: "programacao-python",
    name: "Programação com Python",
    pitch:
      "Programar do zero na linguagem da inteligência artificial, com cada linha de código traduzida para o português.",
    lessons: [
      "Programar e rodar o primeiro código",
      "Variáveis e tipos de dados",
      "Operadores: contas, comparações e lógica",
      "Condicionais: o programa que decide",
      "Laços: repetir sem copiar e colar",
      "Funções: dar nome a um pedaço de código",
      "Strings: trabalhando com texto",
      "Listas e arrays: muitos valores numa variável só",
      "Dicionários: achar pelo nome, não pela posição",
      "Estruturas de dados: tupla, conjunto, pilha e fila",
      "Recursão: a função que chama a si mesma",
      "Módulos e bibliotecas: usar código pronto",
      "Complexidade: quanto o programa demora quando cresce",
      "Programação orientada a objetos",
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
  questions: 1538,
};
