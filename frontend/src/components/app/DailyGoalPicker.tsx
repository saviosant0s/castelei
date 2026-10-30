"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { putJson } from "@/lib/client";

const OPCOES = [
  { chave: "leve", xp: 60, nome: "Leve", frase: "3 acertos" },
  { chave: "normal", xp: 120, nome: "Normal", frase: "uma lição" },
  { chave: "puxada", xp: 240, nome: "Puxada", frase: "duas lições" },
] as const;

/*
| A meta do dia, no balão do anel (cabeçalho e tela inicial). Três opções e nada de número livre: com "5 XP" o
| anel encheria com meio acerto e deixaria de querer dizer alguma coisa.
| Cada opção diz o que ela é em lições, que é como a pessoa pensa o dia.
*/
export function DailyGoalPicker({ atual }: { atual: number }) {
  const router = useRouter();
  const [escolhida, setEscolhida] = useState(atual);
  const [salvando, setSalvando] = useState(false);

  async function escolher(chave: string, xp: number) {
    if (xp === escolhida || salvando) return;
    const antes = escolhida;
    setEscolhida(xp);
    setSalvando(true);
    try {
      await putJson("/api/me/daily-goal", { goal: chave });
      router.refresh();
    } catch {
      setEscolhida(antes);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div role="radiogroup" aria-label="Meta do dia" className="grid grid-cols-3 gap-1 rounded-pill bg-surface-sunken p-1">
      {OPCOES.map((o) => {
        const ativa = o.xp === escolhida;
        return (
          <button
            key={o.chave}
            type="button"
            role="radio"
            aria-checked={ativa}
            onClick={() => escolher(o.chave, o.xp)}
            className={`rounded-pill px-2 py-2 text-center transition ${ativa ? "bg-surface-raised shadow-lift" : "text-content-secondary"}`}
          >
            <span className="block text-sm font-bold">{o.nome}</span>
            <span className="block text-xs text-content-subtle">
              {o.xp} XP · {o.frase}
            </span>
          </button>
        );
      })}
    </div>
  );
}
