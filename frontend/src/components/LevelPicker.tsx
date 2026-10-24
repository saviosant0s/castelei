import Link from "next/link";
import { Lock } from "lucide-react";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/types";

/*
| Praticar por nível, no fim da lição.
|
| Só aparece quando a lição tem questões com nível. Para o Pro, cada nível
| é um atalho para a prática só dele (`?nivel=`). Para o grátis a escolha
| aparece, trancada, com o caminho para os planos: esconder seria fingir
| que a lição não tem mais nada.
*/
const ORDEM: Difficulty[] = ["facil", "media", "dificil"];

export function LevelPicker({
  lessonId,
  levels,
  canUse,
}: {
  lessonId: number;
  levels: Partial<Record<Difficulty, number>>;
  canUse: boolean;
}) {
  const niveis = ORDEM.filter((n) => (levels[n] ?? 0) > 0);
  if (niveis.length === 0) return null;

  return (
    <section aria-labelledby={`niveis-${lessonId}`} className="mt-8">
      <h2 id={`niveis-${lessonId}`} className="label-mono">
        Praticar por nível
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {niveis.map((n) =>
          canUse ? (
            <Link
              key={n}
              href={`/licao/${lessonId}/praticar?nivel=${n}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink/15 px-4 text-sm font-bold hover:bg-ink/5"
            >
              {DIFFICULTY_LABEL[n]}
              <span className="font-mono text-content-subtle">{levels[n]}</span>
            </Link>
          ) : (
            <span
              key={n}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink/10 px-4 text-sm font-bold text-content-subtle"
            >
              <Lock className="size-4" aria-hidden="true" />
              {DIFFICULTY_LABEL[n]}
            </span>
          ),
        )}
      </div>
      {!canUse && (
        <p className="mt-2 text-sm text-content-secondary">
          Os níveis fazem parte do plano Pro.{" "}
          <Link href="/planos" className="font-bold underline underline-offset-4">
            Ver planos
          </Link>
        </p>
      )}
    </section>
  );
}
