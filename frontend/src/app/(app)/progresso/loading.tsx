/*
| Sem este arquivo, trocar de aba faria o carregamento mais próximo ser o do
| app inteiro: o título e as próprias abas piscariam a cada toque. Aqui o
| esqueleto fica só embaixo das abas, que é o que de fato muda.
*/
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="space-y-4 animate-pulse">
      <div className="h-24 rounded-card bg-ink/10" />
      <div className="h-32 rounded-card bg-ink/10" />
      <div className="h-32 rounded-card bg-ink/10" />
    </div>
  );
}
