/* Segura o cabeçalho enquanto a lista carrega, para a tela não piscar vazia. */
export default function Loading() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label-mono">Vocabulário</p>
        <div className="mt-2 h-10 w-56 animate-pulse rounded-control bg-surface-sunken" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-control bg-surface-sunken" />
      </header>
      <ul className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="h-24 animate-pulse rounded-card bg-surface-sunken" />
        ))}
      </ul>
    </div>
  );
}
