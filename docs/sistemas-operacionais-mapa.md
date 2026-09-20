# Sistemas Operacionais: do plano do professor para o Castelei

Conteúdo **só do que está no plano da disciplina** (ementa e cronograma), seguindo a ordem das aulas.
Livro-base: Tanenbaum, *Sistemas Operacionais Modernos*, 4ª ed. As páginas abaixo são as **impressas** (no PDF, some 19).

Regras deste conteúdo:
- Texto **original**, escrito com as palavras do Castelei. Nada é copiado do livro.
- Figuras **originais** (SVG em `frontend/public/figuras/so/`). As figuras do livro não são reaproveitadas.
- Cada lição cita a seção do livro (campo `source`), para servir de leitura prévia.
- Termos técnicos só aparecem depois de explicados (o verificador `node scripts/lint-content.mjs` confere).

| Aula | Tópico do plano | Livro | Lições no Castelei | Situação |
|---|---|---|---|---|
| 15/09 | Plano de aula e introdução | §1.1 (p. 3 a 5) | O que é um sistema operacional? | **Pronta** |
| 22/09 | Componentes e funções: processos, memória, arquivos, E/S, proteção, chamadas de sistema | §1.5 (p. 27 a 32) e §1.6 (p. 35 a 43) | Componentes e funções de um SO; Chamadas de sistema | **Prontas** |
| 29/09 | Estrutura e arquitetura de um SO | §1.7 (p. 43 a 51) | 2 lições: monolítico, camadas e micronúcleo; cliente-servidor, máquinas virtuais e exonúcleo | A fazer |
| 06/10 | Processos e threads, parte 1 | §2.1 (p. 59 a 67) | 2 lições: modelo de processo; estados e transições | A fazer |
| 13/10 | Processos e threads, parte 2 | §2.2 (p. 67 a 82) e §2.4 (p. 103 a 115) | Threads (2 lições) e escalonamento (2 lições) | A fazer, **confirmar** onde entra o escalonamento |
| 20/10 e 27/10 | Comunicação entre processos, partes 1 e 2 | §2.3 (p. 82 a 103) e §2.5 (p. 115 a 119) | ~4 lições: condições de corrida e exclusão mútua; semáforos e mutexes; monitores e mensagens; problemas clássicos | A fazer |
| 03/11 | Aula de exercícios | (revisão) | Usa as questões das lições anteriores | Depende das lições |
| 17/11 | Gerenciamento de memória: endereçamento, paginação, memória virtual | §3.1 a §3.7 (p. 125 a 174) | ~5 lições | A fazer |
| 24/11 e 01/12 | Gerenciamento de arquivos, partes 1 e 2 | Cap. 4, §4.1 a §4.5 (p. 182 a 228) | ~4 lições | A fazer |
| 08/12 e 22/12 | Gerenciamento de dispositivos, partes 1 e 2 | Cap. 5, §5.1 a §5.4 (p. 233 a 269) | ~4 lições (inclui disco) | A fazer |
| 02/02/27 | Atividade sobre virtualização | Cap. 7 (p. 325 a 355) | ~3 lições | A fazer |

## Pontos a confirmar com o plano do professor

1. **Escalonamento** está na ementa, mas não tem aula própria no cronograma. Suposição: entra em "Processos e threads, parte 2".
2. **Estudos de caso** (ementa) não têm aula marcada. Podem ser os trabalhos 01 e 02. Se forem, o livro tem Linux/Android (cap. 10) e Windows (cap. 11).
3. **Introdução:** história (§1.2) e revisão de hardware (§1.3) ficaram de fora, pois o plano só cita "introdução". Dá para acrescentar.

## Fora do plano (não incluído)

Impasses (cap. 6), sistemas com múltiplos processadores (cap. 8) e segurança (cap. 9) não aparecem na ementa nem no cronograma.
