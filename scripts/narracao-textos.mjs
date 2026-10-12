// Lista o que a voz vai ler em cada etapa, com o nome do arquivo de áudio.
//
// Uso: node scripts/narracao-textos.mjs licao1.json [licao2.json …] > textos.json
// Aceita a resposta de GET /api/lessons/{id} ({"lesson": …}), uma lição solta
// ou um arquivo de matéria ({"lessons": […]}). A gravação em si é do
// scripts/narrar.py, que lê esta lista.
//
// O texto sai de frontend/src/lib/narration-text.ts — a mesma função que a
// tela usa para achar o áudio. Duas implementações discordariam na primeira
// vírgula, e o botão sumiria sem ninguém saber por quê.
import { readFileSync } from "node:fs";
import { narrationKey, narrationText } from "../frontend/src/lib/narration-text.ts";

const out = [];
for (const file of process.argv.slice(2)) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const lessons = data.lessons ?? [data.lesson ?? data];
  for (const lesson of lessons) {
    for (const step of lesson.steps ?? []) {
      const text = narrationText(step);
      out.push({ key: narrationKey(text), lesson: lesson.title, step: step.title, text });
    }
  }
}
process.stdout.write(JSON.stringify(out, null, 1) + "\n");
