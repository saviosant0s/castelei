import { Award, BadgeCheck, Flame, Footprints, Layers, RotateCcw, Star, Zap } from "lucide-react";

/** Ícone de cada conquista. (Elementos escritos direto: o React não gosta de componentes escolhidos na hora de renderizar.) */
export function BadgeIcon({ badgeKey, className = "size-6" }: { badgeKey: string; className?: string }) {
  switch (badgeKey) {
    case "primeira-licao":
      return <Footprints className={className} aria-hidden="true" />;
    case "gabarito-limpo":
      return <BadgeCheck className={className} aria-hidden="true" />;
    case "virou-o-jogo":
      return <RotateCcw className={className} aria-hidden="true" />;
    case "recorde-de-tempo":
      return <Zap className={className} aria-hidden="true" />;
    case "duas-materias":
      return <Layers className={className} aria-hidden="true" />;
    default:
      if (badgeKey.startsWith("streak-")) return <Flame className={className} aria-hidden="true" />;
      if (badgeKey.startsWith("xp-")) return <Star className={className} aria-hidden="true" />;
      return <Award className={className} aria-hidden="true" />;
  }
}
