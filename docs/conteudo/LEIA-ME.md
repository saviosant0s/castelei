# Conteúdo em preparo

Arquivos de matéria que ainda **não** foram publicados. Eles moram aqui, e não
em `backend/database/seeders/content/`, por um motivo concreto:

O `ContentSeeder` importa **tudo** que encontra naquela pasta, a cada deploy.
Uma matéria que já existe em produção vinda do painel (`origin = painel`) é
pulada pelo slug — mas só pelo slug. Se o arquivo aqui usasse um slug diferente
do que está publicado, o pre-deploy criaria uma **segunda** matéria ao lado da
primeira, sem erro e sem aviso. Por isso o arquivo fica fora do alcance do
seeder até alguém conferir o endereço da matéria em `/admin`.

## Conferindo antes de importar

```bash
node scripts/lint-content.mjs docs/conteudo/servidores-vps.json
```

O verificador aceita caminhos de arquivo justamente para isto: conferir o que
ainda não foi publicado. Sem argumento, ele confere o conteúdo que está no ar.

## Importando

1. Em `/admin`, abra a matéria e confira o **endereço** dela.
2. Ajuste o campo `slug` no topo do arquivo para esse mesmo endereço.
3. Importe pelo painel e leia o relatório antes de confirmar.

O importador nunca apaga sozinho: lição que sumiu do arquivo aparece como órfã
no relatório e continua no ar até alguém pedir para remover.
