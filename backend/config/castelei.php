<?php

/*
| Planos do Castelei. `questions_per_lesson` limita quantas questões cada
| lição entrega (null = sem limite). `gamification` diz se o plano mostra
| streak, XP e conquistas (o planejamento reserva isso ao Plus e ao Pro).
*/
return [
    'default_plan' => 'free',

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

    // true = libera streak/XP/conquistas para todos os planos (útil em testes).
    'gamification_for_all' => (bool) env('GAMIFICATION_FOR_ALL', false),

    // true = libera o simulado para todos os planos (útil em testes).
    'exam_for_all' => (bool) env('EXAM_FOR_ALL', false),

    /*
    | Simulado: sorteia questões de várias lições da mesma matéria. O cronômetro
    | é crescente, igual ao da lição — o simulado se diferencia pela mistura de
    | assuntos, não por pressão de tempo (ver anti-padrões no planejamento).
    */
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
    | `ratio` = 0,15, o meio dessa faixa. A consequência é a parte bonita: o
    | cronograma se comprime sozinho conforme a prova chega. Faltam 90 dias,
    | revise em 13; faltam 30, em 4; faltam 7, amanhã. Nenhum agendador de
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
    | `fallback_days` vale para matéria SEM data de prova. A escada para em 30
    | dias de propósito: é o intervalo que a própria curva de Cepeda indica para
    | horizonte de um ano (5 a 10% de 350 dias). E ela cresce devagar porque
    | Karpicke & Roediger (2007) mostraram que intervalo crescente ganha no
    | teste imediato mas PERDE no teste adiado — o que interessa aqui.
    |
    | O conteúdo da revisão são QUESTÕES, nunca reler a lição, e isso também é
    | achado, não gosto: Roediger & Karpicke (2006) mediram 61% contra 40% de
    | retenção após uma semana para quem praticou recuperação em vez de reler.
    | O Modo Prova já é exatamente isso.
    */
    'review' => [
        // Proporção do tempo até a prova (Cepeda et al., 2008).
        'ratio' => 0.15,

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

        // Matéria sem data de prova: escada fixa, em dias, pelo nº de revisões feitas.
        'fallback_days' => [1, 3, 7, 16, 30],

        // Nunca marcar revisão para depois da prova, nem no próprio dia dela.
        'days_before_exam' => 1,
    ],

    'plans' => [
        'free' => ['label' => 'Grátis', 'questions_per_lesson' => 5, 'gamification' => false, 'exam' => false],
        'plus' => ['label' => 'Plus', 'questions_per_lesson' => 30, 'gamification' => true, 'exam' => false],
        'pro' => ['label' => 'Pro', 'questions_per_lesson' => null, 'gamification' => true, 'exam' => true],
    ],
];
