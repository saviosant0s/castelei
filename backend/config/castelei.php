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

    'plans' => [
        'free' => ['label' => 'Grátis', 'questions_per_lesson' => 5, 'gamification' => false],
        'plus' => ['label' => 'Plus', 'questions_per_lesson' => 30, 'gamification' => true],
        'pro' => ['label' => 'Pro', 'questions_per_lesson' => null, 'gamification' => true],
    ],
];
