import { Award, BadgeCheck, Flame, Footprints, Layers, RotateCcw, Star, Zap, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "primeira-licao": Footprints,
  "gabarito-limpo": BadgeCheck,
  "virou-o-jogo": RotateCcw,
  "recorde-de-tempo": Zap,
  "duas-materias": Layers,
};

export function badgeIcon(key: string): LucideIcon {
  if (icons[key]) return icons[key];
  if (key.startsWith("streak-")) return Flame;
  if (key.startsWith("xp-")) return Star;
  return Award;
}

export function BadgeIcon({ badgeKey, className = "size-6" }: { badgeKey: string; className?: string }) {
  const Icon = badgeIcon(badgeKey);
  return <Icon className={className} aria-hidden="true" />;
}
