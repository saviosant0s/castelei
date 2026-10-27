<?php

/*
| Porta de entrada da API no Vercel.
|
| O Vercel roda PHP como função (adaptador `vercel-php`, ver vercel.json), e
| toda requisição cai aqui. Daqui em diante é o Laravel de sempre.
*/
require __DIR__.'/../public/index.php';
