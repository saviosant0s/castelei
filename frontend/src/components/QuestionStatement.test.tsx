// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QuestionStatement } from "./QuestionStatement";

describe("QuestionStatement", () => {
  afterEach(cleanup);

  it("enunciado de uma linha continua sendo só o título", () => {
    const { container } = render(<QuestionStatement statement="Quanto vale 2 + 2?" />);
    expect(screen.getByRole("heading", { name: "Quanto vale 2 + 2?" })).toBeTruthy();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("o que vem depois da primeira linha sai como código, com o recuo intacto", () => {
    const { container } = render(<QuestionStatement statement={'O que aparece?\nif x > 5:\n    print("grande")'} />);
    expect(screen.getByRole("heading", { name: "O que aparece?" })).toBeTruthy();
    expect(container.querySelector("pre")?.textContent).toBe('if x > 5:\n    print("grande")');
  });
});
