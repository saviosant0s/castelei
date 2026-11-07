<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Attempt;
use App\Models\Classroom;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Turmas: o professor acompanha a turma numa matéria.
 *
 * Três decisões:
 * - Turma não guarda progresso. O progresso continua em cada aluno; a turma é
 *   só a lista de quem aceitou mostrar o seu ao dono, e só naquela matéria.
 * - Quem não é dono nem aluno recebe 404, e não 403: 403 confirmaria que a
 *   turma existe (mesma regra das matérias privadas).
 * - O dono nunca vê o e-mail de ninguém. Vê o nome que a pessoa escolheu.
 */
class ClassroomController extends Controller
{
    /** As turmas que a pessoa criou e as em que entrou. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $owned = Classroom::with('subject:id,name,slug')
            ->withCount('members')
            ->where('owner_id', $user->id)
            ->latest()
            ->get()
            ->map(fn (Classroom $c) => $this->summary($c) + ['members_count' => $c->members_count]);

        $joined = $user->belongsToMany(Classroom::class, 'classroom_members')
            ->with(['subject:id,name,slug', 'owner:id,name'])
            ->latest('classroom_members.created_at')
            ->get()
            ->map(fn (Classroom $c) => $this->summary($c) + ['owner' => ['name' => $c->owner->name]]);

        return response()->json([
            'owned' => $owned,
            'joined' => $joined,
            'can_create' => $user->hasClassrooms() && ! $user->isGuest(),
            // Só matéria pública vira turma: o aluno precisa enxergar a matéria.
            'subjects' => Subject::where('visibility', Subject::PUBLIC)->orderBy('position')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->isGuest(), 403, 'Crie sua conta para montar uma turma.');
        abort_unless($user->hasClassrooms(), 403, 'Criar turma faz parte do plano Pro.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'subject_id' => ['required', 'integer'],
        ], [
            'name.required' => 'Dê um nome para a turma.',
            'name.max' => 'Use até 80 letras no nome.',
        ]);

        $subject = Subject::whereKey($data['subject_id'])->where('visibility', Subject::PUBLIC)->first();
        if (! $subject) {
            return response()->json(['message' => 'Escolha uma matéria da lista.', 'errors' => ['subject_id' => ['Escolha uma matéria da lista.']]], 422);
        }

        if (Classroom::where('owner_id', $user->id)->count() >= Classroom::MAX_OWNED) {
            return response()->json(['message' => 'Você chegou ao limite de '.Classroom::MAX_OWNED.' turmas. Apague uma antiga para criar outra.'], 422);
        }

        $classroom = Classroom::create([
            'owner_id' => $user->id,
            'subject_id' => $subject->id,
            'name' => trim($data['name']),
            'code' => Classroom::newCode(),
        ]);

        return response()->json(['classroom' => $this->summary($classroom->load('subject:id,name,slug'))], 201);
    }

    /** O que a tela de entrar mostra ANTES de a pessoa aceitar: de quem é e de que matéria. */
    public function preview(Request $request, string $code): JsonResponse
    {
        $classroom = Classroom::with(['subject:id,name,slug', 'owner:id,name'])
            ->where('code', Classroom::normalizeCode($code))
            ->firstOrFail();

        $user = $request->user();

        return response()->json(['classroom' => $this->summary($classroom) + [
            'owner' => ['name' => $classroom->owner->name],
            'is_owner' => $classroom->isOwner($user),
            'is_member' => $classroom->hasMember($user),
        ]]);
    }

    public function join(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->isGuest(), 403, 'Crie sua conta para entrar numa turma.');

        $data = $request->validate(['code' => ['required', 'string', 'max:20']], ['code.required' => 'Digite o código da turma.']);

        $classroom = Classroom::where('code', Classroom::normalizeCode($data['code']))->first();
        if (! $classroom) {
            return response()->json(['message' => 'Não achamos uma turma com esse código.', 'errors' => ['code' => ['Não achamos uma turma com esse código.']]], 422);
        }
        if ($classroom->isOwner($user)) {
            return response()->json(['message' => 'Esta turma é sua: você já acompanha todos dela.'], 422);
        }
        if (! $classroom->hasMember($user) && $classroom->members()->count() >= Classroom::MAX_MEMBERS) {
            return response()->json(['message' => 'Esta turma já está cheia.'], 422);
        }

        $classroom->members()->syncWithoutDetaching([$user->id]);

        return response()->json(['classroom' => ['id' => $classroom->id]]);
    }

    public function show(Request $request, Classroom $classroom): JsonResponse
    {
        $user = $request->user();
        $isOwner = $classroom->isOwner($user);
        abort_unless($isOwner || $classroom->hasMember($user), 404);

        $classroom->load(['subject:id,name,slug', 'owner:id,name']);
        $base = $this->summary($classroom) + ['owner' => ['name' => $classroom->owner->name], 'is_owner' => $isOwner];

        if (! $isOwner) {
            return response()->json(['classroom' => $base]);
        }

        [$members, $lessons] = $this->performance($classroom);

        return response()->json([
            'classroom' => $base + ['code' => $classroom->code],
            'members' => $members,
            'lessons' => $lessons,
        ]);
    }

    /** O aluno sai da turma. O progresso dele não muda: só deixa de ser visto. */
    public function leave(Request $request, Classroom $classroom): JsonResponse
    {
        // Quem não está na turma não confirma, saindo, que ela existe.
        abort_unless($classroom->hasMember($request->user()), 404);
        $classroom->members()->detach($request->user()->id);

        return response()->json(['left' => true]);
    }

    public function removeMember(Request $request, Classroom $classroom, User $user): JsonResponse
    {
        abort_unless($classroom->isOwner($request->user()), 404);
        $classroom->members()->detach($user->id);

        return response()->json(['removed' => true]);
    }

    public function destroy(Request $request, Classroom $classroom): JsonResponse
    {
        abort_unless($classroom->isOwner($request->user()), 404);
        $classroom->delete();

        return response()->json(['deleted' => true]);
    }

    /** @return array<string, mixed> */
    private function summary(Classroom $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'subject' => $c->subject ? ['id' => $c->subject->id, 'name' => $c->subject->name, 'slug' => $c->subject->slug] : null,
            'created_at' => $c->created_at?->toIso8601String(),
        ];
    }

    /**
     * O desempenho da turma na matéria.
     *
     * A mesma regra do Progresso: vale a ÚLTIMA resposta de cada questão, em
     * tentativa concluída. A média diria como o aluno foi; a última resposta
     * diz o que ele sabe hoje — e é isso que o professor precisa ver.
     *
     * @return array{0: list<array<string, mixed>>, 1: list<array<string, mixed>>}
     */
    private function performance(Classroom $classroom): array
    {
        $lessons = $classroom->subject->lessons()->get(['id', 'title', 'position']);
        $lessonIds = $lessons->pluck('id')->all();
        $members = $classroom->members()->orderBy('name')->get(['users.id', 'users.name']);
        $memberIds = $members->pluck('id')->all();

        $attempts = Attempt::whereIn('user_id', $memberIds ?: [0])
            ->whereIn('lesson_id', $lessonIds ?: [0])
            ->whereNotNull('finished_at')
            ->get(['id', 'user_id', 'lesson_id', 'finished_at']);

        // A última resposta de cada pessoa em cada questão.
        $latest = Answer::query()
            ->join('attempts', 'attempts.id', '=', 'answers.attempt_id')
            ->whereIn('answers.attempt_id', $attempts->pluck('id')->all() ?: [0])
            ->orderBy('answers.id')
            ->get(['answers.question_id', 'answers.is_correct', 'attempts.user_id', 'attempts.lesson_id'])
            ->keyBy(fn ($a) => $a->user_id.':'.$a->question_id);

        $now = Carbon::now();
        $byUser = $attempts->groupBy('user_id');
        $answersByUser = $latest->groupBy('user_id');

        $memberRows = $members->map(function (User $m) use ($byUser, $answersByUser, $lessons, $now) {
            $tries = $byUser->get($m->id, collect());
            $answers = $answersByUser->get($m->id, collect());
            $last = $tries->max('finished_at');

            return [
                'id' => $m->id,
                'name' => $m->name,
                'practiced' => $tries->pluck('lesson_id')->unique()->count(),
                'total_lessons' => $lessons->count(),
                'accuracy' => $answers->isEmpty() ? null : (int) round(100 * $answers->where('is_correct', true)->count() / $answers->count()),
                'last_studied_at' => $last ? Carbon::parse($last)->toIso8601String() : null,
                'days_inactive' => $last ? (int) Carbon::parse($last)->startOfDay()->diffInDays($now->copy()->startOfDay()) : null,
            ];
        })->values()->all();

        $answersByLesson = $latest->groupBy('lesson_id');
        $triesByLesson = $attempts->groupBy('lesson_id');

        $lessonRows = $lessons->map(function ($l) use ($answersByLesson, $triesByLesson) {
            $answers = $answersByLesson->get($l->id, collect());

            return [
                'id' => $l->id,
                'title' => $l->title,
                'position' => $l->position,
                'practiced' => $triesByLesson->get($l->id, collect())->pluck('user_id')->unique()->count(),
                'accuracy' => $answers->isEmpty() ? null : (int) round(100 * $answers->where('is_correct', true)->count() / $answers->count()),
            ];
        })->values()->all();

        return [$memberRows, $lessonRows];
    }
}
