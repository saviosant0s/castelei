/*
| O enunciado da questão, com código quando houver.
|
| A questão clássica de programação é “o que este trecho mostra?”, e o trecho
| precisa das quebras de linha e do recuo: no Python, o recuo É o programa.
| Num título comum, as quebras sumiam e o código virava uma linha só.
|
| A convenção é a mais simples possível para quem escreve: a primeira linha é
| a pergunta; o que vem depois da primeira quebra de linha é código, e sai no
| mesmo bloco escuro das lições. Enunciado de uma linha só não muda nada.
*/
export function QuestionStatement({ statement }: { statement: string }) {
  const quebra = statement.indexOf("\n");
  if (quebra === -1) return <h1 className="mt-3 text-2xl">{statement}</h1>;

  const pergunta = statement.slice(0, quebra);
  const trecho = statement.slice(quebra + 1);

  return (
    <>
      <h1 className="mt-3 text-2xl">{pergunta}</h1>
      <pre className="mt-4 overflow-x-auto whitespace-pre rounded-2xl bg-surface-bold p-4 font-mono text-sm leading-relaxed text-on-bold">
        <code>{trecho}</code>
      </pre>
    </>
  );
}
