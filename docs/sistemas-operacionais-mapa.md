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
| 15/09 | Plano de aula e introdução (visão geral, história, hardware e tipos de SO) | §1.1 a §1.4 | O que é um sistema operacional?; De onde vieram os sistemas operacionais; O hardware que o sistema operacional comanda; Tipos de sistema operacional | **Prontas** |
| 22/09 | Componentes e funções: processos, memória, arquivos, E/S, proteção, chamadas de sistema | §1.5 e §1.6 | Componentes e funções de um SO; O terminal na prática (Windows e Linux); Chamadas de sistema: como funcionam; Chamadas de sistema: arquivos e processos | **Prontas** |
| 29/09 | Estrutura e arquitetura de um SO | §1.7 (p. 43 a 51) | Estrutura de um SO: como ele é montado por dentro | **Pronta** |
| 06/10 | Processos e threads, parte 1 | §2.1 (p. 59 a 67) | Processos: como um programa vira coisa viva; Estados de um processo | **Prontas** |
| 13/10 | Processos e threads, parte 2 | §2.2 (p. 67 a 82) e §2.4 (p. 103 a 115) | Escalonamento; Threads: vários caminhos; Threads por dentro | **Prontas** |
| 20/10 e 27/10 | Comunicação entre processos, partes 1 e 2 | §2.3 (p. 82 a 103) e §2.5 (p. 115 a 119) | 5 lições: condição de corrida; exclusão mútua; semáforos e mutexes; monitores e mensagens; problemas clássicos | **Prontas** |
| 03/11 | Aula de exercícios | (revisão) | Usa as questões das lições anteriores | Depende das lições |
| 17/11 | Gerenciamento de memória: endereçamento, paginação, memória virtual | §3.1 a §3.7 (p. 125 a 174) | 4 lições: gerência de memória; memória virtual e paginação; substituição de páginas; segmentação | **Prontas** |
| 24/11 e 01/12 | Gerenciamento de arquivos, partes 1 e 2 | Cap. 4, §4.1 a §4.5 (p. 182 a 228) | 3 lições: arquivos e diretórios; como o disco guarda; confiabilidade | **Prontas** |
| 08/12 e 22/12 | Gerenciamento de dispositivos, partes 1 e 2 | Cap. 5, §5.1 a §5.4 (p. 233 a 269) | 3 lições: entrada e saída; disco e ordem dos pedidos; vários discos como um | **Prontas** |
| 02/02/27 | Atividade sobre virtualização | Cap. 7 (p. 325 a 355) | 2 lições: virtualização; contêineres | **Prontas** |
| 16/02 e 23/02 | Apresentação dos trabalhos 01 e 02 | Cap. 10 e 11 | 2 lições: estudo de caso Linux e Android; estudo de caso Windows | **Prontas** |

## Pontos a confirmar com o plano do professor

1. ~~**Escalonamento**~~ **Resolvido pela ementa:** é tópico próprio, logo depois de Estados e Transições, e já tem lição publicada.
2. ~~**Estudos de caso**~~ **Resolvido:** são os trabalhos 01 e 02 (16/02 e 23/02). Viraram 2 lições prontas, Linux/Android e Windows.
3. ~~**Introdução:** história e revisão de hardware ficaram de fora~~ **Resolvido pelo slide da aula 01:** o professor deu as duas na primeira aula, junto com os tipos de sistema. Viraram três lições novas, todas no módulo Fundamentos — `historia-dos-sistemas-operacionais`, `o-hardware-que-o-so-comanda` e `tipos-de-sistema-operacional`.

## Fora do plano (não incluído)

Impasses (cap. 6), sistemas com múltiplos processadores (cap. 8) e segurança (cap. 9) não aparecem na ementa nem no cronograma.

## O slide de cada aula é a fonte da vez

A ementa e o cronograma dizem **o que** entra. O slide que o professor apresenta diz
**com que profundidade** ele vai cobrar, e às vezes contradiz o recorte anterior — foi o
que aconteceu na aula 01, que trouxe história e hardware depois de os dois terem sido
descartados aqui.

O trabalho, a cada aula, é o mesmo:

1. comparar o slide com a lição correspondente e anotar o que falta;
2. acrescentar o que falta **e aprofundar** o que o slide explica mal, que costuma ser a maior parte;
3. rodar `node scripts/lint-content.mjs` e conferir a tela.

Profundidade não é complicação: é dizer por que a coisa é assim e mostrar o mecanismo.
Se a etapa ficou mais difícil de ler, foi para o lado errado.

### O que a aula 01 acrescentou às lições já prontas

| Lição | O que entrou |
|---|---|
| O que é um sistema operacional? | multiplexação no tempo e no espaço; o tamanho de um sistema, em milhões de linhas |
| Processos: como um programa vira coisa viva | os três segmentos de memória de um processo (texto, dados e pilha) |
| Estrutura de um SO | os seis andares do primeiro sistema em camadas; o micronúcleo que troca peça sem reiniciar |
| Chamadas de sistema: arquivos e processos | `stat`, `link`, `unlink` e `chmod`, com o equivalente no Windows |
| Arquivos e diretórios | montagem e ponto de montagem |
| Monitores e mensagens | o cano (pipe) entre dois processos da mesma máquina |
| Virtualização | o VM/370, de 1972, como origem direta do que a nuvem faz hoje |
