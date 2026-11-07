"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cleanCode } from "@/lib/classrooms";

/** Digitar o código que o professor passou. A tela seguinte mostra de quem é a turma antes de entrar. */
export function JoinByCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const limpo = cleanCode(code);

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (limpo) router.push(`/turmas/entrar/${limpo}`);
      }}
    >
      <label htmlFor="codigo-turma" className="sr-only">
        Código da turma
      </label>
      <input
        id="codigo-turma"
        className="field min-w-0 flex-1 font-mono uppercase tracking-widest"
        placeholder="ABC-DEF"
        autoComplete="off"
        autoCapitalize="characters"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={12}
      />
      <button type="submit" className="btn btn-primary shrink-0 px-5" disabled={!limpo}>
        Entrar
      </button>
    </form>
  );
}
