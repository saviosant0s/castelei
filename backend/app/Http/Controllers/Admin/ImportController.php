<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Content\ContentImporter;
use App\Support\Content\ContentValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ImportController extends Controller
{
    /** O arquivo-modelo que o painel oferece para download. */
    public function template(): BinaryFileResponse
    {
        return response()->download(
            resource_path('content/modelo-conteudo.json'),
            'modelo-conteudo.json',
            ['Content-Type' => 'application/json; charset=utf-8'],
        );
    }

    /**
     * Recebe um arquivo de matéria e grava.
     *
     * Três respostas possíveis, e a diferença entre elas é o que o painel mostra:
     *
     * - **400** o arquivo nem é JSON válido (quase sempre um arquivo errado, ou
     *   truncado no meio do envio);
     * - **422** é JSON, mas o conteúdo tem erros — a lista vai junto, com o
     *   caminho de cada um, e nada foi gravado;
     * - **200** gravou, e o relatório diz exatamente quanta coisa entrou.
     *
     * Com `dry_run`, para no passo da conferência: mesma validação, mesma lista
     * de problemas, sem escrever no banco. É o "conferir antes de publicar".
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:8192'],
        ], [
            'file.required' => 'Escolha o arquivo JSON da matéria.',
            'file.max' => 'O arquivo passou de 8 MB. Se a matéria é grande mesmo, divida em mais de um arquivo.',
        ]);

        $raw = file_get_contents($request->file('file')->getRealPath());
        $data = json_decode((string) $raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json([
                'message' => 'Este arquivo não é um JSON válido: '.json_last_error_msg().'.',
                'hint' => 'Se o arquivo veio de uma conversa com IA, confira se copiou só o JSON, sem o texto em volta e sem as marcas de bloco de código.',
            ], 400);
        }

        // As chaves de comentário do modelo (_leia_me e companhia) saem antes da
        // conferência: elas não são dado e não devem virar erro de formato.
        $data = is_array($data) ? ContentImporter::stripComments($data) : $data;

        $resultado = (new ContentValidator)->validate($data);

        if ($resultado['errors'] !== []) {
            $total = count($resultado['errors']);

            return response()->json([
                'message' => $total === 1
                    ? 'O arquivo tem 1 problema que precisa ser corrigido. Nada foi importado.'
                    : "O arquivo tem {$total} problemas que precisam ser corrigidos. Nada foi importado.",
                'content_errors' => $resultado['errors'],
                'warnings' => $resultado['warnings'],
            ], 422);
        }

        if ($request->boolean('dry_run')) {
            return response()->json([
                'dry_run' => true,
                'message' => 'O arquivo está pronto para importar.',
                'warnings' => $resultado['warnings'],
            ]);
        }

        $report = (new ContentImporter)->import(
            $data,
            origin: 'painel',
            prune: $request->boolean('prune'),
        );

        $report->warnings = $resultado['warnings'];

        return response()->json(['report' => $report->toArray()]);
    }
}
