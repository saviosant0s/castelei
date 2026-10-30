/*
| O último valor que o cabeçalho mostrou, guardado na aba (sessionStorage).
|
| É o que permite animar a MUDANÇA: voltar de uma lição com 60 XP a mais faz o
| número subir de 1.280 para 1.340 em vez de aparecer pronto. Sem valor
| guardado (primeira tela da sessão), não há o que animar e o número só aparece.
| Guardado por aba e não na conta: é memória da tela, não dado de estudo.
*/
export function lembrado(chave: string): number | null {
  try {
    const v = sessionStorage.getItem(`castelei:visto:${chave}`);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

export function lembrar(chave: string, valor: number): void {
  try {
    sessionStorage.setItem(`castelei:visto:${chave}`, String(valor));
  } catch {
    // Aba anônima ou armazenamento bloqueado: a animação só não acontece.
  }
}
