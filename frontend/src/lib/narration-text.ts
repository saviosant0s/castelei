import type { LessonStep } from "./types";

/*
| Narração da lição.
|
| O áudio é gravado UMA vez, fora do app (`scripts/narrar.py`), e servido como
| arquivo estático de `public/narracao/`. Ouvir não custa nada a ninguém, e
| funciona sem internet como o resto da lição.
|
| O nome do arquivo é o resumo do TEXTO narrado, não o número da etapa. Assim
| o áudio nunca descasa do texto: quem edita a etapa no painel muda o resumo,
| o arquivo antigo deixa de ser encontrado e o botão some até alguém gravar
| de novo. Áudio lendo um parágrafo que já não está na tela seria pior que
| áudio nenhum.
|
| Este arquivo é a ÚNICA definição do que se lê. O script de gravação
| (`scripts/narracao-textos.mjs`) importa daqui, para as duas pontas nunca
| discordarem — e por isso ele não importa nada além de tipos: o Node roda
| este arquivo direto, sem o empacotador do Next.
*/

function clean(text: string): string {
  return text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ponto final em toda linha: a voz faz a pausa no lugar certo. */
function sentence(text: string): string {
  const t = clean(text);
  return t === "" || /[.!?:]$/.test(t) ? t : `${t}.`;
}

/**
 * O que a voz lê de uma etapa.
 *
 * Código fica de fora: `waitpid(pid, ...)` em voz alta não ensina nada. A
 * tradução linha a linha que vem embaixo dele entra, porque é português.
 */
export function narrationText(step: LessonStep): string {
  const parts: string[] = [sentence(step.title)];
  parts.push(...step.body.map(sentence));

  if (step.figure?.caption) parts.push(sentence(`Na figura: ${step.figure.caption}`));

  if (step.example) {
    if (step.example.label) parts.push(sentence(step.example.label));
    step.example.lines.forEach((line, i) =>
      parts.push(sentence(step.example!.ordered ? `Passo ${i + 1}: ${line}` : line)),
    );
  }

  if (step.table) {
    const { label, headers, rows } = step.table;
    parts.push(sentence(label ? `Na tabela, ${label}` : "Na tabela"));
    for (const row of rows) {
      parts.push(
        row
          .map((cell, i) => (headers[i] ? `${clean(headers[i])}: ${clean(cell)}` : clean(cell)))
          .join(". ") + ".",
      );
    }
  }

  if (step.code?.notes?.length) {
    parts.push("No código, linha por linha.");
    parts.push(...step.code.notes.filter(Boolean).map(sentence));
  }

  for (const bullet of step.bullets ?? []) parts.push(sentence(bullet));

  if (step.terms?.length) {
    parts.push(step.terms.length === 1 ? "Palavra nova." : "Palavras novas.");
    parts.push(...step.terms.map((t) => sentence(`${t.word}: ${t.meaning}`)));
  }

  return parts.filter(Boolean).join("\n");
}

/** Resumo de 53 bits (cyrb53): curto para nome de arquivo, sem colisão nesta escala. */
export function narrationKey(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
