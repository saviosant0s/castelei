<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Plans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ], [
            'name.required' => 'Informe seu nome.',
            'email.required' => 'Informe seu e-mail.',
            'email.email' => 'Informe um e-mail válido.',
            'email.unique' => 'Este e-mail já está cadastrado.',
            'password.required' => 'Crie uma senha.',
            'password.min' => 'A senha precisa ter pelo menos 8 caracteres.',
        ]);

        $user = User::create($data);

        return response()->json([
            'user' => self::userPayload($user),
            'token' => $user->createToken('web')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Informe seu e-mail.',
            'email.email' => 'Informe um e-mail válido.',
            'password.required' => 'Informe sua senha.',
        ]);

        $user = User::where('email', Str::lower(trim($credentials['email'])))->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-mail ou senha incorretos.'],
            ]);
        }

        return response()->json([
            'user' => self::userPayload($user),
            'token' => $user->createToken('web')->plainTextToken,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Apaga a conta e tudo que veio com ela. Não tem volta.
     *
     * A Google Play exige um caminho de exclusão dentro do app, e a nossa
     * Política de Privacidade promete o mesmo. Tentativas, respostas, dias de
     * estudo e conquistas caem por cascata no banco; os tokens saem antes,
     * porque o Sanctum guarda o dono por relação polimórfica e o banco não
     * apaga sozinho.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * O visitante vira conta de verdade, SEM perder nada.
     *
     * Criar uma conta nova do zero deixaria o histórico para trás: as
     * tentativas, a revisão agendada, o streak e as conquistas moram no
     * usuário de visitante. Então não se cria outro usuário — o mesmo ganha
     * nome, e-mail e senha. Todo o resto continua preso a ele, e o token da
     * sessão atual segue valendo.
     *
     * Só para visitante: conta de verdade troca e-mail e senha por outro
     * caminho, com confirmação, e não por aqui.
     */
    public function claim(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isGuest(), 409, 'Esta conta já tem e-mail e senha.');

        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email', 'not_regex:/@guest\.invalid$/'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ], [
            'name.required' => 'Informe seu nome.',
            'email.required' => 'Informe seu e-mail.',
            'email.email' => 'Informe um e-mail válido.',
            'email.unique' => 'Este e-mail já tem conta. Use "Entrar" para acessá-la.',
            'email.not_regex' => 'Informe um e-mail válido.',
            'password.required' => 'Crie uma senha.',
            'password.min' => 'A senha precisa ter pelo menos 8 caracteres.',
        ]);

        // O cast `hashed` do modelo guarda a senha como hash.
        $user->update($data);

        return response()->json(['user' => self::userPayload($user->fresh())]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => self::userPayload($request->user())]);
    }

    /** @return array<string, mixed> */
    public static function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $user->plan,
            'is_admin' => $user->isAdmin(),
            // Visitante: o progresso mora só neste navegador até virar conta.
            'is_guest' => $user->isGuest(),
            'effective_plan' => $user->effectivePlan(),
            'plan_label' => $user->planLabel(),
            'questions_per_lesson' => $user->questionLimit(),
            // Fase de testes: tudo liberado, seja qual for o plano guardado.
            'unlocked_for_testing' => Plans::unlockedForEveryone(),
        ];
    }
}
