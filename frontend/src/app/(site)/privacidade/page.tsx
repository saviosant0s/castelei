import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "O que o Castelei guarda, por quê, e como apagar seus dados.",
};

/*
| Página pública e fora do app: a Play Store exige uma URL de política de
| privacidade que abra sem login. Por isso ela não fica em (app).
|
| O conteúdo descreve o que o sistema realmente faz hoje. Se o app passar a
| coletar outra coisa — pagamento, login do Google, analytics —, esta página
| muda junto, e a ficha de Segurança de Dados no Play Console também.
*/
const ATUALIZADA_EM = "21 de setembro de 2026";

const contato = process.env.CONTACT_EMAIL?.trim();

export default function Privacidade() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-6">
      <h1 className="text-4xl">Política de Privacidade</h1>
      <p className="mt-2 text-base text-content-subtle">Atualizada em {ATUALIZADA_EM}.</p>

      <div className="mt-8 space-y-8 text-base leading-relaxed">
        <section>
          <h2 className="text-2xl">Em uma frase</h2>
          <p className="mt-3">
            O Castelei guarda o mínimo para o app funcionar: quem é você e como você está indo nos estudos.
            Não vendemos seus dados, não exibimos anúncios e não usamos rastreadores de terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">O que guardamos</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Cadastro:</strong> seu nome e seu e-mail. A senha é guardada apenas como um código
              embaralhado (hash), que não permite recuperar a senha original — nem por nós.
            </li>
            <li>
              <strong>Estudo:</strong> as questões que você respondeu, se acertou, quanto tempo levou em cada
              uma, e os números que vêm disso: acerto por tópico, tempo médio, XP, dias seguidos e conquistas.
            </li>
            <li>
              <strong>Textos:</strong> em Produção Textual, o que você escreve e entrega em cada parte, junto
              da sua autoavaliação. O rascunho que ainda não foi entregue fica só no seu aparelho.
            </li>
            <li>
              <strong>Plano:</strong> qual plano está associado à sua conta.
            </li>
          </ul>
          <p className="mt-3">
            Não pedimos nem guardamos telefone, endereço, documentos, contatos, localização, fotos, microfone
            ou câmera. Não há pagamento integrado ao app no momento, então não recebemos dados de cartão.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Para que usamos</h2>
          <p className="mt-3">
            Só para o app fazer o que promete: manter sua conta, mostrar seu progresso, decidir o que você já
            domina e o que vale revisar, e manter o streak e as conquistas. Não usamos esses dados para
            publicidade nem para criar perfis fora do app.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Com quem compartilhamos</h2>
          <p className="mt-3">
            Com ninguém, para fins comerciais. Seus dados ficam no banco de dados do Castelei, hospedado na
            Railway, que atua apenas como fornecedor de infraestrutura. Podemos divulgar informação se formos
            obrigados por lei ou ordem judicial.
          </p>
          <p className="mt-3">
            <strong>Correção de textos.</strong> Quando você toca em “Conferir” em Produção Textual, o texto é
            enviado ao LanguageTool, um corretor de ortografia e gramática da empresa LanguageTooler GmbH, na
            Alemanha, só para apontar os erros. Não vai junto seu nome nem seu e-mail. Se a correção por
            inteligência artificial estiver ligada e você tocar em “Corrigir com IA”, o texto vai também para
            a Anthropic, com o mesmo fim. O botão “Copiar para corrigir com IA” não envia nada: só copia o
            texto para você colar onde quiser.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Modo visitante</h2>
          <p className="mt-3">
            Durante a fase de testes, o app pode criar uma conta de visitante automaticamente, sem pedir seus
            dados. Ela existe só para guardar seu progresso naquele aparelho e não tem nome nem e-mail
            verdadeiros.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Seus direitos</h2>
          <p className="mt-3">
            Pela LGPD (Lei 13.709/2018), você pode pedir para ver, corrigir ou apagar seus dados, e pedir uma
            cópia deles. Atendemos em até 15 dias. Apagar a conta apaga também todo o histórico de estudo —
            essa ação não tem volta.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Quanto tempo guardamos</h2>
          <p className="mt-3">
            Enquanto sua conta existir. Se você pedir a exclusão, apagamos os dados na sequência, salvo o que
            a lei exigir manter.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Crianças e adolescentes</h2>
          <p className="mt-3">
            O Castelei é feito para quem estuda para provas e não é direcionado a menores de 13 anos. Menores
            de 18 devem usar com acompanhamento de um responsável.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Mudanças</h2>
          <p className="mt-3">
            Se esta política mudar, a data no topo muda junto. Mudanças relevantes serão avisadas dentro do
            app.
          </p>
        </section>

        <section>
          <h2 className="text-2xl">Falar com a gente</h2>
          <p className="mt-3">
            {contato ? (
              <>
                Escreva para <a className="font-bold underline underline-offset-4" href={`mailto:${contato}`}>{contato}</a>.
              </>
            ) : (
              <>Use o e-mail de contato que aparece na ficha do Castelei na Google Play.</>
            )}
          </p>
        </section>
      </div>

      <Link href="/inicio" className="btn btn-primary mt-10">
        Voltar ao app
      </Link>
    </main>
  );
}
