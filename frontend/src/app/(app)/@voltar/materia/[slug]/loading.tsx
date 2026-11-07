import { BackPlaceholder } from "@/components/app/BackButton";

/*
| Sem isto, tocar numa matéria esperaria a resposta de `/subjects` antes de
| trocar de tela: o slot sem carregamento próprio segura a navegação inteira.
*/
export default function Loading() {
  return <BackPlaceholder />;
}
