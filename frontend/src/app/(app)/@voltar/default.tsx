/*
| O slot do "voltar" do cabeçalho (ver `components/app/BackButton.tsx`).
|
| Toda tela do app tem uma página espelhada aqui, inclusive as de aba, que
| devolvem nada. Não é capricho: na navegação sem recarregar, o Next mantém
| a última página do slot quando a nova tela não tem espelho — o "voltar"
| da matéria continuaria no cabeçalho do Início. `voltar.test.ts` reprova
| tela sem espelho. Este `default` só vale para quem recarrega a página.
*/
export default function Voltar() {
  return null;
}
