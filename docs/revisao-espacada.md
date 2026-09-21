# Revisão espaçada no Castelei

Este documento existe porque a regra de agendamento é uma **decisão pedagógica**,
não uma escolha de implementação. Quem mexer nos números precisa saber de onde
eles vieram — e quando vale mudá-los.

O código correspondente:

- `backend/config/castelei.php`, bloco `review` — os números.
- `backend/app/Support/Review/Spacing.php` — a conta, sem banco.
- `backend/app/Services/ReviewService.php` — o agendamento e a fila.
- `backend/tests/Unit/SpacingTest.php` — cada teste é uma afirmação sobre a literatura.

## Por que não é o algoritmo do Anki

SM-2 e FSRS resolvem outro problema: **"lembrar para sempre"**, sem data marcada.
Por isso trabalham com múltiplos do intervalo anterior (SM-2) ou com um modelo de
estabilidade de memória treinado em milhões de revisões (FSRS). Nenhum dos dois
sabe que existe uma prova no dia 15/12.

O Castelei acompanha **um semestre com data marcada**. E para esse caso — prazo
conhecido — existe um resultado direto, e melhor.

## O achado que define o intervalo

> Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008).
> *Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention.*
> Psychological Science, 19(11), 1095–1102.

1.354 participantes, 26 condições experimentais: 12 intervalos entre estudos (de
0 a 105 dias) cruzados com 4 prazos até o teste (de 7 a 350 dias).

O resultado: **o intervalo ideal entre revisões é uma proporção do tempo que falta
até o teste.**

- Prazos de semanas a meses: o ótimo fica em torno de **10 a 20%** do prazo.
  Para teste em 70 dias, o melhor intervalo medido foi de 21 dias.
- Prazo de um ano: a proporção cai para **5 a 10%**.

Ou seja: quanto mais longe o teste, maior o intervalo absoluto — mas **menor** a
proporção.

O Castelei usa **15%**, o meio da faixa para o horizonte de um semestre.

### A consequência prática

O cronograma **se comprime sozinho** conforme a prova chega, sem ninguém
reconfigurar nada:

| Falta para a prova | Intervalo (acerto médio) |
| ------------------ | ------------------------ |
| 120 dias           | 18 dias                  |
| 90 dias            | 14 dias                  |
| 60 dias            | 9 dias                   |
| 30 dias            | 5 dias                   |
| 10 dias            | 2 dias                   |
| 3 dias             | 1 dia                    |

Isso é o que nenhum app de flashcard faz, porque nenhum deles conhece a data da
prova. É também a coisa mais valiosa que o Castelei sabe sobre o aluno dele.

### A crista é larga e assimétrica

O título do artigo ("ridgeline", crista) não é enfeite: o ótimo **não é um pico
estreito**. A curva sobe, forma um platô e desce devagar. E a queda é
assimétrica — **passar do ponto ideal custa bem menos do que ficar aquém dele**.

Duas consequências no código:

1. O cálculo **arredonda para cima** (`ceil`), nunca para baixo.
2. **Não precisamos de precisão.** É por isso que não há FSRS aqui: a
   complexidade de um modelo treinado não compra quase nada quando o alvo é um
   platô. Um número simples e bem justificado chega no mesmo lugar.

## Por que a revisão é feita de questões

> Roediger, H. L., & Karpicke, J. D. (2006). *Test-Enhanced Learning: Taking
> Memory Tests Improves Long-Term Retention.* Psychological Science, 17(3), 249–255.

Quem releu o material quatro vezes lembrou **83%** num teste cinco minutos depois
— contra 71% de quem praticou recuperação. Uma semana depois, a ordem inverteu:
**40% para quem releu, 61% para quem praticou.**

Releitura produz a *sensação* de saber; recuperação produz a memória. Por isso a
revisão do Castelei abre o **Modo Prova**, e não a lição. O app já fazia a coisa
certa aqui — o que faltava era o agendamento.

## Por que o intervalo não é sempre crescente

> Karpicke, J. D., & Roediger, H. L. (2007). *Expanding retrieval practice
> promotes short-term retention, but equally spaced retrieval enhances long-term
> retention.* Journal of Experimental Psychology: LMC, 33(4), 704–719.

Intervalo crescente (1, 2, 4, 8…) ganha no teste imediato e **perde** no teste
adiado. Como o teste que interessa aqui é a prova, e não o fim da sessão, a regra
proporcional — que na prática **encolhe** conforme a data chega — está do lado
certo dessa evidência.

## Os ajustes, e o que eles NÃO são

A regra de Cepeda descreve material **já aprendido**. Quem terminou a lição com
40% não aprendeu ainda, e mandar essa pessoa embora por treze dias é agendar o
esquecimento. Daí o multiplicador por faixa de acerto:

| Acerto na última tentativa | Fator |
| -------------------------- | ----- |
| 0–49%                      | 0,4   |
| 50–69%                     | 0,7   |
| 70–89%                     | 1,0   |
| 90–100%                    | 1,3   |

Isto **não** vem de um estudo específico — é um ajuste de engenharia sobre a base
que vem. Está documentado como tal de propósito: a proporção de 15% tem origem
medida, os fatores são calibragem nossa. Se alguém for mexer em algo, que mexa
aqui, não lá.

Recaídas (terminar abaixo de 50%) encurtam mais, com piso em metade do intervalo:
quem erra sempre não deve receber o intervalo de quem acerta, mas nada pode ficar
preso em "volta todo dia para sempre".

## Matéria sem data de prova

Cai numa escada fixa: **1, 3, 7, 16, 30 dias**, e para no último degrau. O teto de
30 dias é o que a própria curva de Cepeda indica para horizonte de um ano (5 a 10%
de 350 dias). Parar em vez de multiplicar é deliberado: intervalo que só cresce
acaba mandando a lição para daqui a um ano, o que é o mesmo que arquivá-la.

## Decisões de produto que acompanham

- **A fila convida, não cobra.** Atraso não é vermelho — no Castelei vermelho quer
  dizer erro, e estar atrasado numa revisão não é erro; é o motivo de o app
  existir.
- **A tela explica o porquê.** "Faltam 85 dias para a prova" é o que transforma o
  agendamento em algo confiável. Sem isso, "revise isto hoje" é só o app mandando.
- **Nada é travado.** A revisão sugere; a trilha continua aberta. Mesma decisão do
  nó cinza sem cadeado.
- **Não citamos o estudo na cara do aluno.** Ele quer estudar, não ler
  bibliografia. A fonte mora aqui.

## Se for calibrar

Mexa em `config/castelei.php`, não no código. E saiba o que está mexendo:

- `ratio` — a proporção de Cepeda. Sair da faixa de 0,10 a 0,20 é contrariar a
  medida, não afinar.
- `performance` — calibragem nossa. Espaço legítimo para ajuste.
- `fallback_days` — só vale para matéria sem prova.

O teste `SpacingTest` trava as propriedades, não os números exatos: encolher com a
prova chegando, nunca agendar depois dela, piso de um dia, arredondar para cima.
Se um deles quebrar, a pergunta é "mudamos de ideia sobre a pedagogia?" — não
"como faço passar?".
