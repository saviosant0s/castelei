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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "backend", "database", "seeders", "content");
const publicDir = join(root, "frontend", "public");

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
].map(([name, re, scope]) => [name, re, scope ?? "s"]);

const SCOPE_BY_SUBJECT = { "matematica-basica": "m", portugues: "p", "sistemas-operacionais": "s" };
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

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const subject = JSON.parse(readFileSync(join(dir, file), "utf8"));
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

      const prose = [...(step.body ?? []), ...(step.bullets ?? []), ...(step.terms ?? []).map((t) => t.meaning)];
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
        const all = [step.title, ...prose, step.example?.label ?? "", ...(step.example?.lines ?? []), step.figure?.caption ?? "", tableText].join(" \n ");
        checkJargon(W, all, defined, jargon);
      }
    });

    lesson.questions.forEach((q, i) => {
      questionCount++;
      const W = `${L} › questão ${i + 1}`;
      checkProse(`${W} (enunciado)`, q.statement ?? "");
      (q.options ?? []).forEach((o) => checkProse(`${W} (alternativa)`, o));
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
