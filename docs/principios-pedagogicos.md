# Princípios pedagógicos do Castelei

O Castelei não segue um método único. Ele junta seis achados da pesquisa sobre
memória e aprendizagem, e cada um virou uma **regra que o app aplica**, quase
sempre de forma automática. Este documento liga cada princípio à regra e ao
lugar do código onde ela mora. A página pública que explica isso para quem
estuda é a seção "A ciência por trás do método", em `/como-funciona`.

Em outubro de 2026 o Sávio trouxe uma análise externa desses princípios
("Engenharia Cognitiva e Design Instrucional Algorítmico"). Ela confirmou a
base e apontou três melhorias, registradas no fim.

## O mapa

| Princípio | O que diz | Regra no Castelei | Onde mora |
|---|---|---|---|
| **Prática de recuperação** (Roediger e Karpicke, 2006) | Responder perguntas fixa mais que reler: 61% contra 40% de retenção depois de uma semana. | Toda lição termina em questões. A revisão abre o Modo Prova, nunca o texto. Errar mostra a explicação na hora. | `PracticeClient`, `ReviewController`, `docs/revisao-espacada.md` |
| **Carga cognitiva** (Sweller, 1988) | A memória de curto prazo dá conta de pouca coisa de cada vez. | Uma ideia por etapa; no máximo duas vírgulas por frase; no máximo 75 palavras de texto corrido por etapa; todo termo explicado na estreia, e guardado no vocabulário da matéria. | `scripts/lint-content.mjs`, `ContentValidator`, `Vocabulary` |
| **Dupla codificação** (Paivio) | Palavra e imagem entram por canais diferentes, e juntas fixam melhor. | Aviso para lição só de texto corrido (piso de um terço das etapas com tabela, exemplo, figura ou lista). A figura fica na mesma etapa do texto que ela explica. | `checkVisuals`, `ContentValidator::tooMuchProse`, `StepsEditor` |
| **Do concreto ao abstrato** (esmaecimento da concretude: Bruner; Fyfe, McNeil e Goldstone, 2014) | Começar pelo concreto e ir tirando os detalhes até a regra geral faz a regra ser entendida, e não só decorada. | Toda lição abre com uma etapa `idea` (analogia do dia a dia) e só depois define. | `lint-content.mjs` (primeira etapa `idea`) |
| **Repetição espaçada** (Cepeda e colegas, 2008) | O intervalo ideal entre revisões é uma fração do tempo até a prova, e essa fração cai quando a prova está longe. | A revisão é marcada sozinha a partir da data da prova da matéria, com a fração por horizonte. | `Support/Review/Spacing.php`, `config/castelei.php` → `review` |
| **Saber o assunto ≠ saber a prova** | A banca não testa só ignorância: ela explora leitura apressada com distratores feitos para isso. | Etapa “Como cai na prova” e etapa de pegadinhas em toda lição, separadas da explicação. Distratores seguem os quatro moldes do Guia Editorial. | `docs/planejamento.md` (Guia Editorial), `lint-content.mjs` |

## O que a análise externa acrescentou

1. **A fração da revisão espaçada cai com o horizonte.** O app usava 15% fixos.
   Isso acertava o semestre e errava as pontas: com a prova a um ano, a lição
   voltava em quase dois meses, quando o estudo indica cerca de quatro semanas.
   Agora a fração é de 30% a uma semana, 15% a dez semanas e 7,5% a um ano
   (`ratio_by_horizon`). **Feito.**
2. **Engenharia de distratores.** As pegadinhas já existiam por lição, mas não
   havia regra para escrever as alternativas erradas. O Guia Editorial ganhou
   os quatro moldes (palavra trocada, quantificador absoluto, parte pelo todo,
   inversão). Eles também definem o que é uma questão “difícil” nos níveis de
   dificuldade. **Feito no Guia; vale para as questões novas.**
3. **Efeito de reversão da especialização.** O apoio que ajuda quem está
   começando atrapalha quem já domina. Hoje o app já tem duas saídas para
   isso: “Ir às questões” no alto de toda lição, e a revisão que abre direto
   no Modo Prova. **Ideia para depois:** quando a lição estiver dominada (80%
   pelo critério do Progresso), oferecer as questões antes das etapas.

## O que a análise sugeriu e o Castelei não segue, de propósito

- **O algoritmo FSRS.** Ele resolve “lembrar para sempre”, sem data. O
  Castelei conhece a data da prova, e para prazo conhecido o resultado de
  Cepeda é direto. A crista do estudo é larga: precisão a mais não compra
  retenção. O porquê completo está em `docs/revisao-espacada.md`.
- **Tirar apoio visual de forma automática** conforme o acerto sobe. Mudar a
  lição sozinha confunde quem volta para revisar, e as duas saídas acima já
  deixam a pessoa pular o que não precisa.
