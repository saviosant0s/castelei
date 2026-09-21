import { describe, expect, it } from "vitest";
import { CENTER, NODE, ROW, TAIL, buildTrail, trailHeight, trailPath, waveX } from "./lesson-trail";
import type { LessonSummary } from "./types";

function licao(position: number, module: string | null, attempts = 0): LessonSummary {
  return {
    id: position,
    title: `Lição ${position}`,
    position,
    module,
    questions_total: 8,
    questions_available: 8,
    attempts,
    best_percent: attempts > 0 ? 70 : null,
  };
}

describe("buildTrail — módulos", () => {
  it("agrupa lições seguidas com o mesmo nome", () => {
    const trilha = buildTrail([licao(1, "Fundamentos"), licao(2, "Fundamentos"), licao(3, "Processos")]);

    expect(trilha.map((m) => [m.name, m.total])).toEqual([
      ["Fundamentos", 2],
      ["Processos", 1],
    ]);
  });

  it("numera os módulos pela ordem, não pelo conteúdo", () => {
    const trilha = buildTrail([licao(1, "Fundamentos"), licao(2, "Processos"), licao(3, "Memória")]);

    expect(trilha.map((m) => m.number)).toEqual([1, 2, 3]);
  });

  it("abre um módulo novo quando o mesmo nome reaparece depois", () => {
    // A trilha segue a ordem de estudo. Puxar a lição 3 de volta para o
    // primeiro grupo a faria aparecer fora do lugar no caminho.
    const trilha = buildTrail([licao(1, "Memória"), licao(2, "Arquivos"), licao(3, "Memória")]);

    expect(trilha).toHaveLength(3);
    expect(trilha.map((m) => m.name)).toEqual(["Memória", "Arquivos", "Memória"]);
  });

  it("matéria sem módulos vira uma trilha só, sem nome e sem número", () => {
    const trilha = buildTrail([licao(1, null), licao(2, null)]);

    expect(trilha).toHaveLength(1);
    expect(trilha[0].name).toBeNull();
    expect(trilha[0].number).toBeNull();
    expect(trilha[0].total).toBe(2);
  });

  it("trata módulo em branco como ausência de módulo", () => {
    const trilha = buildTrail([licao(1, "   "), licao(2, null)]);

    expect(trilha).toHaveLength(1);
    expect(trilha[0].name).toBeNull();
  });
});

describe("buildTrail — estados", () => {
  it("a atual é a primeira ainda não praticada", () => {
    const trilha = buildTrail([licao(1, null, 2), licao(2, null), licao(3, null)]);

    expect(trilha[0].lessons.map((l) => l.state)).toEqual(["concluida", "atual", "adiante"]);
  });

  it("quem pulou uma lição é levado de volta ao buraco", () => {
    // A 3 está praticada, mas a atual continua sendo a 2: é onde o caminho
    // está aberto.
    const trilha = buildTrail([licao(1, null, 1), licao(2, null), licao(3, null, 1)]);

    expect(trilha[0].lessons.map((l) => l.state)).toEqual(["concluida", "atual", "concluida"]);
  });

  it("matéria inteira concluída não tem lição atual nem módulo à frente", () => {
    const trilha = buildTrail([licao(1, "Fundamentos", 1), licao(2, "Processos", 3)]);

    expect(trilha.flatMap((m) => m.lessons).every((l) => l.state === "concluida")).toBe(true);
    expect(trilha.some((m) => m.current || m.ahead)).toBe(false);
  });

  it("uma tentativa basta: a trilha não cobra nota", () => {
    const fraca = { ...licao(1, null, 1), best_percent: 20 };

    expect(buildTrail([fraca])[0].lessons[0].state).toBe("concluida");
  });

  it("marca o módulo atual e os que vêm depois", () => {
    const trilha = buildTrail([
      licao(1, "Fundamentos", 1),
      licao(2, "Processos"),
      licao(3, "Memória"),
      licao(4, "Arquivos"),
    ]);

    expect(trilha.map((m) => [m.current, m.ahead])).toEqual([
      [false, false],
      [true, false],
      [false, true],
      [false, true],
    ]);
  });

  it("conta o progresso de cada módulo", () => {
    const trilha = buildTrail([licao(1, "Fundamentos", 1), licao(2, "Fundamentos", 1), licao(3, "Fundamentos")]);

    expect(trilha[0].done).toBe(2);
    expect(trilha[0].total).toBe(3);
    expect(trilha[0].percent).toBe(67);
  });
});

describe("geometria do ziguezague", () => {
  it("a onda começa no eixo e volta a ele, sem repetir o mesmo lado seguido", () => {
    const onda = Array.from({ length: 8 }, (_, i) => waveX(i));

    expect(onda[0]).toBe(CENTER);
    expect(Math.max(...onda)).toBeLessThanOrEqual(100);
    expect(Math.min(...onda)).toBeGreaterThanOrEqual(0);
    // Uma onda inteira: metade de um lado, metade do outro.
    expect(onda.filter((x) => x > CENTER)).toHaveLength(3);
    expect(onda.filter((x) => x < CENTER)).toHaveLength(3);
  });

  it("a onda se repete a cada 8 nós, então o módulo pode ter o tamanho que for", () => {
    expect(waveX(8)).toBe(waveX(0));
    expect(waveX(30)).toBe(waveX(6));
  });

  it("a altura acomoda o primeiro nó, uma linha por lição seguinte e o título da última", () => {
    expect(trailHeight(1)).toBe(NODE + TAIL);
    expect(trailHeight(3)).toBe(NODE + 2 * ROW + TAIL);
  });

  it("sobra espaço embaixo do último nó para o rótulo não ser coberto", () => {
    // Sem a cauda, o cabeçalho do módulo seguinte sobe por cima do rótulo do
    // marco que fecha este.
    expect(trailHeight(4) - (NODE + 3 * ROW)).toBeGreaterThan(0);
  });

  it("a cauda é menor que o vão entre dois nós", () => {
    // O último nó é sempre o marco, de rótulo curto. Dimensionar pela lição
    // de título mais longo abria um buraco entre o troféu e o módulo seguinte.
    expect(TAIL).toBeLessThan(ROW - NODE);
  });

  it("não desenha caminho para um módulo de uma lição só", () => {
    expect(trailPath([50])).toBe("");
  });

  it("liga os nós com curvas, começando no centro do primeiro", () => {
    const d = trailPath([50, 64]);

    expect(d.startsWith(`M 50 ${NODE / 2}`)).toBe(true);
    expect(d).toContain("C");
    // Uma curva a menos que nós: o traço liga pares.
    expect(d.match(/C/g)).toHaveLength(1);
  });
});
