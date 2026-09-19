<?php

/*
| Planos do Castelei. `questions_per_lesson` limita quantas questões cada
| lição entrega (null = sem limite). É a única regra de plano do MVP.
*/
return [
    'default_plan' => 'free',

    'plans' => [
        'free' => ['label' => 'Grátis', 'questions_per_lesson' => 5],
        'plus' => ['label' => 'Plus', 'questions_per_lesson' => 30],
        'pro' => ['label' => 'Pro', 'questions_per_lesson' => null],
    ],
];
