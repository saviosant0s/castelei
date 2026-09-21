import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Excluir sua conta",
  description: "Como apagar sua conta do Castelei e todo o histórico de estudo.",
};

/*
| A Google Play pede uma URL pública, fora do app, explicando como excluir a
| conta — para quem desinstalou ou não consegue entrar. Por isso esta página
| abre sem login, igual à de privacidade.
*/
const contato = process.env.CONTACT_EMAIL?.trim();

export default function ExcluirConta() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-6">
      <h1 className="text-4xl">Excluir sua conta</h1>

      <div className="mt-8 space-y-8 text-base leading-relaxed">
        <section>
          <h2 className="text-2xl">Pelo próprio app</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Abra o Castelei e entre na sua conta.</li>
            <li>
              Vá em <strong>Perfil</strong>, no menu de baixo.
            </li>
            <li>
              Em <strong>Sua conta</strong>, toque em <strong>Excluir minha conta</strong> e confirme.
            </li>
          </ol>
          <Link href="/perfil" className="btn btn-primary mt-5">
            Ir para o Perfil
          </Link>
        </section>

        <section>
          <h2 className="text-2xl">O que é apagado</h2>
          <p className="mt-3">
            Tudo: seu cadastro (nome e e-mail), o histórico de questões respondidas, o acerto por tópico,
            os tempos, o XP, os dias seguidos e as conquistas. A exclusão é imediata e{" "}
            <strong>não tem volta</strong> — não guardamos cópia para restaurar depois.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Se você não consegue entrar</h2>
          <p className="mt-3">
            {contato ? (
              <>
                Escreva para{" "}
                <a className="font-bold underline underline-offset-4" href={`mailto:${contato}`}>
                  {contato}
                </a>{" "}
                do mesmo e-mail cadastrado, pedindo a exclusão. Respondemos em até 15 dias, como manda a LGPD.
              </>
            ) : (
              <>
                Use o e-mail de contato que aparece na ficha do Castelei na Google Play, escrevendo do mesmo
                e-mail cadastrado. Respondemos em até 15 dias, como manda a LGPD.
              </>
            )}
          </p>
        </section>
      </div>
    </main>
  );
}
