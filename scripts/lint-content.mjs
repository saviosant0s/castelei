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
 * Avisos (não reprovam): frases com mais de 28 palavras e etapas com mais de 60 palavras.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "backend", "database", "seeders", "content");

// [nome legível, expressão que reconhece o termo no texto]
const JARGON = [
  ["equação", /\bequa(ç|c)(ão|ões)\b/i], ["incógnita", /\bincógnitas?\b/i], ["MMC", /\bMMC\b/],
  ["denominador", /\bdenominad(or|ores)\b/i], ["numerador", /\bnumerad(or|ores)\b/i], ["fator", /\bfato(r|res)\b/i],
  ["distributiva", /\bdistributiva\b/i], ["preposição", /\bpreposi(ç|c)(ão|ões)\b/i], ["artigo", /\bartigos?\b/i],
  ["verbo", /\bverbos?\b/i], ["sujeito", /\bsujeitos?\b/i], ["núcleo", /\bnúcleos?\b/i], ["pronome", /\bpronomes?\b/i],
  ["substantivo", /\bsubstantivos?\b/i], ["adjetivo", /\badjetivos?\b/i], ["crase", /\bcrases?\b/i],
  ["acento grave", /\bacento grave\b/i], ["concordância", /\bconcord(â|a)ncia\b/i], ["locução", /\bloc(u|ú)(ç|c)(ão|ões)\b/i],
  ["adverbial", /\badverbial\b/i], ["impessoal", /\bimpessoa(l|is)\b/i], ["apassivador", /\bapassivador\b/i],
  ["paciente", /\bpaciente\b/i], ["posposto", /\bposposto\b/i], ["coletivo", /\bcoletivos?\b/i],
  ["transitivo", /\btransitivos?\b/i], ["numeral", /\bnumerais?\b/i], ["porcentagem", /\bporcentage(m|ns)\b/i],
  ["variação percentual", /\bvaria(ç|c)ão percentual\b/i], ["acréscimo", /\bacréscimos?\b/i], ["decréscimo", /\bdecréscimos?\b/i],
  ["sucessivos", /\bsucessivos?\b/i], ["singular", /\bsingular\b/i], ["plural", /\bplural\b/i], ["norma-padrão", /\bnorma-padrão\b/i],
];
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
  if (FORBIDDEN.test(text)) fail(where, `contém expressão proibida (“${text.match(FORBIDDEN)[0]}”)`);
  for (const s of sentences(text)) {
    if (commas(s) > 2) fail(where, `frase com ${commas(s)} vírgulas: “${s.slice(0, 70)}…”`);
    else if (words(s) > 28) warn(where, `frase longa (${words(s)} palavras): “${s.slice(0, 60)}…”`);
  }
}

/** Marca como explicados os termos técnicos que aparecem numa definição. */
function defineTerms(terms, defined) {
  for (const t of terms ?? []) {
    for (const [name, re] of JARGON) if (re.test(t.word)) defined.add(name);
  }
}

function checkJargon(where, text, defined) {
  for (const [name, re] of JARGON) {
    if (re.test(text) && !defined.has(name)) fail(where, `usa “${name}” sem explicar antes`);
  }
}

let lessonCount = 0, stepCount = 0, questionCount = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const subject = JSON.parse(readFileSync(join(dir, file), "utf8"));
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
    steps.forEach((s) => defineTerms(s.terms, lessonTerms));

    steps.forEach((step, i) => {
      stepCount++;
      const W = `${L} › etapa ${i + 1} “${step.title}”`;
      if (!KINDS.has(step.kind)) fail(W, `tipo inválido “${step.kind}”`);
      if (!step.title || !step.body?.length) fail(W, "precisa de título e de pelo menos um parágrafo");
      defineTerms(step.terms, defined);

      const prose = [...(step.body ?? []), ...(step.bullets ?? []), ...(step.terms ?? []).map((t) => t.meaning)];
      prose.forEach((p) => checkProse(W, p));

      const bodyWords = (step.body ?? []).reduce((n, p) => n + words(p), 0);
      if (bodyWords > 75) fail(W, `texto corrido demais (${bodyWords} palavras; máximo 75)`);
      else if (bodyWords > 60) warn(W, `texto corrido longo (${bodyWords} palavras)`);

      if (step.kind !== "exam") {
        const all = [step.title, ...prose, step.example?.label ?? "", ...(step.example?.lines ?? [])].join(" \n ");
        checkJargon(W, all, defined);
      }
    });

    lesson.questions.forEach((q, i) => {
      questionCount++;
      const W = `${L} › questão ${i + 1}`;
      for (const field of ["explanation", "pitfall"]) {
        checkProse(`${W} (${field})`, q[field] ?? "");
        checkJargon(`${W} (${field})`, q[field] ?? "", lessonTerms);
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
