<?php

/*
| Planos do Castelei. `questions_per_lesson` limita quantas questões cada
| lição entrega (null = sem limite). `gamification` diz se o plano mostra
| streak, XP e conquistas (o planejamento reserva isso ao Plus e ao Pro).
*/
return [
    'default_plan' => 'free',

    /*
    | Áreas do conhecimento, na ordem em que a tela inicial mostra.
    |
    | Cada matéria aponta para uma delas pelo slug (`subjects.area`). A área sem
    | matéria aparece como "Em breve": a lista é a das disciplinas de escola,
    | não a do que já foi escrito, para a pessoa ver o que o app vai cobrir.
    | Os ícones moram na tela (`frontend/src/lib/areas.ts`); nome e ordem, aqui.
    */
    /*
    | Trilhas: a ordem em que se estuda um objetivo que atravessa áreas.
    |
    | "LLMs do zero" mistura Matemática e Informática, e a tela de áreas não
    | diz por onde começar. A trilha diz: cada passo é uma matéria, na ordem
    | em que uma depende da outra, com a frase do porquê. Passo cuja matéria
    | ainda não existe aparece como "Em breve", com o nome daqui.
    */
    /*
    | Trilhas: a ordem de estudo que atravessa matérias e áreas. `visibility`
    | private = só quem administra vê. O plano das trilhas básicas está em
    | docs/plano-de-conteudo.md; passo de matéria que ainda não existe (ou que
    | a pessoa não enxerga) aparece como "Em breve".
    */
    'trails' => [
        [
            'slug' => 'base-para-provas',
            'name' => 'Base para provas',
            'description' => 'Ler, contar, raciocinar e escrever: o que toda prova cobra, na ordem em que uma coisa apoia a outra.',
            'steps' => [
                ['subject' => 'portugues', 'name' => 'Português', 'why' => 'Entender o enunciado é metade da questão: classes de palavras, frase, concordância e interpretação.'],
                ['subject' => 'matematica-basica', 'name' => 'Matemática Básica', 'why' => 'Frações, porcentagem, potências, equações e funções: a conta que aparece em toda prova.'],
                ['subject' => 'logica', 'name' => 'Lógica', 'why' => 'Negar, concluir e montar a tabela-verdade: o raciocínio que as bancas cobram à parte.'],
                ['subject' => 'producao-textual', 'name' => 'Produção Textual', 'why' => 'Defender uma ideia por escrito, da tese à conclusão, como pede a redação.'],
            ],
        ],
        [
            'slug' => 'llms-do-zero',
            'name' => 'LLMs do zero',
            // Trilha pessoal do Sávio: só quem administra vê, como a matéria privada.
            'visibility' => 'private',
            'description' => 'Da conta de fração ao modelo de linguagem, na ordem em que uma coisa depende da outra.',
            'steps' => [
                ['subject' => 'matematica-basica', 'name' => 'Matemática Básica', 'why' => 'A base de tudo: frações, potências, equações, funções e logaritmos.'],
                ['subject' => 'programacao-python', 'name' => 'Programação com Python', 'why' => 'A linguagem em que toda a parte prática da trilha é escrita.'],
                ['subject' => 'algebra-linear', 'name' => 'Álgebra Linear', 'why' => 'Vetores e matrizes: é assim que um modelo guarda palavras e faz contas.'],
                ['subject' => 'calculo', 'name' => 'Cálculo', 'why' => 'Derivada e gradiente: é assim que uma rede aprende com os erros.'],
                ['subject' => 'probabilidade-estatistica', 'name' => 'Probabilidade e Estatística', 'why' => 'Chances e verossimilhança: é o que um modelo de linguagem calcula e otimiza.'],
                ['subject' => 'redes-neurais', 'name' => 'Redes Neurais', 'why' => 'O neurônio, as camadas e o treino, juntando a matemática com o código.'],
                ['subject' => 'llms-como-funcionam', 'name' => 'LLMs: do texto ao Transformer', 'why' => 'Tokens, embeddings, atenção e a arquitetura por dentro de um GPT.'],
                ['subject' => 'llms-na-pratica', 'name' => 'LLMs: treino, uso e limites', 'why' => 'Como se treina, ajusta, roda e avalia um modelo, e onde ele erra.'],
            ],
        ],
    ],

    'areas' => [
        'portugues' => 'Português',
        'matematica' => 'Matemática',
        'fisica' => 'Física',
        'quimica' => 'Química',
        'biologia' => 'Biologia',
        'historia' => 'História',
        'geografia' => 'Geografia',
        'filosofia' => 'Filosofia',
        'sociologia' => 'Sociologia',
        'ingles' => 'Inglês',
        'espanhol' => 'Espanhol',
        'artes' => 'Artes',
        'educacao-fisica' => 'Educação Física',
        'informatica' => 'Informática',
    ],

    /*
    | Painel de conteúdo (/admin).
    |
    | `admin_emails` é uma lista separada por vírgula. Ela é a porta de entrada:
    | quem está nela administra mesmo sem a coluna `is_admin` ligada. Depois do
    | primeiro acesso, o caminho normal é `php artisan castelei:admin e-mail`.
    */
    'admin_emails' => env('ADMIN_EMAILS', ''),

    /*
    | Figuras e vídeos enviados pelo painel.
    |
    | ATENÇÃO, RAILWAY: o disco do contêiner é descartado a cada deploy. Sem um
    | volume montado em /app/storage/app/public, tudo que for enviado pelo
    | painel some no deploy seguinte. As fichas continuam no banco e os
    | endereços passam a dar 404 — o pior dos dois mundos.
    |
    | Trocar para armazenamento externo é só mudar MEDIA_DISK=s3 e preencher as
    | variáveis AWS_* (vale para S3, Cloudflare R2 e compatíveis). Nada no
    | código muda: tudo passa por Storage::disk().
    */
    'media' => [
        'disk' => env('MEDIA_DISK', 'public'),
        // Limites em kB, do jeito que a validação do Laravel espera.
        'max_image_kb' => (int) env('MEDIA_MAX_IMAGE_KB', 4096),
        'max_video_kb' => (int) env('MEDIA_MAX_VIDEO_KB', 51200),
        'image_mimes' => ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
        'video_mimes' => ['video/mp4', 'video/webm', 'video/ogg'],
    ],

    // Fuso usado para decidir "que dia é hoje" no streak. O Brasil não tem horário de verão desde 2019.
    'timezone' => env('CASTELEI_TIMEZONE', 'America/Sao_Paulo'),

    // XP ganho por resposta certa (o wireframe mostra +20 por questão).
    'xp_per_correct_answer' => 20,

    /*
    | FASE DE TESTES: com isto ligado, todo mundo estuda como Pro — sem limite
    | de questões, com gamificação e com simulado. O plano guardado em cada
    | usuário não muda; só a leitura passa a ser Pro.
    |
    | Ao lançar de verdade, troque o padrão para false (ou defina UNLOCK_ALL=false
    | no Railway). Nada mais precisa ser mexido: os limites voltam sozinhos.
    */
    'unlock_all' => (bool) env('UNLOCK_ALL', true),

    /*
    | Contas que enxergam o plano DE VERDADE mesmo na fase de testes. Lista
    | de e-mails separada por vírgula. Existe para o Sávio ter uma conta
    | grátis e ver o que fica faltando, sem desligar o UNLOCK_ALL de todo
    | mundo.
    */
    'real_plan_emails' => env('REAL_PLAN_EMAILS', ''),

    // true = libera streak/XP/conquistas para todos os planos (útil em testes).
    'gamification_for_all' => (bool) env('GAMIFICATION_FOR_ALL', false),

    // true = libera o simulado para todos os planos (útil em testes).
    'exam_for_all' => (bool) env('EXAM_FOR_ALL', false),

    /*
    | Simulado: sorteia questões de várias lições da mesma matéria. O cronômetro
    | é crescente, igual ao da lição — o simulado se diferencia pela mistura de
    | assuntos, não por pressão de tempo (ver anti-padrões no planejamento).
    */
    /*
    | PRODUÇÃO TEXTUAL — como o texto escrito é conferido.
    |
    | Três camadas, da mais barata para a mais cara:
    |
    | 1. A FORMA (tamanho, frase longa, palavra repetida, marca de fala) é
    |    código nosso, na tela, enquanto a pessoa escreve (`lib/writing.ts`).
    | 2. A LÍNGUA (ortografia, acentuação, crase, concordância) é o
    |    LanguageTool. A API pública é grátis, com limite de 20 pedidos por
    |    minuto POR IP — e todo pedido sai do nosso servidor, então o limite é
    |    de todo mundo junto. Para muita gente, rode uma instância própria e
    |    aponte LANGUAGETOOL_URL para ela. Vazio desliga: a conferência de
    |    língua some da tela, o resto continua.
    | 3. O SENTIDO só uma IA avalia. Está pronto e DESLIGADO: sem
    |    ANTHROPIC_API_KEY, a rota responde 404 e o botão não aparece. Com a
    |    chave, cada pessoa tem um limite por dia — é a trava que impede
    |    alguém de gastar o crédito inteiro. A API é pré-paga: acabou o
    |    crédito, ela para, e a conta não cresce sozinha (desde que a recarga
    |    automática fique desligada no painel da Anthropic).
    */
    'writing' => [
        'languagetool_url' => env('LANGUAGETOOL_URL', 'https://api.languagetool.org/v2/check'),
        // O texto mais longo que se aceita, em caracteres. A API pública recusa acima de 20 KB.
        'max_chars' => 6000,
        'ai' => [
            'key' => env('ANTHROPIC_API_KEY', ''),
            // A chave sozinha NÃO liga esta correção: ela é dividida com a da
            // anotação (`notes.ai`), e o Sávio ligou a IA só para a anotação.
            'enabled' => (bool) env('WRITING_AI_ENABLED', false),
            'model' => env('WRITING_AI_MODEL', 'claude-opus-5'),
            // Correções por pessoa por dia. É a trava de custo, não um detalhe.
            'daily_limit' => (int) env('WRITING_AI_DAILY_LIMIT', 5),
        ],
    ],

    /*
    | ANOTAÇÃO DA LIÇÃO — a correção por IA da "explicação para si mesmo".
    |
    | A pessoa escreve (ou fala) o que entendeu, e a IA compara com o conteúdo
    | da PRÓPRIA lição: o que acertou, o que está errado e o que faltou. Liga
    | com ANTHROPIC_API_KEY e desliga com NOTE_AI_ENABLED=false. A mesma chave
    | serve à Produção Textual, que tem o próprio interruptor (desligado).
    |
    | O limite por pessoa por dia é a trava de custo, como na escrita.
    */
    'notes' => [
        'ai' => [
            'key' => env('ANTHROPIC_API_KEY', ''),
            'enabled' => (bool) env('NOTE_AI_ENABLED', true),
            'model' => env('NOTE_AI_MODEL', 'claude-sonnet-5-5'),
            'daily_limit' => (int) env('NOTE_AI_DAILY_LIMIT', 5),
            // Dúvidas tiradas com a IA no fim da lição: limite à parte, porque
            // perguntar é o uso mais comum. Mesma chave e mesmo modelo.
            'doubt_daily_limit' => (int) env('NOTE_AI_DOUBT_DAILY_LIMIT', 10),
        ],
    ],

    'exam' => [
        'questions' => 20,      // alvo de questões por simulado
        'min_questions' => 5,   // abaixo disso a matéria ainda não dá simulado
    ],

    /*
    | REVISÃO ESPAÇADA — e por que não é o algoritmo do Anki.
    |
    | SM-2 e FSRS resolvem outro problema: "lembrar para sempre", sem data
    | marcada. Por isso multiplicam intervalos por fatores fixos, sem saber que
    | existe uma prova. O Castelei acompanha um semestre com prova marcada, e
    | para esse caso existe resultado melhor e direto.
    |
    | Cepeda, Vul, Rohrer, Wixted & Pashler (2008), "Spacing Effects in
    | Learning: A Temporal Ridgeline of Optimal Retention", Psychological
    | Science 19(11), 1095-1102: 1.354 pessoas, 26 condições, 12 intervalos
    | entre estudos (0 a 105 dias) e 4 prazos até o teste (7 a 350 dias).
    |
    | O achado: o intervalo ideal é uma PROPORÇÃO do tempo que falta até o
    | teste. Cerca de 10 a 20% para prazos de semanas a meses (para teste em 70
    | dias, o melhor intervalo medido foi 21 dias), caindo para 5 a 10% quando o
    | prazo é de um ano.
    |
    | `ratio_by_horizon` segue a curva medida: 30% com a prova a uma semana,
    | 15% a dez semanas (o meio da faixa de um semestre) e 7,5% a um ano, com
    | a fração andando em linha reta na escala logarítmica entre esses pontos.
    | Antes era 15% fixo, que acertava o semestre e errava as pontas — uma
    | prova daqui a um ano (o ENEM, para quem começa cedo) mandava a lição
    | embora por quase dois meses. A consequência continua a parte bonita: o
    | cronograma se comprime sozinho conforme a prova chega. Faltam 90 dias,
    | revise em 13; faltam 30, em 6; faltam 7, em 3. Nenhum agendador de
    | flashcard faz isso, porque nenhum deles sabe a data da prova.
    |
    | O ótimo é uma CRISTA LARGA E ASSIMÉTRICA: errar para mais custa bem menos
    | que errar para menos. Por isso o cálculo arredonda para CIMA e o piso de
    | 1 dia existe, mas não há teto artificial antes da prova.
    |
    | `performance` ajusta a base pelo acerto da última tentativa. A crista de
    | Cepeda descreve material aprendido; quem saiu com 40% não aprendeu ainda,
    | e mandar essa pessoa embora por 13 dias é agendar o esquecimento.
    |
    | SEM data de prova (a pessoa não marcou), quem decide é o FSRS-4.5
    | (App\Support\Review\Fsrs), com os parâmetros padrão. Sem prazo, o
    | problema vira "lembrar para sempre", que é o que ele resolve, e ele
    | aprende com cada lição de cada pessoa. Antes era uma escada fixa de 1, 3,
    | 7, 16 e 30 dias. O estado de memória (estabilidade e dificuldade) anda
    | em toda revisão, com ou sem data, para não recomeçar do zero.
    |
    | A data da prova é de CADA PESSOA (tabela exam_dates), marcada na tela da
    | matéria. Decisão do Sávio: quem sabe quando é a prova é quem estuda.
    |
    | O conteúdo da revisão são QUESTÕES, nunca reler a lição, e isso também é
    | achado, não gosto: Roediger & Karpicke (2006) mediram 61% contra 40% de
    | retenção após uma semana para quem praticou recuperação em vez de reler.
    | O Modo Prova já é exatamente isso.
    */
    'review' => [
        // Proporção do tempo até a prova, por horizonte em dias (Cepeda et al., 2008).
        'ratio_by_horizon' => [7 => 0.30, 70 => 0.15, 350 => 0.075],

        /*
        | Multiplicadores por faixa de acerto da última tentativa. A chave é o
        | piso da faixa em porcentagem; a leitura pega a maior chave que couber.
        */
        'performance' => [
            0 => 0.4,   // não aprendeu ainda: volta logo
            50 => 0.7,  // instável
            70 => 1.0,  // aprendeu: a crista de Cepeda vale como está
            90 => 1.3,  // sólido: pode esperar mais
        ],

        // Abaixo disto a tentativa conta como recaída e encurta os próximos intervalos.
        'lapse_below' => 50,
        // Cada recaída acumulada corta este tanto do intervalo (limitado por `lapse_floor`).
        'lapse_penalty' => 0.15,
        'lapse_floor' => 0.5,

        // Nunca marcar revisão para depois da prova, nem no próprio dia dela.
        'days_before_exam' => 1,

        /*
        | LEMBRETE.
        |
        | O agendamento só funciona se a pessoa voltar. Um intervalo calculado
        | com 1.354 participantes não vale nada se o app espera em silêncio.
        |
        | `hour` é 18h no fuso do aluno, e isto é ESCOLHA DE PRODUTO, não achado
        | científico — não existe medida séria de "melhor hora para avisar", e
        | inventar uma seria mentir. O raciocínio é banal: fim de tarde é quando
        | um estudante de ADS está saindo da aula ou chegando em casa.
        |
        | No máximo UM por dia, e só quando há algo vencido. A crista de Cepeda é
        | assimétrica — chegar um pouco atrasado à revisão custa pouco —, então
        | não há motivo nenhum para insistir. App de estudo que cutuca duas vezes
        | vira app desinstalado, e aí o intervalo ideal vira zero.
        */
        'reminder' => [
            'hour' => (int) env('CASTELEI_REMINDER_HOUR', 18),
            // Acima disto o aviso para de listar lições e passa a dizer só o número.
            'max_titles' => 2,
        ],
    ],

    /*
    | GATILHO DE CRON POR HTTP.
    |
    | O Railway não tem cron no plano em uso: o serviço `backend` atende
    | requisições e nada chama `schedule:run`. Um serviço só de cron esbarra no
    | limite de serviços do plano gratuito.
    |
    | A saída é deixar alguém de fora puxar o cordão — hoje é o GitHub Actions
    | (`.github/workflows/lembretes.yml`), que tem agendamento e não custa nada.
    |
    | O segredo é o que separa isso de um endereço público que qualquer um
    | dispara. Sem ele a rota responde 404, como se não existisse: é melhor a
    | função não existir do que existir aberta.
    |
    | Atraso não é problema aqui, e isso não é conformismo: o agendamento do
    | GitHub Actions costuma atrasar minutos, e a crista de Cepeda é larga —
    | chegar uma hora depois da hora não muda a retenção em nada.
    */
    'cron' => [
        'secret' => env('CRON_SECRET', ''),
    ],

    /*
    | Web Push (VAPID).
    |
    | Gere o par com: php artisan castelei:vapid
    |
    | Sem as chaves, o sistema de lembrete fica INERTE de propósito: a rota de
    | assinatura responde 503, o botão não aparece e o comando diário não manda
    | nada. Mesmo padrão de /.well-known/assetlinks.json, que responde 404
    | enquanto a variável não existe — é melhor a coisa não existir do que
    | existir quebrada.
    |
    | A chave privada é SEGREDO: quem a tiver manda notificação em nome do
    | Castelei. Vai em variável de ambiente, nunca no repositório.
    */
    'push' => [
        'public_key' => env('VAPID_PUBLIC_KEY', ''),
        'private_key' => env('VAPID_PRIVATE_KEY', ''),
        // Contato exigido pelo padrão: é a quem o serviço de push reclama.
        'subject' => env('VAPID_SUBJECT', 'mailto:contato@castelei.com.br'),
    ],

    'plans' => [
        /*
        | O corte decidido pelo Sávio: TUDO o que existe hoje fica no grátis —
        | as oito questões por lição, a gamificação, a trilha, o vocabulário,
        | a revisão e os lembretes. O Pro ganha o simulado e, quando existirem,
        | as questões além das oito (níveis de dificuldade).
        */
        'free' => ['label' => 'Grátis', 'questions_per_lesson' => 8, 'gamification' => true, 'exam' => false],
        'plus' => ['label' => 'Plus', 'questions_per_lesson' => 30, 'gamification' => true, 'exam' => false],
        'pro' => ['label' => 'Pro', 'questions_per_lesson' => null, 'gamification' => true, 'exam' => true],
    ],
];
