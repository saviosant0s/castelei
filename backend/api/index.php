<?php

/*
| Porta de entrada da API no Vercel.
|
| O Vercel roda PHP como função (adaptador `vercel-php`, ver vercel.json), e
| toda requisição cai aqui. Daqui em diante é o Laravel de sempre.
|
| Os três ajustes de $_SERVER não são enfeite. Este arquivo mora em /api, e o
| Symfony, ao ver o script em /api/index.php, conclui que o site vive na pasta
| /api: corta o "/api" do começo do caminho, e /api/catalog vira /catalog, que
| não existe. O sintoma era 404 do Laravel em toda rota, menos / e /up.
| Dizendo que o script é o /index.php da raiz, o caminho chega inteiro.
*/
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__.'/../public/index.php';

require __DIR__.'/../public/index.php';
