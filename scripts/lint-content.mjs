#!/usr/bin/env node
/**
 * Verifica o conteúdo das lições contra o Guia Editorial do Castelei (docs/planejamento.md).
 * Uso: node scripts/lint-content.mjs
 *
 * Regras que viram erro:
 *  - "Como vimos anteriormente" e parentes (a lição precisa ser autocontida);
 *  - frase com mais de 2 vírgulas (vírgula decimal e o que está entre parênteses não contam);
 *  - etapa com mais de 75 palavras de texto corrido;
 *  - termo técnico usado sem ter sido explicado antes (na própria etapa ou em etapa anterior).
 *    O jargão só é livre na etapa "Como cai na prova".
 * Regras estruturais: primeira etapa "idea", última "recap", uma "exam" e uma "pitfall".
 * Tabelas: todas as linhas com o mesmo número de colunas do cabeçalho.
 * Figuras: precisam de texto alternativo, legenda e de um arquivo existente em frontend/public.
 * Independência: o conteúdo nunca cita livros, autores, capítulos ou páginas (o app não depende de fonte nenhuma).
 * Avisos (não reprovam): frases com mais de 28 palavras e etapas com mais de 60 palavras.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "backend", "database", "seeders", "content");
const publicDir = join(root, "frontend", "public");

/*
| Sem argumento, confere o conteúdo publicado. Com um ou mais caminhos,
| confere só esses arquivos.
|
| Isso existe para o arquivo que AINDA NÃO foi importado. O painel tem a régua
| curta de propósito (erro × aviso), e a régua completa é esta aqui — mas ela
| só sabia olhar a pasta do seeder, ou seja, só o que já está publicado. Quem
| escreve uma matéria nova para importar pelo painel ficava sem conferência
| justamente no momento em que ela vale mais: antes de publicar.
*/
const alvos = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const arquivos = alvos.length
  ? alvos.map((arg) => resolve(process.cwd(), arg))
  : readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => join(dir, f));

// [nome legível, expressão que reconhece o termo no texto, matéria]
// m = Matemática, p = Português, s = Sistemas Operacionais
const JARGON = [
  ["equação", /\bequa(ç|c)(ão|ões)\b/i, "m"], ["incógnita", /\bincógnitas?\b/i, "m"], ["MMC", /\bMMC\b/, "m"],
  ["denominador", /\bdenominad(or|ores)\b/i, "m"], ["numerador", /\bnumerad(or|ores)\b/i, "m"], ["fator", /\bfato(r|res)\b/i, "m"],
  ["distributiva", /\bdistributiva\b/i, "m"], ["porcentagem", /\bporcentage(m|ns)\b/i, "m"],
  ["variação percentual", /\bvaria(ç|c)ão percentual\b/i, "m"], ["acréscimo", /\bacréscimos?\b/i, "m"],
  ["decréscimo", /\bdecréscimos?\b/i, "m"], ["sucessivos", /\bsucessivos?\b/i, "m"],

  ["preposição", /\bpreposi(ç|c)(ão|ões)\b/i, "p"], ["artigo", /\bartigos?\b/i, "p"],
  ["verbo", /\bverbos?\b/i, "p"], ["sujeito", /\bsujeitos?\b/i, "p"], ["núcleo", /\bnúcleos?\b/i, "p"], ["pronome", /\bpronomes?\b/i, "p"],
  ["substantivo", /\bsubstantivos?\b/i, "p"], ["adjetivo", /\badjetivos?\b/i, "p"], ["crase", /\bcrases?\b/i, "p"],
  ["acento grave", /\bacento grave\b/i, "p"], ["concordância", /\bconcord(â|a)ncia\b/i, "p"], ["locução", /\bloc(u|ú)(ç|c)(ão|ões)\b/i, "p"],
  ["adverbial", /\badverbial\b/i, "p"], ["impessoal", /\bimpessoa(l|is)\b/i, "p"], ["apassivador", /\bapassivador\b/i, "p"],
  ["paciente", /\bpaciente\b/i, "p"], ["posposto", /\bposposto\b/i, "p"], ["coletivo", /\bcoletivos?\b/i, "p"],
  ["transitivo", /\btransitivos?\b/i, "p"], ["numeral", /\bnumerais?\b/i, "p"], ["singular", /\bsingular\b/i, "p"],
  ["plural", /\bplural\b/i, "p"], ["norma-padrão", /\bnorma-padrão\b/i, "p"],

  ["processo", /\bprocessos?\b/i, "s"], ["espaço de endereçamento", /\bespa(ç|c)os? de endere(ç|c)amento\b/i, "s"],
  ["chamada de sistema", /\bchamadas? de sistema\b/i, "s"], ["núcleo (kernel)", /\bn(ú|u)cleo\b|\bkernel\b/i, "s"],
  ["modo usuário", /\bmodo usu(á|a)rio\b/i, "s"], ["TRAP", /\bTRAP\b/, "s"], ["driver", /\bdrivers?\b/i, "s"],
  ["abstração", /\babstra(ç|c)(ão|ões)\b/i, "s"], ["shell", /\bshell\b/i, "s"], ["diretório", /\bdiret(ó|o)rios?\b/i, "s"],
  ["descritor de arquivo", /\bdescritor(es)? de arquivo\b/i, "s"], ["tabela de processos", /\btabelas? de processos\b/i, "s"],
  ["memória virtual", /\bmem(ó|o)ria virtual\b/i, "s"], ["buffer", /\bbuffers?\b/i, "s"], ["biblioteca", /\bbibliotecas?\b/i, "s"],
  ["API", /\bAPI\b/], ["POSIX", /\bPOSIX\b/], ["sinal", /\bsinais\b|\bsinal\b/i, "s"], ["recurso", /\brecursos?\b/i, "s"],
  ["top-down", /\btop-down\b/i, "s"], ["bottom-up", /\bbottom-up\b/i, "s"], ["permissão", /\bpermiss(ão|ões)\b/i, "s"],
  ["máquina estendida", /\bmáquina estendida\b/i, "s"], ["gerenciador de recursos", /\bgerenciador de recursos\b/i, "s"],
  ["hardware", /\bhardware\b/i, "s"], ["software", /\bsoftware\b/i, "s"], ["processador", /\bprocessador(es)?\b/i, "s"],
  ["terminal", /\bterminal\b/i, "s"], ["comando", /\bcomandos?\b/i, "s"], ["prompt", /\bprompt\b/i, "s"],
  ["PowerShell", /\bpowershell\b/i, "s"], ["bash", /\bbash\b/i, "s"], ["cmd", /\bcmd\b/i, "s"], ["WSL", /\bWSL\b/, "s"],
  ["handle", /\bhandle\b/i, "s"], ["Win32", /\bwin32\b/i, "s"], ["strace", /\bstrace\b/i, "s"],

  /*
  | Os nomes que aparecem DENTRO do código (escopo "s").
  |
  | Queixa do Sávio, estudando a lição de chamadas de sistema: "você parte do
  | pressuposto que eu já entendo de código". Ele tinha razão, e o furo era
  | do verificador: `code.text` nunca passava por conferência nenhuma, então
  | `waitpid(pid, ...)` podia aparecer sem uma linha explicando o que é.
  |
  | Agora o código é conferido como qualquer outro texto. São nomes em inglês,
  | então a expressão não corre risco de casar com português comum.
  */
  ["fork", /\bfork\b/i, "s"], ["execve", /\bexecv[ep]?\b/i, "s"], ["waitpid", /\bwaitpid\b/i, "s"],
  ["exit", /\bexit\b/i, "s"], ["open", /\bopen\b/i, "s"], ["read", /\bread\b/i, "s"],
  ["write", /\bwrite\b/i, "s"], ["close", /\bclose\b/i, "s"], ["clone", /\bclone\b/i, "s"],
  ["PID", /\bPID\b|\bpid\b/, "s"], ["opção do open", /\bO_[A-Z]+\b/, "s"],
  ["chamada do Windows", /\b(CreateFile|ReadFile|WriteFile|CloseHandle|CreateProcess|WaitForSingleObject|ExitProcess|TerminateProcess|CreateDirectory|SetCurrentDirectory)\b/, "s"],
  ["down e up", /\bdown\(|\bup\(|\bdown e up\b/i, "s"], ["wait e signal", /\bwait\(|\bsignal\(|\bwait e signal\b/i, "s"],
  ["send e receive", /\bsend\(|\breceive\(|\bsend e receive\b/i, "s"], ["TSL", /\bTSL\b/, "s"],
  ["bit", /\bbits?\b/i, "s"], ["byte", /\bbytes?\b/i, "s"], ["variável", /\bvari(á|a)ve(l|is)\b/i, "s"],
  ["função", /\bfun(ç|c)(ão|ões)\b/i, "s"], ["laço", /\bla(ç|c)os?\b/i, "s"],

  /*
  | Servidores e infraestrutura (escopo "v").
  |
  | Esta lista nasceu de uma queixa concreta: a primeira lição do curso falava
  | de "requisição HTTP" e de "API" na etapa 3, e de DNS na etapa 5 — sendo que
  | DNS só seria explicado na lição 5. A regra de explicar todo termo na
  | estreia já existia; o que faltava era alguém conferir.
  |
  | O corte é "uma pessoa que nunca administrou um servidor saberia?". Por isso
  | entra "porta" (no sentido de rede, que não é o da porta de casa) e não
  | entra "recurso", que é palavra comum. Termo que entra aqui vira exigência:
  | ou tem bloco `terms` explicando antes, ou o curso não passa.
  */
  ["servidor", /\bservidor(es)?\b/i, "v"], ["VPS", /\bVPS\b/, "v"],
  ["cliente", /\bclientes?\b/i, "v"], ["requisição", /\brequisi(ç|c)(ão|ões)\b/i, "v"],
  ["hospedagem", /\bhospedage(m|ns)\b/i, "v"], ["datacenter", /\bdatacenters?\b/i, "v"],
  ["máquina virtual", /\bm(á|a)quinas? virtua(l|is)\b/i, "v"], ["virtualização", /\bvirtualiza(ç|c)ão\b/i, "v"],
  ["hipervisor", /\bhipervisor(es)?\b/i, "v"],

  ["protocolo", /\bprotocolos?\b/i, "v"], ["HTTP", /\bHTTPS?\b/, "v"],
  ["API", /\bAPIs?\b/, "v"], ["JSON", /\bJSON\b/, "v"],
  ["IP", /\bIPv?[46]?\b/, "v"], ["porta", /\bportas?\b/i, "v"], ["socket", /\bsockets?\b/i, "v"],
  ["pacote", /\bpacotes? de rede\b/i, "v"], ["TCP", /\bTCP\b/, "v"], ["UDP", /\bUDP\b/, "v"],
  ["DNS", /\bDNS\b/, "v"], ["domínio", /\bdom(í|i)nios?\b/i, "v"], ["registro DNS", /\b[Rr]egistros? (A|CNAME|MX|TXT)\b/, "v"],  // sem /i: "registro a partir de" não é registro A
  ["TTL", /\bTTL\b/, "v"], ["firewall", /\bfirewalls?\b/i, "v"],
  ["proxy reverso", /\bprox(y|ies) revers(o|os)\b/i, "v"], ["balanceador de carga", /\bbalanceador(es)? de carga\b/i, "v"],
  ["CDN", /\bCDN\b/, "v"], ["latência", /\blat(ê|e)ncia\b/i, "v"],

  ["TLS", /\bTLS\b|\bSSL\b/, "v"], ["certificado", /\bcertificados?\b/i, "v"],
  ["criptografia", /\bcriptografia\b|\bcriptografad(o|a)s?\b/i, "v"],
  ["chave pública", /\bchaves? p(ú|u)blicas?\b/i, "v"], ["chave privada", /\bchaves? privadas?\b/i, "v"],
  ["autoridade certificadora", /\bautoridades? certificadoras?\b/i, "v"],

  ["SSH", /\bSSH\b/, "v"], ["terminal", /\bterminal\b/i, "v"], ["shell", /\bshell\b/i, "v"],
  ["bash", /\bbash\b/i, "v"], ["PowerShell", /\bpowershell\b/i, "v"],
  ["root", /\broot\b/i, "v"], ["sudo", /\bsudo\b/i, "v"], ["permissão", /\bpermiss(ão|ões)\b/i, "v"],
  ["distribuição", /\bdistribui(ç|c)(ão|ões)\b/i, "v"], ["pacote (programa)", /\bgerenciador de pacotes\b/i, "v"],
  ["repositório", /\breposit(ó|o)rios?\b/i, "v"],

  ["processo", /\bprocessos?\b/i, "v"], ["serviço", /\bservi(ç|c)os?\b/i, "v"],
  ["daemon", /\bdaemons?\b/i, "v"], ["systemd", /\bsystemd\b|\bsystemctl\b/i, "v"],
  ["log", /\blogs?\b/i, "v"], ["métrica", /\bm(é|e)tricas?\b/i, "v"],

  ["partição", /\bparti(ç|c)(ão|ões)\b/i, "v"], ["ponto de montagem", /\bponto de montagem\b/i, "v"],  // o verbo "montar" é comum demais: "a página é montada" não é disco
  ["swap", /\bswap\b/i, "v"], ["inode", /\bi-?nodes?\b/i, "v"],

  ["servidor web", /\bservidor(es)? web\b/i, "v"], ["Nginx", /\bnginx\b/i, "v"], ["Apache", /\bapache\b/i, "v"],
  ["arquivo estático", /\barquivos? est(á|a)ticos?\b/i, "v"], ["host virtual", /\bhosts? virtua(l|is)\b|\bserver block\b/i, "v"],

  ["banco de dados", /\bbancos? de dados\b/i, "v"], ["SQL", /\bSQL\b/, "v"],
  ["PostgreSQL", /\bpostgres(ql)?\b/i, "v"], ["MySQL", /\bmysql\b|\bmariadb\b/i, "v"],
  ["índice (banco)", /\b(í|i)ndices? do banco\b/i, "v"],

  ["deploy", /\bdeploys?\b/i, "v"], ["contêiner", /\bcont(ê|e)iner(es)?\b|\bcontainers?\b/i, "v"],
  ["Docker", /\bdocker\b/i, "v"], ["imagem (contêiner)", /\bimagens? de cont(ê|e)iner\b/i, "v"],
  ["volume", /\bvolumes?\b/i, "v"], ["orquestrador", /\borquestrador(es)?\b|\bkubernetes\b/i, "v"],

  ["Git", /\bgit\b/i, "v"], ["CI/CD", /\bCI\/CD\b|\bintegra(ç|c)ão cont(í|i)nua\b/i, "v"],
  ["backup", /\bbackups?\b/i, "v"], ["cache", /\bcaches?\b/i, "v"],
  ["alta disponibilidade", /\balta disponibilidade\b/i, "v"],

  /*
  | Refatoração (escopo "r").
  |
  | A matéria nasceu para quem vai DIRIGIR uma refatoração feita por IA sem
  | escrever o código: precisa entender o que está pedindo e o que está
  | aprovando. O corte é "quem nunca programou em Java saberia?". Por isso
  | entram "método", "classe" e "commit", e não entra "código", que a pessoa
  | já usa no dia a dia do curso. "Refatorar" entra de propósito: é a palavra
  | que dá nome a tudo, e a lição que a usa diz o que ela é.
  */
  ["refatorar", /\brefator(ar|a|ação|ações|ado|ada|ando)\b/i, "r"],
  ["dívida técnica", /\bd(í|i)vidas? t(é|e)cnicas?\b/i, "r"], ["cheiro de código", /\bcheiros? de c(ó|o)digo\b/i, "r"],
  ["método", /\bm(é|e)todos?\b/i, "r"], ["classe", /\bclasses?\b/i, "r"], ["objeto", /\bobjetos?\b/i, "r"],
  ["atributo", /\batributos?\b/i, "r"], ["parâmetro", /\bpar(â|a)metros?\b/i, "r"],
  ["constante", /\bconstantes?\b/i, "r"], ["variável", /\bvari(á|a)ve(l|is)\b/i, "r"],
  ["herança", /\bheran(ç|c)a\b/i, "r"], ["polimorfismo", /\bpolimorfismo\b/i, "r"],
  ["encapsular", /\bencapsula(r|mento|do|da)\b/i, "r"], ["compilar", /\bcompila(r|dor|ção|do|da)\b/i, "r"],
  ["teste automatizado", /\btestes? automatizados?\b/i, "r"], ["teste de caracterização", /\btestes? de caracteriza(ç|c)(ão|ões)\b/i, "r"],
  ["Git", /\bgit\b/i, "r"], ["commit", /\bcommits?\b/i, "r"], ["branch", /\bbranch(es)?\b/i, "r"],
  ["diff", /\bdiffs?\b/i, "r"], ["pull request", /\bpull requests?\b/i, "r"],
  ["laço do jogo", /\bla(ç|c)o do jogo\b|\bgame loop\b/i, "r"], ["frame", /\bframes?\b/i, "r"], ["FPS", /\bFPS\b/, "r"],
  ["profiler", /\bprofilers?\b/i, "r"], ["coletor de lixo", /\bcoletor de lixo\b|\bgarbage collector\b/i, "r"],
  ["thread", /\bthreads?\b/i, "r"], ["JVM", /\bJVM\b/, "r"], ["static", /\bstatic\b/, "r"], ["switch", /\bswitch\b/, "r"],
  ["desserialização", /\b(des)?serializa(r|ção|ções|do|da)\b/i, "r"], ["biblioteca", /\bbibliotecas?\b/i, "r"],
  ["vulnerabilidade", /\bvulnerabilidades?\b/i, "r"], ["exceção", /\bexce(ç|c)(ão|ões)\b/i, "r"],
  ["sprite", /\bsprites?\b/i, "r"], ["JSON", /\bJSON\b/, "r"], ["máquina de estados", /\bm(á|a)quinas? de estados?\b/i, "r"],
  /*
  | Produção Textual. O corte é "quem nunca estudou redação saberia?".
  | "Argumento" fica de fora: todo mundo usa a palavra, e a lição a afina sem
  | precisar de verbete. "Tese" entra porque, no dia a dia, tese é trabalho de
  | doutorado — e aqui ela é uma frase.
  */
  ["tese", /\bteses?\b/i, "t"], ["contra-argumento", /\bcontra-?argument(o|os|ação|ar)\b/i, "t"],
  ["gênero textual", /\bg(ê|e)neros? textua(l|is)\b/i, "t"], ["tópico frasal", /\bt(ó|o)picos? frasa(l|is)\b/i, "t"],
  ["conectivo", /\bconectivos?\b/i, "t"], ["coesão", /\bcoes(ão|o|a)\b/i, "t"],
  ["coerência", /\bcoer(ê|e)ncia\b|\bcoerentes?\b/i, "t"], ["concessão", /\bconcess(ão|ões|ivo|iva)\b/i, "t"],
  ["refutação", /\brefuta(ção|ções|r)\b/i, "t"], ["repertório", /\brepert(ó|o)rio\b/i, "t"],
  ["norma-padrão", /\bnorma[- ]padr(ã|a)o\b/i, "t"],
].map(([name, re, scope]) => [name, re, scope ?? "s"]);

const SCOPE_BY_SUBJECT = { "matematica-basica": "m", portugues: "p", "sistemas-operacionais": "s", "servidores-vps": "v", refatoracao: "r", "producao-textual": "t" };
// O Castelei é independente: nada de "o livro diz", autores, capítulos ou páginas.
const SOURCE_REF = /segundo o livro|o livro (conta|diz|chama|lembra|observa|explica|dá|mostra|traz)|livro-texto|tanenbaum|para ler no livro|\bcap\.? ?\d|\bseção \d|\bp\. ?\d/i;
const FORBIDDEN = /como vimos|anteriormente|na aula passada|conforme visto|j(á|a) vimos/i;
const KINDS = new Set(["idea", "explain", "exam", "pitfall", "recap"]);

const errors = [];
const warnings = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const sentences = (text) => text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
const commas = (s) => (s.replace(/\([^)]*\)/g, "").replace(/(\d),(\d)/g, "$1$2").match(/,/g) ?? []).length;

function checkProse(where, text) {
  if (SOURCE_REF.test(text)) fail(where, `cita livro ou fonte (“${text.match(SOURCE_REF)[0]}”): o app é independente`);
  if (FORBIDDEN.test(text)) fail(where, `contém expressão proibida (“${text.match(FORBIDDEN)[0]}”)`);
  for (const s of sentences(text)) {
    if (commas(s) > 2) fail(where, `frase com ${commas(s)} vírgulas: “${s.slice(0, 70)}…”`);
    else if (words(s) > 28) warn(where, `frase longa (${words(s)} palavras): “${s.slice(0, 60)}…”`);
  }
}

/** Marca como explicados os termos técnicos que aparecem numa definição. */
function defineTerms(terms, defined, jargon) {
  for (const t of terms ?? []) {
    for (const [name, re] of jargon) if (re.test(t.word)) defined.add(name);
  }
}

function checkJargon(where, text, defined, jargon) {
  for (const [name, re] of jargon) {
    if (re.test(text) && !defined.has(name)) fail(where, `usa “${name}” sem explicar antes`);
  }
}

/*
| Os módulos da trilha (o campo `module` da lição).
|
| A tela da matéria agrupa lições SEGUIDAS com o mesmo nome. Duas coisas
| estragam isso, e nenhuma quebra o app — por isso são avisos, não erros:
| uma lição sem módulo no meio de uma matéria que usa módulos abre um bloco
| sem título, e um nome que reaparece depois de outro abre um segundo módulo
| com o mesmo nome. Em ambos os casos a culpa é do arquivo, não da tela.
*/
/*
| Lição que é só texto corrido.
|
| A regra nasceu de um caso real: um curso inteiro escrito pelo painel saiu sem
| uma figura, uma tabela ou um exemplo em lição nenhuma. O conteúdo estava
| certo; a tela era um paredão de parágrafo.
|
| O app se propõe a explicar para quem parte do zero, e quem parte do zero
| precisa de algo para olhar. É AVISO, não erro: existe lição legitimamente só
| de texto, e forma não reprova conteúdo.
|
| `bullets` e `terms` contam — lista de itens e caixa de palavras novas já
| quebram o paredão, mesmo não sendo imagem.
*/
const BLOCOS_DE_APOIO = ["figure", "video", "table", "code", "example", "bullets", "terms"];

function checkVisuals(L, steps) {
  if (steps.length === 0) return;

  const comApoio = steps.filter((s) => BLOCOS_DE_APOIO.some((b) => s[b]?.length !== 0 && s[b])).length;

  if (comApoio === 0) {
    warn(L, `só texto corrido: nenhuma das ${steps.length} etapas tem figura, tabela, exemplo, código, vídeo, lista ou glossário`);
    return;
  }

  // Um terço das etapas é o piso: abaixo disso ainda lê como paredão.
  if (steps.length >= 6 && comApoio * 3 < steps.length) {
    warn(L, `só ${comApoio} de ${steps.length} etapas têm algo além de parágrafo; ainda lê como texto corrido`);
  }
}

function checkModules(subject) {
  const modules = subject.lessons.map((lesson) => lesson.module?.trim() || null);
  const named = modules.filter(Boolean);

  if (named.length === 0) return; // matéria curta sem módulos: combinado

  const S = subject.name;

  if (named.length < modules.length) {
    const soltas = subject.lessons.filter((l) => !(l.module?.trim())).map((l) => l.slug);
    warn(S, `usa módulos, mas ${soltas.length} lição(ões) estão sem: ${soltas.join(", ")}`);
  }

  // Blocos: onde o nome muda, começa outro módulo.
  const blocos = modules.filter((nome, i) => i === 0 || nome !== modules[i - 1]);
  const repetidos = blocos.filter((nome, i) => nome && blocos.indexOf(nome) !== i);

  for (const nome of new Set(repetidos)) {
    warn(S, `o módulo “${nome}” aparece em dois trechos separados; junte as lições ou troque um dos nomes`);
  }
}

let lessonCount = 0, stepCount = 0, questionCount = 0;

for (const file of arquivos) {
  const subject = JSON.parse(readFileSync(file, "utf8"));
  const jargon = JARGON.filter(([, , scope]) => scope === SCOPE_BY_SUBJECT[subject.slug]);
  checkModules(subject);
  for (const lesson of subject.lessons) {
    lessonCount++;
    const L = `${subject.name} › ${lesson.title}`;
    const steps = lesson.steps ?? [];
    if (steps.length < 6) fail(L, `poucas etapas (${steps.length}); use pelo menos 6`);
    if (steps[0]?.kind !== "idea") fail(L, "a primeira etapa deve ser “idea” (analogia antes de definição)");
    if (steps.at(-1)?.kind !== "recap") fail(L, "a última etapa deve ser “recap” (resumo em 1 minuto)");
    for (const k of ["exam", "pitfall"]) {
      if (steps.filter((s) => s.kind === k).length !== 1) fail(L, `deve haver exatamente uma etapa “${k}”`);
    }
    checkProse(`${L} › resumo`, lesson.summary ?? "");
    checkVisuals(L, steps);

    const defined = new Set();
    // glossário da lição inteira: vale para as explicações das questões
    const lessonTerms = new Set();
    steps.forEach((s) => defineTerms(s.terms, lessonTerms, jargon));

    steps.forEach((step, i) => {
      stepCount++;
      const W = `${L} › etapa ${i + 1} “${step.title}”`;
      if (!KINDS.has(step.kind)) fail(W, `tipo inválido “${step.kind}”`);
      if (!step.title || !step.body?.length) fail(W, "precisa de título e de pelo menos um parágrafo");
      defineTerms(step.terms, defined, jargon);

      const prose = [...(step.body ?? []), ...(step.bullets ?? []), ...(step.terms ?? []).map((t) => t.meaning), ...(step.code?.notes ?? [])];
      prose.forEach((p) => checkProse(W, p));

      if (step.figure) {
        const f = step.figure;
        if (!f.alt || f.alt.length < 20) fail(W, "a figura precisa de texto alternativo descritivo (mínimo 20 caracteres)");
        if (!f.caption) warn(W, "figura sem legenda");
        if (!f.src?.startsWith("/figuras/") || !existsSync(join(publicDir, f.src))) fail(W, `arquivo da figura não encontrado: ${f.src}`);
        if (f.caption) checkProse(`${W} (legenda)`, f.caption);
        if (SOURCE_REF.test(f.alt ?? "")) fail(W, "o texto alternativo cita livro ou fonte");
      }
      if (step.code && !String(step.code.text ?? "").trim()) fail(W, "bloco de código vazio");
      /*
      | Uma tradução por linha de código.
      |
      | "As linhas de código, você parte do pressuposto que eu já entendo de
      | código" — e estava certo: o bloco entrava na tela em fonte de máquina,
      | sem uma palavra sobre o que cada linha faz. Quem já programa lê; quem
      | não programa vê um paredão preto e pula.
      |
      | A nota não é comentário DENTRO do código: comentário sai em fonte de
      | máquina, some na rolagem lateral e não passa por conferência nenhuma.
      | Linha em branco não conta — ela é respiro, não instrução.
      */
      if (step.code && String(step.code.text ?? "").trim()) {
        const linhas = String(step.code.text).split("\n").filter((l) => l.trim());
        const notas = step.code.notes ?? [];
        if (notas.length !== linhas.length) {
          fail(W, `o código tem ${linhas.length} linha(s) e ${notas.length} nota(s): escreva uma tradução por linha`);
        }
      }
      let tableText = "";
      if (step.table) {
        const t = step.table;
        if (!t.headers?.length || !t.rows?.length) fail(W, "a tabela precisa de cabeçalhos e de linhas");
        (t.rows ?? []).forEach((row, i) => {
          if (row.length !== (t.headers ?? []).length) fail(W, `linha ${i + 1} da tabela tem ${row.length} colunas; o cabeçalho tem ${(t.headers ?? []).length}`);
        });
        const allCells = [t.label ?? "", ...(t.headers ?? []), ...(t.rows ?? []).flat()].join(" \n ");
        if (SOURCE_REF.test(allCells)) fail(W, "a tabela cita livro ou fonte");
        // Em tabelas de comandos, as colunas de código não entram na conferência de jargão.
        tableText = [t.label ?? "", ...(t.headers ?? []), ...(t.rows ?? []).map((r) => (t.mono ? r[0] : r.join(" ")))].join(" \n ");
      }

      const bodyWords = (step.body ?? []).reduce((n, p) => n + words(p), 0);
      if (bodyWords > 75) fail(W, `texto corrido demais (${bodyWords} palavras; máximo 75)`);
      else if (bodyWords > 60) warn(W, `texto corrido longo (${bodyWords} palavras)`);

      if (step.kind !== "exam") {
        const all = [step.title, ...prose, step.example?.label ?? "", ...(step.example?.lines ?? []), step.figure?.caption ?? "", tableText, step.code?.label ?? "", step.code?.text ?? ""].join(" \n ");
        checkJargon(W, all, defined, jargon);
      }
    });

    lesson.questions.forEach((q, i) => {
      questionCount++;
      const W = `${L} › questão ${i + 1}`;
      checkProse(`${W} (enunciado)`, q.statement ?? "");
      (q.options ?? []).forEach((o) => checkProse(`${W} (alternativa)`, o));

      /*
      | A questão de ordenar.
      |
      | O gabarito dela é a PRÓPRIA lista de opções, escrita na ordem certa —
      | o app embaralha na hora de mostrar. Duas armadilhas de quem escreve:
      | pôr um `correct_index` (que não quer dizer nada aqui, e sugere que a
      | resposta é uma alternativa), e escrever a ordem já embaralhada,
      | achando que o arquivo é o que a pessoa vai ver.
      */
      if (q.format && !["choice", "order", "match", "writing"].includes(q.format)) {
        fail(W, `formato inválido “${q.format}”: use “choice”, “order”, “match” ou “writing”`);
      }
      if (q.exam_only && q.format !== "writing") fail(W, "só a questão de escrita pode ser exclusiva do simulado");
      /*
      | A questão de escrita.
      |
      | Não tem alternativa nem gabarito. Tem o roteiro do que escrever, a
      | lista com que a pessoa se avalia e um texto-modelo. Os três passam
      | pela mesma régua de frase das etapas — o modelo, principalmente: ele
      | é o exemplo de escrita que a pessoa vai imitar, e frase com quatro
      | vírgulas ensinaria justo o que a lição manda evitar.
      */
      if (q.format === "writing") {
        const w = q.writing ?? {};
        if (q.options?.length) fail(W, "questão de escrita não tem alternativas: tire o options");
        if (q.correct_index !== undefined) fail(W, "questão de escrita não tem gabarito: tire o correct_index");
        if (!w.steps?.length) fail(W, "a questão de escrita precisa do roteiro (writing.steps)");
        if (!w.checklist?.length) fail(W, "a questão de escrita precisa dos critérios (writing.checklist)");
        if (!String(w.model ?? "").trim()) fail(W, "a questão de escrita precisa de um texto-modelo (writing.model)");
        if (!(w.max_chars > (w.min_chars ?? 0))) fail(W, "o tamanho máximo precisa ser maior que o mínimo");
        [...(w.steps ?? []), ...(w.checklist ?? [])].forEach((t) => checkProse(`${W} (roteiro)`, t));
        String(w.model ?? "").split(/\n+/).forEach((t) => checkProse(`${W} (modelo)`, t));
        checkJargon(`${W} (roteiro)`, [...(w.steps ?? []), ...(w.checklist ?? [])].join(" \n "), lessonTerms, jargon);
      }
      /*
      | A questão de associar.
      |
      | Ela não tem alternativas: tem DUPLAS, e o app embaralha a coluna da
      | direita. Item repetido de um lado torna a questão impossível de
      | acertar com certeza, porque o app só conhece um gabarito.
      */
      if (q.format === "match") {
        const pares = q.pairs ?? [];
        if (q.options) fail(W, "questão de associar não tem alternativas: tire o options");
        if (q.correct_index !== undefined) fail(W, "questão de associar não tem alternativa certa: tire o correct_index");
        if (pares.length < 3) fail(W, "questão de associar precisa de pelo menos três pares");
        if (pares.length > 5) warn(W, `questão de associar com ${pares.length} pares: acima de cinco não cabe na tela`);
        for (const lado of ["left", "right"]) {
          const valores = pares.map((p) => (p[lado] ?? "").trim());
          if (new Set(valores).size !== valores.length) fail(W, `há itens repetidos na coluna da ${lado === "left" ? "esquerda" : "direita"}`);
          valores.forEach((v) => checkProse(`${W} (par)`, v));
        }
      }
      if (q.format === "order") {
        if (q.correct_index !== undefined) fail(W, "questão de ordenar não tem alternativa certa: tire o correct_index");
        if ((q.options ?? []).length < 3) fail(W, "questão de ordenar precisa de pelo menos três passos");
        if ((q.options ?? []).length > 6) warn(W, `questão de ordenar com ${q.options.length} passos: acima de seis vira paciência`);
      }
      const pares = (q.pairs ?? []).flatMap((p) => [p.left ?? "", p.right ?? ""]).join(" \n ");
      if (pares) checkJargon(`${W} (par)`, pares, lessonTerms, jargon);

      for (const field of ["explanation", "pitfall"]) {
        checkProse(`${W} (${field})`, q[field] ?? "");
        checkJargon(`${W} (${field})`, q[field] ?? "", lessonTerms, jargon);
      }
    });
  }
}

console.log(`Conteúdo verificado: ${lessonCount} lições, ${stepCount} etapas, ${questionCount} questões.`);
if (warnings.length) {
  console.log(`\n${warnings.length} aviso(s):`);
  warnings.forEach((w) => console.log("  ~ " + w));
}
if (errors.length) {
  console.log(`\n${errors.length} problema(s) contra o Guia Editorial:`);
  errors.forEach((e) => console.log("  ✗ " + e));
  process.exit(1);
}
console.log("\n✓ Nenhum problema encontrado contra o Guia Editorial.");
