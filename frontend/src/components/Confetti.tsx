const pieces = [
  { x: 6, delay: 0, color: "bg-coral", rot: 20 },
  { x: 14, delay: 120, color: "bg-sky", rot: -30 },
  { x: 22, delay: 60, color: "bg-sage", rot: 45 },
  { x: 30, delay: 200, color: "bg-coral", rot: -15 },
  { x: 38, delay: 30, color: "bg-ink", rot: 60 },
  { x: 46, delay: 160, color: "bg-sky", rot: -50 },
  { x: 54, delay: 90, color: "bg-sage", rot: 25 },
  { x: 62, delay: 240, color: "bg-coral", rot: -40 },
  { x: 70, delay: 20, color: "bg-sky", rot: 70 },
  { x: 78, delay: 140, color: "bg-ink", rot: -20 },
  { x: 86, delay: 70, color: "bg-sage", rot: 35 },
  { x: 93, delay: 190, color: "bg-coral", rot: -60 },
];

/** Confete só em CSS, para recordes e conquistas. Some para quem prefere menos movimento. */
export function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 overflow-hidden">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={`confetti-piece absolute top-0 h-3 w-2 rounded-[2px] ${piece.color}`}
          style={{ left: `${piece.x}%`, animationDelay: `${piece.delay}ms`, ["--rot" as string]: `${piece.rot}deg` }}
        />
      ))}
    </div>
  );
}
