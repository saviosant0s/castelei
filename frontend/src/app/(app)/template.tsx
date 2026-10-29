"use client";

import { motion, useReducedMotion } from "motion/react";

/*
| A troca de tela do app: a nova página aparece num fade curto, em vez de
| pular. É o que mais separa "app" de "site" — no site a página troca seca.
|
| Só opacidade, de propósito. Deslizar usaria `transform`, e um ancestral com
| transform muda o que `position: sticky` e `fixed` tomam como referência:
| o cabeçalho do módulo da trilha tremeria durante a animação.
*/
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const reduzir = useReducedMotion();

  return (
    <motion.div initial={{ opacity: reduzir ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
