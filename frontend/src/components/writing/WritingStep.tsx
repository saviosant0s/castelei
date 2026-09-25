"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, Bot, Check, CircleDashed, ClipboardCopy, FileText, Lightbulb, ListChecks, SkipForward, SpellCheck } from "lucide-react";
import { messageOf, postJson } from "@/lib/client";
import { aiPrompt, checkWriting, type WritingBrief } from "@/lib/writing";
import type { AnswerResult, LanguageIssue, PracticeQuestion, WritingCheckResponse, WritingReviewResponse } from "@/lib/types";

/*
| Uma parte do texto: escrever, conferir, comparar, se avaliar e entregar.
|
| A ordem é o método. Primeiro a pessoa escreve com o roteiro à vista — o
| "tem que ter tal coisa" do enunciado — e a forma é conferida enquanto ela
| digita. Só DEPOIS de conferir aparecem o texto-modelo e a lista de
| critérios: modelo mostrado antes vira texto copiado.
|
| Conferir não gasta a questão. Dá para corrigir, conferir de novo e só então
| entregar — reescrever é o exercício inteiro, e um botão que só aceita a
| primeira versão ensinaria o contrário.
|
| O rascunho mora no aparelho (`localStorage`), por parte. Texto é trabalho de
| minutos; perder tudo porque a tela recarregou é o tipo de coisa que faz
| alguém desistir de escrever no celular.
*/

type Question = PracticeQuestion & { writing: WritingBrief };

const RASCUNHO = (questionId: number) => `castelei:rascunho:${questionId}`;

function lerRascunho(questionId: number): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(RASCUNHO(questionId));
  } catch {
    return null;
  }
}

function guardarRascunho(questionId: number, texto: string) {
  try {
    if (texto.trim()) window.localStorage.setItem(RASCUNHO(questionId), texto);
    else window.localStorage.removeItem(RASCUNHO(questionId));
  } catch {
    // Sem armazenamento (aba anônima, cota cheia): o texto só não sobrevive a recarregar.
  }
}

const GRUPOS: Record<LanguageIssue["group"], string> = {
  ortografia: "Ortografia",
  pontuação: "Pontuação",
  gramática: "Gramática",
  estilo: "Estilo",
};

export function WritingStep({
  attemptId,
  question,
  phase,
  initialText,
  busy,
  feedback,
  onDeliver,
  onSkip,
}: {
  attemptId: number;
  question: Question;
  phase: "answering" | "feedback";
  /** Na etapa que junta as partes, as partes entregues; nas outras, vazio. */
  initialText: string;
  busy: boolean;
  feedback: AnswerResult | null;
  onDeliver: (text: string, checklist: boolean[]) => void;
  onSkip: () => void;
}) {
  const brief = question.writing;
  // O rascunho do aparelho vence o ponto de partida: é trabalho que a pessoa já fez.
  const [text, setText] = useState(() => lerRascunho(question.id) ?? initialText);
  const [check, setCheck] = useState<WritingCheckResponse | null>(null);
  /** O texto como estava na última conferência: diferente dele, a conferência envelheceu. */
  const [checkedText, setCheckedText] = useState<string | null>(null);
  const [issues, setIssues] = useState<LanguageIssue[]>([]);
  const [marks, setMarks] = useState<boolean[]>([]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ai, setAi] = useState<{ loading: boolean; feedback: string | null; error: string | null; remaining: number | null }>({
    loading: false,
    feedback: null,
    error: null,
    remaining: null,
  });
  const resultRef = useRef<HTMLDivElement>(null);

  const forma = useMemo(() => checkWriting(text, brief), [text, brief]);
  const envelheceu = checkedText !== null && checkedText !== text;
  const n = text.trim().length;
  const passou = n > brief.max_chars;
  const entregue = phase === "feedback";

  function escrever(valor: string) {
    setText(valor);
    guardarRascunho(question.id, valor);
  }

  async function conferir() {
    if (checking || !text.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const data = await postJson<WritingCheckResponse>(`/api/attempts/${attemptId}/writing/check`, {
        question_id: question.id,
        text,
      });
      setCheck(data);
      setIssues(data.language.issues);
      setCheckedText(text);
      // Conferir de novo não apaga a autoavaliação já feita.
      setMarks((antes) => data.checklist.map((_, i) => antes[i] ?? false));
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setChecking(false);
    }
  }

  /**
   * Troca o trecho pela sugestão. As posições dos apontamentos seguintes
   * andam junto, então a lista continua valendo sem conferir de novo.
   */
  function aplicar(issue: LanguageIssue, troca: string) {
    const novo = text.slice(0, issue.offset) + troca + text.slice(issue.offset + issue.length);
    const delta = troca.length - issue.length;
    setIssues((lista) =>
      lista
        .filter((i) => i !== issue)
        .map((i) => (i.offset > issue.offset ? { ...i, offset: i.offset + delta } : i)),
    );
    escrever(novo);
    setCheckedText(novo);
  }

  async function copiar() {
    const pedido = aiPrompt({
      statement: question.statement,
      steps: brief.steps,
      checklist: check?.checklist ?? [],
      text,
    });
    try {
      await navigator.clipboard.writeText(pedido);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      setError("Não deu para copiar automaticamente. Selecione o texto e copie à mão.");
    }
  }

  async function corrigirComIa() {
    setAi((a) => ({ ...a, loading: true, error: null }));
    try {
      const data = await postJson<WritingReviewResponse>(`/api/attempts/${attemptId}/writing/review`, {
        question_id: question.id,
        text,
      });
      setAi({ loading: false, feedback: data.feedback, error: null, remaining: data.remaining });
    } catch (e) {
      setAi((a) => ({ ...a, loading: false, error: messageOf(e) }));
    }
  }

  function entregar() {
    guardarRascunho(question.id, "");
    onDeliver(text, marks);
  }

  const pendentes = check ? check.checklist.filter((_, i) => !marks[i]) : [];

  return (
    <div className="mt-6 space-y-5">
      <section aria-labelledby={`roteiro-${question.id}`} className="rounded-card bg-surface-raised px-5 py-4 shadow-lift">
        <h2 id={`roteiro-${question.id}`} className="flex items-center gap-2 text-base font-bold">
          <ListChecks className="size-5 text-sky" aria-hidden="true" /> O que esta parte precisa ter
        </h2>
        <ol className="mt-2 space-y-1.5 text-base">
          {brief.steps.map((passo, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sky-soft font-mono text-xs font-medium text-sky">
                {i + 1}
              </span>
              <span>{passo}</span>
            </li>
          ))}
        </ol>
        {brief.assemble && (
          <p className="mt-3 text-sm text-content-secondary">
            Suas partes já estão na caixa, na ordem em que você escreveu. Agora é ligar um parágrafo ao outro.
          </p>
        )}
      </section>

      <div>
        <label htmlFor={`texto-${question.id}`} className="sr-only">
          Seu texto
        </label>
        <textarea
          id={`texto-${question.id}`}
          value={text}
          onChange={(e) => escrever(e.target.value)}
          readOnly={entregue}
          placeholder={brief.placeholder ?? "Escreva aqui…"}
          spellCheck
          lang="pt-BR"
          className={`block min-h-48 w-full resize-y rounded-card border-2 bg-surface-raised px-4 py-3.5 text-base leading-relaxed [field-sizing:content] focus-visible:outline-none ${
            passou ? "border-brick" : "border-ink/15 focus:border-sky"
          } ${entregue ? "opacity-80" : ""}`}
        />
        <p className={`mt-1.5 text-right font-mono text-sm tabular-nums ${passou ? "font-bold text-brick" : "text-content-subtle"}`} aria-live="polite">
          {n}/{brief.max_chars}
          {brief.min_chars > 0 && n < brief.min_chars ? ` · mínimo ${brief.min_chars}` : ""}
        </p>
      </div>

      {!entregue && (
        <section aria-labelledby={`forma-${question.id}`}>
          <h2 id={`forma-${question.id}`} className="label-mono">
            Conferência da forma
          </h2>
          <ul className="mt-2 space-y-1.5">
            {forma.map((c) => (
              <li key={c.id} className="flex gap-2.5 text-base">
                {c.ok ? (
                  <Check className="mt-0.5 size-5 shrink-0 text-sage" aria-label="Cumprido" />
                ) : c.detail ? (
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-coral" aria-label="Atenção" />
                ) : (
                  <CircleDashed className="mt-0.5 size-5 shrink-0 text-ink/30" aria-label="Ainda não" />
                )}
                <span>
                  <span className={c.ok ? "text-content-secondary" : ""}>{c.label}</span>
                  {c.detail && <span className="block text-sm text-content-secondary">{c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-brick-soft px-4 py-3 text-base text-brick">
          {error}
        </p>
      )}

      {check && (
        <div ref={resultRef} className="anim-rise scroll-mt-4 space-y-5">
          {envelheceu && !entregue && (
            <p className="rounded-2xl bg-sky-soft px-4 py-3 text-base">
              Você mudou o texto depois de conferir. Confira de novo para ver os apontamentos do texto novo.
            </p>
          )}

          <section aria-labelledby={`lingua-${question.id}`} className={envelheceu ? "opacity-60" : ""}>
            <h2 id={`lingua-${question.id}`} className="flex items-center gap-2 text-lg">
              <SpellCheck className="size-5 text-sky" aria-hidden="true" /> Ortografia e gramática
            </h2>
            {!check.language.available ? (
              <p className="mt-2 text-base text-content-secondary">
                O corretor ficou fora do ar agora. O resto da conferência continua valendo — tente de novo daqui a pouco.
              </p>
            ) : issues.length === 0 ? (
              <p className="mt-2 text-base text-content-secondary">
                O corretor não achou nada. Ele pega muita coisa, mas não tudo: leia uma vez em voz baixa antes de entregar.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {issues.map((issue, i) => {
                  const trecho = text.slice(issue.offset, issue.offset + issue.length);
                  const antes = text.slice(Math.max(0, issue.offset - 25), issue.offset);
                  const depois = text.slice(issue.offset + issue.length, issue.offset + issue.length + 25);
                  return (
                    <li key={`${issue.offset}-${i}`} className="rounded-2xl bg-surface-raised px-4 py-3 shadow-lift">
                      <p className="text-xs font-bold tracking-wide text-content-subtle uppercase">{GRUPOS[issue.group]}</p>
                      <p className="mt-1 text-base">
                        <span className="text-content-subtle">…{antes}</span>
                        <mark className="rounded bg-coral-soft px-0.5 font-bold text-content">{trecho}</mark>
                        <span className="text-content-subtle">{depois}…</span>
                      </p>
                      <p className="mt-1 text-sm text-content-secondary">{issue.message}</p>
                      {issue.replacements.length > 0 && !entregue && !envelheceu && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {issue.replacements.map((troca) => (
                            <button
                              key={troca}
                              type="button"
                              onClick={() => aplicar(issue, troca)}
                              className="rounded-pill border-2 border-sage/50 bg-sage-soft px-3 py-1 text-sm font-bold"
                            >
                              Trocar por “{troca}”
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {check.model && (
            <section aria-labelledby={`modelo-${question.id}`}>
              <h2 id={`modelo-${question.id}`} className="flex items-center gap-2 text-lg">
                <FileText className="size-5 text-sky" aria-hidden="true" /> Compare com um modelo
              </h2>
              <p className="mt-1 text-sm text-content-secondary">Um jeito de escrever esta parte, não o único. Repare no que ele faz, não nas palavras.</p>
              <blockquote className="mt-3 whitespace-pre-line rounded-2xl border-l-4 border-sky bg-surface-raised px-4 py-3 text-base leading-relaxed shadow-lift">
                {check.model}
              </blockquote>
            </section>
          )}

          {check.checklist.length > 0 && (
            <section aria-labelledby={`criterios-${question.id}`}>
              <h2 id={`criterios-${question.id}`} className="flex items-center gap-2 text-lg">
                <ListChecks className="size-5 text-sky" aria-hidden="true" /> Avalie o seu texto
              </h2>
              <p className="mt-1 text-sm text-content-secondary">Marque só o que o seu texto já faz. A parte conta como cumprida quando tudo estiver marcado.</p>
              <ul className="mt-3 space-y-2">
                {check.checklist.map((item, i) => (
                  <li key={i}>
                    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl bg-surface-raised px-4 py-3 shadow-lift">
                      <input
                        type="checkbox"
                        checked={marks[i] ?? false}
                        disabled={entregue}
                        onChange={(e) => setMarks((m) => check.checklist.map((_, j) => (j === i ? e.target.checked : (m[j] ?? false))))}
                        className="mt-0.5 size-5 shrink-0 accent-[var(--color-sage)]"
                      />
                      <span className="text-base">{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!entregue && (
            <section aria-labelledby={`ia-${question.id}`} className="rounded-2xl border-2 border-dashed border-ink/20 px-4 py-4">
              <h2 id={`ia-${question.id}`} className="flex items-center gap-2 text-base font-bold">
                <Bot className="size-5 text-sky" aria-hidden="true" /> Uma segunda opinião sobre o sentido
              </h2>
              <p className="mt-1 text-sm text-content-secondary">
                O corretor confere a língua; se a ideia se sustenta, só uma leitura atenta diz. Copie o pedido pronto, com a proposta e os critérios, e cole na IA que você já usa.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={copiar} className="btn btn-ghost border-2 border-ink/15">
                  <ClipboardCopy className="size-5" aria-hidden="true" /> {copied ? "Copiado!" : "Copiar para corrigir com IA"}
                </button>
                {check.ai && (
                  <button type="button" onClick={corrigirComIa} disabled={ai.loading} className="btn btn-primary">
                    <Bot className="size-5" aria-hidden="true" /> {ai.loading ? "Lendo o seu texto…" : "Corrigir com IA aqui"}
                  </button>
                )}
              </div>
              {copied && <p className="mt-2 text-sm text-content-secondary" role="status">Cole no ChatGPT, no Claude ou na IA que você preferir.</p>}
              {ai.error && <p role="alert" className="mt-3 text-sm text-brick">{ai.error}</p>}
              {ai.feedback && (
                <div className="mt-3 whitespace-pre-line rounded-2xl bg-sky-soft px-4 py-3 text-base leading-relaxed">
                  {ai.feedback}
                  {ai.remaining !== null && (
                    <p className="mt-2 text-sm text-content-secondary">Restam {ai.remaining} correções por IA hoje.</p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {entregue && feedback && (
        <div className="anim-rise space-y-4">
          <div className={`rounded-2xl px-5 py-4 ${feedback.is_correct ? "bg-sage-soft" : "bg-paper-2"}`}>
            <p className="font-display text-2xl font-bold">
              {feedback.is_correct ? "Parte cumprida!" : !text.trim() ? "Você pulou esta parte" : "Parte entregue"}
            </p>
            {!feedback.is_correct && text.trim() && pendentes.length > 0 && (
              <div className="mt-2 text-base">
                <p>Para a próxima vez, fique de olho em:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {pendentes.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-3 text-base leading-relaxed">{feedback.explanation}</p>
          </div>
          {feedback.pitfall && (
            <div className="rounded-2xl border-2 border-coral/40 bg-coral-soft px-5 py-4">
              <p className="flex items-center gap-2 font-bold">
                <Lightbulb className="size-5 text-coral" aria-hidden="true" /> Cuidado
              </p>
              <p className="mt-1.5 text-base leading-relaxed">{feedback.pitfall}</p>
            </div>
          )}
        </div>
      )}

      {!entregue && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-md gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {!check ? (
              <>
                <button type="button" className="btn btn-ghost border-2 border-ink/15" disabled={busy || checking} onClick={onSkip}>
                  <SkipForward className="size-5" aria-hidden="true" /> Pular
                </button>
                <button type="button" className="btn btn-primary flex-1" disabled={!text.trim() || passou || checking} onClick={conferir}>
                  {checking ? "Conferindo…" : passou ? "Passou do tamanho" : "Conferir"}
                </button>
              </>
            ) : (
              <>
                {envelheceu && (
                  <button type="button" className="btn btn-ghost border-2 border-ink/15" disabled={checking || passou} onClick={conferir}>
                    {checking ? "Conferindo…" : "Conferir de novo"}
                  </button>
                )}
                <button type="button" className="btn btn-primary flex-1" disabled={busy || !text.trim() || passou} onClick={entregar}>
                  {busy ? "Entregando…" : brief.assemble ? "Entregar o texto" : "Entregar esta parte"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
