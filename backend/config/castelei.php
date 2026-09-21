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

    'plans' => [
        'free' => ['label' => 'Grátis', 'questions_per_lesson' => 5, 'gamification' => false, 'exam' => false],
        'plus' => ['label' => 'Plus', 'questions_per_lesson' => 30, 'gamification' => true, 'exam' => false],
        'pro' => ['label' => 'Pro', 'questions_per_lesson' => null, 'gamification' => true, 'exam' => true],
    ],
];
