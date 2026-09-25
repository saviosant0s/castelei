<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Question;
use App\Models\User;
use App\Services\GamificationService;
use App\Services\ReviewService;
use App\Support\Practice\StepShuffle;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AttemptController extends Controller
{
    public function __construct(
        private GamificationService $gamification,
        private ReviewService $reviews,
    ) {
    }

    /** Inicia uma tentativa e devolve as questões SEM gabarito nem explicação. */
    public function store(Request $request, Lesson $lesson): JsonResponse
    {
        $query = $lesson->questions()->where('exam_only', false)->orderBy('position');

        /*
        | "Refazer só as que errei": as questões cuja ÚLTIMA resposta desta
        | pessoa foi errada. A última, e não qualquer uma — quem errou em
        | setembro e acertou ontem já aprendeu, e refazer essa seria castigo.
        */
        $soErradas = $request->input('only') === 'wrong';
        if ($soErradas) {
            $erradas = self::wrongQuestionIds($request->user()->id, $lesson);
            abort_if($erradas === [], 422, 'Você não tem questão errada nesta lição. Bom trabalho!');
            $query->whereIn('id', $erradas);
        }

        /*
        | O limite do plano corta questões do fim da lista. Numa lição de
        | escrita, o fim é a etapa que junta as partes num texto só — cortar
        | ali entregaria um texto pela metade. Por isso a escrita não tem
        | corte: são poucas partes, e todas formam uma coisa só.
        */
        $limit = $soErradas || $lesson->questions()->where('format', Question::FORMAT_WRITING)->exists()
            ? null
            : $request->user()->questionLimit();

        if ($limit !== null) {
            $query->limit($limit);
        }
        $questions = $query->get();

        abort_if($questions->isEmpty(), 422, 'Esta lição ainda não tem questões.');

        $attempt = Attempt::create([
            'user_id' => $request->user()->id,
            'kind' => Attempt::KIND_LESSON,
            'lesson_id' => $lesson->id,
            'subject_id' => $lesson->subject_id,
            'started_at' => now(),
            'total_questions' => $questions->count(),
            'question_ids' => $questions->pluck('id')->all(),
        ]);

        return response()->json([
            'attempt' => ['id' => $attempt->id, 'total' => $attempt->total_questions, 'kind' => $attempt->kind],
            'questions' => $questions->map(fn (Question $question) => self::payload($question, $attempt->id))->values(),
            'limited_by_plan' => ! $soErradas && $lesson->questions()->where('exam_only', false)->count() > $questions->count(),
        ], 201);
    }

    /**
     * As questões da lição em que a ÚLTIMA resposta desta pessoa foi errada.
     * Só tentativas concluídas contam, e a escrita fica de fora: parte de
     * texto não tem "errada", tem critério a cumprir.
     *
     * @return list<int>
     */
    public static function wrongQuestionIds(int $userId, Lesson $lesson): array
    {
        $ultimas = DB::table('answers')
            ->join('attempts', 'attempts.id', '=', 'answers.attempt_id')
            ->join('questions', 'questions.id', '=', 'answers.question_id')
            ->where('attempts.user_id', $userId)
            ->whereNotNull('attempts.finished_at')
            ->where('questions.lesson_id', $lesson->id)
            ->where('questions.format', '!=', Question::FORMAT_WRITING)
            ->groupBy('answers.question_id')
            ->selectRaw('MAX(answers.id) as id');

        return DB::table('answers')
            ->whereIn('id', $ultimas)
            ->where('is_correct', false)
            ->orderBy('question_id')
            ->pluck('question_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * A questão como ela vai para a tela: sem gabarito, sem explicação.
     *
     * Na questão de ordenar, "sem gabarito" quer dizer embaralhada: a ordem
     * certa é a própria lista de passos. Ver StepShuffle.
     *
     * @return array<string, mixed>
     */
    public static function payload(Question $question, int $attemptId): array
    {
        $options = $question->options;
        $prompts = null;

        if ($question->format === Question::FORMAT_MATCH) {
            /*
            | A esquerda vai na ordem escrita; a direita vai embaralhada. É
            | ela que a pessoa arrasta com o dedo, e entregá-la alinhada com
            | a esquerda seria entregar o gabarito.
            */
            $pares = $question->pairs ?? [];
            $prompts = array_map(fn (array $par) => $par['left'], $pares);
            $direita = array_map(fn (array $par) => $par['right'], $pares);
            $mostrados = StepShuffle::display($attemptId, $question->id, count($direita));
            $options = array_map(fn (int $original) => $direita[$original], $mostrados);
        }

        /*
        | A de ordenar e a de múltipla escolha vão embaralhadas, pela mesma
        | conta. Na de ordenar, a ordem escrita É o gabarito. Na de múltipla
        | escolha, quem escreve costuma pôr a certa primeiro: em Sistemas
        | Operacionais ela era a A em 200 de 256 questões, e dava para acertar
        | sem saber. Embaralhar aqui corrige todas as matérias de uma vez,
        | inclusive as escritas no painel, sem tocar no conteúdo.
        */
        if ($question->format === Question::FORMAT_ORDER || $question->format === Question::FORMAT_CHOICE) {
            $mostrados = StepShuffle::display($attemptId, $question->id, count($options));
            $options = array_map(fn (int $original) => $options[$original], $mostrados);
        }

        return array_filter([
            'id' => $question->id,
            'position' => $question->position,
            'format' => $question->format,
            'topic' => $question->topic,
            'statement' => $question->statement,
            'options' => $options,
            // Só a questão de associar tem coluna da esquerda.
            'prompts' => $prompts,
            'writing' => $question->isWriting() ? self::writingBrief($question) : null,
        ], fn ($valor) => $valor !== null);
    }

    /**
     * O que a tela de escrita recebe ANTES de a pessoa escrever.
     *
     * O roteiro e as conferências da forma vão já: são o "tem que ter tal
     * coisa" do enunciado. O texto-modelo e a lista de autoavaliação ficam
     * no servidor até a pessoa conferir o que escreveu — modelo mostrado
     * antes vira texto copiado, e aí o exercício acabou.
     *
     * @return array<string, mixed>
     */
    public static function writingBrief(Question $question): array
    {
        $w = $question->writing ?? [];

        return [
            'steps' => array_values($w['steps'] ?? []),
            'min_chars' => (int) ($w['min_chars'] ?? 0),
            'max_chars' => (int) ($w['max_chars'] ?? config('castelei.writing.max_chars')),
            'checks' => array_values($w['checks'] ?? []),
            'assemble' => (bool) ($w['assemble'] ?? false),
            // Parte de rascunho (a tese sozinha): ela já mora dentro da introdução, e não entra no texto juntado.
            'draft_only' => (bool) ($w['draft_only'] ?? false),
            'placeholder' => $w['placeholder'] ?? null,
        ];
    }

    public function answer(Request $request, Attempt $attempt): JsonResponse
    {
        $this->ensureOwner($request, $attempt);
        abort_if($attempt->finished_at !== null, 409, 'Esta tentativa já foi finalizada.');

        $data = $request->validate([
            'question_id' => ['required', 'integer'],
            'selected' => ['nullable', 'integer', 'min:0', 'max:4'],
            // A resposta de uma questão de ordenar: os índices DO QUE ESTÁ NA
            // TELA, na ordem em que a pessoa pôs.
            'ordering' => ['nullable', 'array', 'max:8'],
            'ordering.*' => ['integer', 'min:0', 'max:7'],
            // A resposta de uma questão de escrita: o texto e a autoavaliação.
            'text' => ['nullable', 'string', 'max:'.config('castelei.writing.max_chars')],
            'checklist' => ['nullable', 'array', 'max:20'],
            'checklist.*' => ['boolean'],
            // Escrever demora mais que marcar uma alternativa: até 3 horas.
            'seconds' => ['required', 'integer', 'min:0', 'max:10800'],
        ]);

        // Só vale responder as questões entregues no início da tentativa.
        $allowedIds = $attempt->allowedQuestionIds();
        abort_unless(in_array((int) $data['question_id'], $allowedIds, true), 422, 'Questão inválida para esta tentativa.');

        $question = Question::findOrFail($data['question_id']);

        if ($question->isWriting()) {
            return $this->answerWriting($request, $attempt, $question, $data);
        }

        /*
        | Ordenar e associar respondem a mesma coisa: uma permutação do que
        | está na tela. Na de ordenar, a posição i quer dizer "o i-ésimo
        | passo"; na de associar, "o par do i-ésimo item da esquerda". A
        | conta é idêntica, então o campo é o mesmo.
        */
        $sequencia = in_array($question->format, [Question::FORMAT_ORDER, Question::FORMAT_MATCH], true);
        $total = $question->format === Question::FORMAT_MATCH
            ? count($question->pairs ?? [])
            : count($question->options);

        $selected = ! $sequencia && isset($data['selected']) ? (int) $data['selected'] : null;
        abort_if($selected !== null && $selected >= count($question->options), 422, 'Alternativa inválida.');

        /*
        | Lista vazia é "pulei", e não uma sequência errada. A pessoa que
        | desiste e a que arrisca não merecem o mesmo registro.
        */
        $ordering = $sequencia && ! empty($data['ordering'])
            ? array_map('intval', array_values($data['ordering']))
            : null;

        /*
        | A alternativa chega como posição NA TELA, que foi embaralhada.
        | Guardamos e conferimos a posição ORIGINAL, a do conteúdo — assim a
        | resposta gravada continua valendo se a ordem na tela mudar.
        */
        $mostradas = $sequencia ? [] : StepShuffle::display($attempt->id, $question->id, count($question->options));
        if ($selected !== null) {
            $selected = $mostradas[$selected];
        }

        $isCorrect = $sequencia
            ? $ordering !== null && StepShuffle::isCorrect($ordering, $attempt->id, $question->id, $total)
            : $selected !== null && $selected === $question->correct_index;

        $xp = $isCorrect ? (int) config('castelei.xp_per_correct_answer') : 0;

        try {
            $attempt->answers()->create([
                'question_id' => $question->id,
                'selected_index' => $selected,
                'selected_order' => $ordering,
                'is_correct' => $isCorrect,
                'seconds' => (int) $data['seconds'],
                'xp' => $xp,
            ]);
        } catch (UniqueConstraintViolationException) {
            abort(409, 'Questão já respondida.');
        }

        // Gamificação nunca pode atrapalhar o estudo: se falhar, só registramos o erro.
        try {
            $this->gamification->recordStudyToday($request->user());
        } catch (Throwable $e) {
            report($e);
        }

        return response()->json([
            'is_correct' => $isCorrect,
            // A posição da certa NA TELA, que é a que o app sabe destacar.
            'correct_index' => $sequencia ? $question->correct_index : array_search($question->correct_index, $mostradas, true),
            /*
            | Na questão de ordenar, o gabarito é a sequência certa, escrita
            | por extenso. Mostrar "o índice 2 vinha antes do 0" não ensina
            | nada a quem errou a ordem.
            */
            'correct_order' => $question->format === Question::FORMAT_ORDER ? $question->options : null,
            /*
            | Na questão de associar, o gabarito são os pares por extenso.
            | Dizer "o índice 2 era o par do 0" não ensina nada.
            */
            'correct_pairs' => $question->format === Question::FORMAT_MATCH ? $question->pairs : null,
            'explanation' => $question->explanation,
            'pitfall' => $question->pitfall,
            // Só aparece para planos com gamificação (o XP é guardado para todos).
            'xp' => $request->user()->hasGamification() ? $xp : null,
        ]);
    }

    /**
     * A resposta de uma questão de escrita.
     *
     * Não existe "certa". O que conta como cumprida é a AUTOAVALIAÇÃO: a
     * pessoa leu o texto-modelo, passou pela lista de critérios e marcou o
     * que o texto dela já faz. A parte vale como cumprida quando todos os
     * itens estão marcados — e é essa conta que alimenta o resto do app sem
     * mudar nada nele: a porcentagem vira "partes que cumpriram todos os
     * critérios", o ponto fraco vira a parte que ficou devendo, e a revisão
     * espaçada agenda a lição pela mesma regra.
     *
     * Texto vazio é "pulei", como a lista vazia na questão de ordenar.
     *
     * @param  array<string, mixed>  $data
     */
    private function answerWriting(Request $request, Attempt $attempt, Question $question, array $data): JsonResponse
    {
        $texto = trim((string) ($data['text'] ?? ''));
        $criterios = $question->writing['checklist'] ?? [];

        // A lista chega do tamanho da tela; o que faltar conta como não marcado.
        $marcados = array_map(
            fn (int $i) => (bool) ($data['checklist'][$i] ?? false),
            array_keys($criterios),
        );

        $cumprida = $texto !== '' && ! in_array(false, $marcados, true);
        $xp = $cumprida ? (int) config('castelei.xp_per_correct_answer') : 0;

        try {
            $attempt->answers()->create([
                'question_id' => $question->id,
                'text' => $texto === '' ? null : $texto,
                'checklist' => $marcados,
                'is_correct' => $cumprida,
                'seconds' => (int) $data['seconds'],
                'xp' => $xp,
            ]);
        } catch (UniqueConstraintViolationException) {
            abort(409, 'Questão já respondida.');
        }

        try {
            $this->gamification->recordStudyToday($request->user());
        } catch (Throwable $e) {
            report($e);
        }

        return response()->json([
            'is_correct' => $cumprida,
            'correct_index' => null,
            'explanation' => $question->explanation,
            'pitfall' => $question->pitfall,
            'xp' => $request->user()->hasGamification() ? $xp : null,
        ]);
    }

    public function finish(Request $request, Attempt $attempt): JsonResponse
    {
        $this->ensureOwner($request, $attempt);

        $firstFinish = $attempt->finished_at === null;

        if ($firstFinish) {
            $answers = $attempt->answers()->get();

            $attempt->update([
                'finished_at' => now(),
                'correct_count' => $answers->where('is_correct', true)->count(),
                'avg_seconds' => $answers->isEmpty() ? null : round((float) $answers->avg('seconds'), 1),
            ]);
        }

        $attempt = $attempt->fresh();
        $result = $this->result($attempt);
        $result['gamification'] = $this->gamificationBlock($request->user(), $attempt, $result['is_record'], $firstFinish);
        $result['review'] = $this->reviewBlock($request->user(), $attempt, $firstFinish);

        return response()->json($result);
    }

    /**
     * Marca a volta desta lição e devolve quando ela é.
     *
     * Vai junto do resultado porque é ali que a informação vale: a pessoa
     * acabou de ver a nota e é o único momento em que "volte daqui a 13 dias"
     * quer dizer alguma coisa.
     *
     * Só agenda na PRIMEIRA conclusão da tentativa. Recarregar a tela de
     * resultado é a mesma prática, e reagendar ali empurraria a revisão para a
     * frente toda vez que alguém desse F5 — quem revisasse a página três vezes
     * ganharia três dias de folga. Praticar de novo continua reagendando, porque
     * aí a tentativa é outra.
     *
     * Como a gamificação, falha em silêncio: o resultado da lição vale mais que
     * o agendamento.
     *
     * @return array<string, mixed>|null
     */
    private function reviewBlock(User $user, Attempt $attempt, bool $firstFinish): ?array
    {
        try {
            $review = $firstFinish
                ? $this->reviews->schedule($user, $attempt)
                : $this->reviews->for($user, $attempt);

            if ($review === null) {
                return null;
            }

            return [
                'due_at' => $review->due_at->toIso8601String(),
                'interval_days' => $review->interval_days,
            ];
        } catch (Throwable $e) {
            report($e);

            return null;
        }
    }

    /**
     * Streak, XP e conquistas do resultado. Devolve null se o plano não inclui gamificação
     * ou se algo falhar (o resultado da lição é mais importante do que os pontos).
     *
     * @return array<string, mixed>|null
     */
    private function gamificationBlock(User $user, Attempt $attempt, bool $isRecord, bool $firstFinish): ?array
    {
        try {
            if ($firstFinish) {
                $this->gamification->awardBadges($user, $attempt, $isRecord); // ganha para todos, aparece para quem tem o plano
            }

            if (! $user->hasGamification()) {
                return null;
            }

            return [
                'xp_earned' => (int) $attempt->answers()->sum('xp'),
                'xp_total' => $this->gamification->xpTotal($user),
                'streak' => $this->gamification->streak($user),
                'new_badges' => $this->gamification->badgesAwardedIn($attempt),
            ];
        } catch (Throwable $e) {
            report($e);

            return null;
        }
    }

    private function ensureOwner(Request $request, Attempt $attempt): void
    {
        abort_unless((int) $attempt->user_id === (int) $request->user()->id, 404);
    }

    /** @return array<string, mixed> */
    private function result(Attempt $attempt): array
    {
        // O recorde compara com o mesmo desafio: a mesma lição, ou o simulado da mesma matéria.
        $previousBest = Attempt::query()
            ->where('user_id', $attempt->user_id)
            ->where('kind', $attempt->kind)
            ->when(
                $attempt->isExam(),
                fn ($query) => $query->where('subject_id', $attempt->subject_id),
                fn ($query) => $query->where('lesson_id', $attempt->lesson_id),
            )
            ->where('id', '!=', $attempt->id)
            ->whereNotNull('finished_at')
            ->whereNotNull('avg_seconds')
            ->min('avg_seconds');
        $previousBest = $previousBest === null ? null : (float) $previousBest;

        $weakTopic = DB::table('answers')
            ->join('questions', 'questions.id', '=', 'answers.question_id')
            ->where('answers.attempt_id', $attempt->id)
            ->where('answers.is_correct', false)
            ->selectRaw('questions.topic as topic, COUNT(*) as wrong')
            ->groupBy('questions.topic')
            ->orderByDesc('wrong')
            ->orderBy('topic')
            ->value('topic');

        // O simulado não tem "próxima lição": ele já atravessa a matéria toda.
        $lesson = $attempt->lesson;
        $next = $lesson
            ? Lesson::query()
                ->where('subject_id', $lesson->subject_id)
                ->where('position', '>', $lesson->position)
                ->orderBy('position')
                ->first(['id', 'title'])
            : null;

        return [
            'attempt_id' => $attempt->id,
            'kind' => $attempt->kind,
            'lesson_id' => $attempt->lesson_id,
            'subject_id' => $attempt->subject_id,
            'total' => $attempt->total_questions,
            'correct' => $attempt->correct_count,
            'percent' => (int) round($attempt->correct_count / max($attempt->total_questions, 1) * 100),
            'avg_seconds' => $attempt->avg_seconds,
            'previous_best_avg_seconds' => $previousBest,
            'is_record' => $previousBest !== null && $attempt->avg_seconds !== null && $attempt->avg_seconds < $previousBest,
            'weak_topic' => $weakTopic,
            'next_lesson' => $next ? ['id' => $next->id, 'title' => $next->title] : null,
            'limited_by_plan' => $lesson !== null && $lesson->questions()->where('exam_only', false)->count() > $attempt->total_questions,
            // Quantas desta lição estão erradas AGORA, contando esta tentativa. A tela oferece refazer só elas.
            'wrong_count' => $lesson !== null ? count(self::wrongQuestionIds($attempt->user_id, $lesson)) : 0,
        ];
    }
}
