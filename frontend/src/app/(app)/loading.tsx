export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-xl bg-ink/10" />
      <div className="h-36 rounded-3xl bg-ink/10" />
      <div className="h-24 rounded-3xl bg-ink/10" />
      <div className="h-24 rounded-3xl bg-ink/10" />
    </div>
  );
}
