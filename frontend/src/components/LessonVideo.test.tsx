// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LessonVideo, youtubeId } from "./LessonVideo";

afterEach(cleanup);

/*
| Colar o link da barra de endereços é o que qualquer pessoa faz — e é
| justamente o endereço que não funciona dentro de um quadro. Se esta
| conversão quebrar, o vídeo some da lição sem erro nenhum na tela.
*/
describe("youtubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=abc123&t=90s", "abc123"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=abc123", "abc123"],
    ["https://www.youtube.com/embed/abc123", "abc123"],
    ["https://www.youtube.com/shorts/abc123", "abc123"],
  ])("reconhece %s", (url, id) => {
    expect(youtubeId(url)).toBe(id);
  });

  it.each([
    "https://exemplo.com/aula.mp4",
    "https://backend.up.railway.app/storage/midia/videos/aula-a1b2c3.mp4",
    "/figuras/so/estados.svg",
    "nem endereço é",
  ])("não confunde %s com YouTube", (url) => {
    expect(youtubeId(url)).toBeNull();
  });
});

describe("LessonVideo", () => {
  it("toca arquivo enviado pelo painel no próprio app", () => {
    const { container } = render(
      <LessonVideo video={{ src: "https://api.test/storage/midia/videos/aula.mp4", title: "Aula" }} />,
    );

    expect(container.querySelector("video")).toHaveProperty("src", "https://api.test/storage/midia/videos/aula.mp4");
    expect(container.querySelector("iframe")).toBeNull();
  });

  /* No domínio sem cookie: o app é de estudo e a política não promete rastrear. */
  it("incorpora o YouTube sem cookie de rastreio", () => {
    const { container } = render(<LessonVideo video={{ src: "https://youtu.be/abc123", title: "Aula" }} />);

    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(iframe?.getAttribute("title")).toBe("Aula");
  });

  it("mostra a legenda, e cai no título quando não há legenda", () => {
    const { rerender } = render(
      <LessonVideo video={{ src: "https://youtu.be/abc", title: "Aula", caption: "O que o vídeo mostra." }} />,
    );
    expect(screen.getByText("O que o vídeo mostra.")).toBeDefined();

    rerender(<LessonVideo video={{ src: "https://youtu.be/abc", title: "Só o título" }} />);
    expect(screen.getByText("Só o título")).toBeDefined();
  });
});
