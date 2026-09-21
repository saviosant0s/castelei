import type { ContentIssue } from "@/lib/admin-types";

/**
 * A lista de problemas de um arquivo, com o endereço de cada um.
 *
 * O caminho vem primeiro e em fonte de código porque é ele que se procura: em
 * "lessons[12].questions[3].correct_index" está a lição 13 e a questão 4 — e é
 * assim que se acha o erro num arquivo grande sem ler o arquivo inteiro.
 */
export function IssueList({ issues, tipo }: { issues: ContentIssue[]; tipo: "erro" | "aviso" }) {
  if (issues.length === 0) return null;

  const cor = tipo === "erro" ? "border-brick/30 bg-brick-soft/40" : "border-coral/30 bg-coral-soft/40";

  return (
    <ul className={`space-y-2 rounded-card border ${cor} p-4`}>
      {issues.map((issue, index) => (
        <li key={`${issue.path}-${index}`} className="text-base">
          {issue.path && <code className="mr-2 font-mono text-sm text-content-subtle">{issue.path}</code>}
          {issue.message}
        </li>
      ))}
    </ul>
  );
}
