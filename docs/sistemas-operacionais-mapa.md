# Sistemas Operacionais: do plano do professor para o Castelei

**Documento interno de estruturação. Nada daqui aparece no app.**

Conteúdo **só do que está no plano da disciplina** (ementa e cronograma), na ordem das aulas.
A coluna "Base de estudo" indica a parte do livro-base da disciplina usada apenas para organizar cada assunto (páginas impressas; no PDF, some 19).

Regras do conteúdo no app:
- O Castelei é **independente**: as lições não citam livros, autores, capítulos nem páginas.
- Texto e figuras são **originais** (figuras em SVG, em `frontend/public/figuras/so/`), e podem usar conhecimento de qualquer boa fonte.
- **Escrito para quem parte do zero.** Peças do computador, "o que é um programa" e "o que é um shell" são explicados antes de usados. Cada ideia tem um exemplo do dia a dia.
- **Comandos sempre dizem onde funcionam.** Tabelas mostram Linux (bash), Windows PowerShell e Windows cmd lado a lado, e avisam quando um comando existe nos três ou só em um.
- **Informação atualizada** (ex.: Terminal do Windows 11, WSL, `openat` e `syscall` no Linux atual). Quando algo do livro-base estiver defasado, vale o que é atual.
- Termos técnicos só aparecem depois de explicados (o verificador `node scripts/lint-content.mjs` confere, e também reprova referências a fontes).

| Aula | Tópico do plano | Base de estudo (interna) | Lições no Castelei | Situação |
|---|---|---|---|---|
| 15/09 | Plano de aula e introdução | §1.1 | O que é um sistema operacional? | **Pronta** |
| 22/09 | Componentes e funções: processos, memória, arquivos, E/S, proteção, chamadas de sistema | §1.5 e §1.6 | Componentes e funções de um SO; O terminal na prática (Windows e Linux); Chamadas de sistema: como funcionam; Chamadas de sistema: arquivos e processos | **Prontas** |
| 29/09 | Estrutura e arquitetura de um SO | §1.7 (p. 43 a 51) | Estrutura de um SO: como ele é montado por dentro | **Pronta** |
| 06/10 | Processos e threads, parte 1 | §2.1 (p. 59 a 67) | Processos: como um programa vira coisa viva; Estados de um processo | **Prontas** |
| 13/10 | Processos e threads, parte 2 | §2.2 (p. 67 a 82) e §2.4 (p. 103 a 115) | Escalonamento; Threads: vários caminhos; Threads por dentro | **Prontas** |
| 20/10 e 27/10 | Comunicação entre processos, partes 1 e 2 | §2.3 (p. 82 a 103) e §2.5 (p. 115 a 119) | 5 lições: condição de corrida; exclusão mútua; semáforos e mutexes; monitores e mensagens; problemas clássicos | **Prontas** |
| 03/11 | Aula de exercícios | (revisão) | Usa as questões das lições anteriores | Depende das lições |
| 17/11 | Gerenciamento de memória: endereçamento, paginação, memória virtual | §3.1 a §3.7 (p. 125 a 174) | 4 lições: gerência de memória; memória virtual e paginação; substituição de páginas; segmentação | **Prontas** |
| 24/11 e 01/12 | Gerenciamento de arquivos, partes 1 e 2 | Cap. 4, §4.1 a §4.5 (p. 182 a 228) | 3 lições: arquivos e diretórios; como o disco guarda; confiabilidade | **Prontas** |
| 08/12 e 22/12 | Gerenciamento de dispositivos, partes 1 e 2 | Cap. 5, §5.1 a §5.4 (p. 233 a 269) | ~4 lições (inclui disco) | A fazer |
| 02/02/27 | Atividade sobre virtualização | Cap. 7 (p. 325 a 355) | ~3 lições | A fazer |

## Pontos a confirmar com o plano do professor

1. ~~**Escalonamento**~~ **Resolvido pela ementa:** é tópico próprio, logo depois de Estados e Transições, e já tem lição publicada.
2. **Estudos de caso** (ementa) não têm aula marcada. Podem ser os trabalhos 01 e 02. Se forem, o livro tem Linux/Android (cap. 10) e Windows (cap. 11).
3. **Introdução:** história (§1.2) e revisão de hardware (§1.3) ficaram de fora, pois o plano só cita "introdução". Dá para acrescentar.

## Fora do plano (não incluído)

Impasses (cap. 6), sistemas com múltiplos processadores (cap. 8) e segurança (cap. 9) não aparecem na ementa nem no cronograma.
