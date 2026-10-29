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
(Por isso o FSRS entra aqui só quando a pessoa NÃO marcou data — ver abaixo.)
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

- Prazo de uma semana: o ótimo fica em torno de **20 a 40%** do prazo.
- Prazos de semanas a meses: em torno de **10 a 20%**.
- Prazo de um ano: a proporção cai para **5 a 10%**.

Ou seja: quanto mais longe o teste, maior o intervalo absoluto — mas **menor** a
proporção.

O Castelei segue essa queda (`ratio_by_horizon` em `config/castelei.php`): **30%**
com a prova a uma semana, **15%** a dez semanas e **7,5%** a um ano. Entre esses
pontos, a fração anda em linha reta na escala logarítmica dos dois eixos, como a
curva do artigo.

Até outubro de 2026 a fração era fixa em 15%. Ela acertava o semestre e errava as
pontas: com a prova daqui a um ano (o ENEM, para quem começa cedo), mandava a
lição embora por quase dois meses, quando o estudo indica cerca de quatro
semanas. A mudança veio da revisão dos princípios pedagógicos
(`docs/principios-pedagogicos.md`).

### A consequência prática

O cronograma **se comprime sozinho** conforme a prova chega, sem ninguém
reconfigurar nada:

| Falta para a prova | Intervalo (acerto médio) |
| ------------------ | ------------------------ |
| 350 dias           | 27 dias                  |
| 120 dias           | 15 dias                  |
| 90 dias            | 13 dias                  |
| 60 dias            | 10 dias                  |
| 30 dias            | 6 dias                   |
| 10 dias            | 3 dias                   |
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
que vem. Está documentado como tal de propósito: a proporção por horizonte tem origem
medida, os fatores são calibragem nossa. Se alguém for mexer em algo, que mexa
aqui, não lá.

Recaídas (terminar abaixo de 50%) encurtam mais, com piso em metade do intervalo:
quem erra sempre não deve receber o intervalo de quem acerta, mas nada pode ficar
preso em "volta todo dia para sempre".

## A data da prova é de quem estuda

Desde outubro de 2026, a data mora na pessoa, e não na matéria (tabela
`exam_dates`, rota `PUT /subjects/{id}/exam-date`, editor `ExamDateEditor` na
faixa de resumo da matéria). Decisão do Sávio: numa matéria pública, cada um tem
a sua prova — o ENEM, o vestibular, o concurso. A coluna `subjects.exam_date`
ficou só como origem da migração: quem já estudava uma matéria com data herdou
essa data, para o cronograma não mudar sem a pessoa pedir. O painel não marca
mais data nenhuma.

## Sem data de prova: o FSRS

Quando a pessoa não marcou data, o problema vira **"lembrar para sempre"** — e
aí o FSRS é a ferramenta certa (`App\Support\Review\Fsrs`, versão 4.5 com os
parâmetros padrão publicados). Antes era uma escada fixa de 1, 3, 7, 16 e 30
dias, igual para todo mundo e toda lição.

O FSRS guarda dois números por (pessoa, lição), nas colunas `stability` e
`difficulty` da tabela `reviews`:

- **estabilidade**: em quantos dias a chance de lembrar cai para 90%;
- **dificuldade**: de 1 a 10, o quanto a lição custa para esta pessoa.

A nota que ele espera sai do acerto da tentativa: abaixo de 50% é "errei", de 50
a 69% "difícil", de 70 a 89% "bom" e 90% ou mais "fácil". O intervalo é o dia em
que a chance de lembrar chega a 90%, com teto de 365 dias.

**O estado anda sempre, com ou sem data.** Com data, quem decide o intervalo é
Cepeda; mas a memória continua sendo medida, e se a pessoa apagar a data o
agendamento segue de onde ela está, não da estaca zero.

Por que não usar o FSRS também com data: ele mira uma chance fixa de lembrar a
qualquer momento, sem saber que existe um dia que importa. Com prazo conhecido, a
proporção de Cepeda é o resultado direto — e é o que comprime o cronograma
sozinho conforme a prova chega.

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
