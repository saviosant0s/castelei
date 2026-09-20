<?php

/*
| Planos do Castelei. `questions_per_lesson` limita quantas questões cada
| lição entrega (null = sem limite). `gamification` diz se o plano mostra
| streak, XP e conquistas (o planejamento reserva isso ao Plus e ao Pro).
*/
return [
    'default_plan' => 'free',

    // Fuso usado para decidir "que dia é hoje" no streak. O Brasil não tem horário de verão desde 2019.
    'timezone' => env('CASTELEI_TIMEZONE', 'America/Sao_Paulo'),

    // XP ganho por resposta certa (o wireframe mostra +20 por questão).
    'xp_per_correct_answer' => 20,

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
