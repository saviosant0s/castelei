"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { SettingsRow, Switch } from "@/components/ui";
import { chaveParaBytes, explicacao, registroPronto, suportado, type PushEstado } from "@/lib/push";

/*
| O interruptor do lembrete de revisão, no Perfil.
|
| Notificação é a função mais fácil de odiar num app. Três decisões que vêm
| disso:
|
| 1. DESLIGADO por padrão, e ligado só por toque. Pedir permissão sozinho, na
|    primeira visita, é o caminho mais curto para um "bloquear" permanente — e
|    permissão negada o app NÃO consegue reverter.
| 2. A promessa está escrita ao lado do botão: no máximo um por dia, e só
|    quando há lição vencida. Interruptor sem promessa é interruptor que a
|    pessoa desliga na primeira dúvida.
| 3. Estado bloqueado diz onde mexer, em vez de mostrar um botão que não faz
|    nada.
*/
export function PushToggle() {
  const [estado, setEstado] = useState<PushEstado>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const conferir = useCallback(async () => {
    if (!suportado()) {
      setEstado("indisponivel");

      return;
    }

    try {
      const resposta = await fetch("/api/push/key");
      const dados = (await resposta.json()) as { enabled?: boolean };

      if (!dados.enabled) {
        setEstado("desligado_no_servidor");

        return;
      }

      if (Notification.permission === "denied") {
        setEstado("negado");

        return;
      }

      const registro = await registroPronto();

      if (!registro) {
        // Sem service worker não há como receber push, e insistir não resolve.
        setEstado("indisponivel");

        return;
      }

      const assinatura = await registro.pushManager.getSubscription();
      setEstado(assinatura ? "ligado" : "desligado");
    } catch {
      setEstado("desligado_no_servidor");
    }
  }, []);

  /*
  | Aqui o efeito é o lugar certo, apesar da regra.
  |
  | O tema e o som usam `useSyncExternalStore` porque o valor deles existe
  | inteiro no `localStorage`, de leitura imediata. Este não existe: descobrir
  | se o aparelho está assinado exige esperar o service worker ficar pronto,
  | consultar o `pushManager` e ainda perguntar ao servidor se há chaves. Nada
  | disso é síncrono, então não há store para assinar — o `setEstado` acontece
  | depois de vários `await`, que é justamente o caso que a regra não cobre.
  */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver o comentário acima
    void conferir();
  }, [conferir]);

  async function ligar() {
    setOcupado(true);
    setErro(null);

    try {
      /*
      | A permissão é pedida DENTRO do toque. Alguns navegadores recusam o
      | pedido feito depois de um `await` longo, por considerá-lo fora do gesto.
      */
      const permissao = await Notification.requestPermission();

      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "negado" : "desligado");

        return;
      }

      const { public_key: chave } = (await (await fetch("/api/push/key")).json()) as {
        public_key: string | null;
      };

      if (!chave) {
        setEstado("desligado_no_servidor");

        return;
      }

      const registro = await registroPronto();

      if (!registro) {
        setEstado("indisponivel");

        return;
      }

      const assinatura = await registro.pushManager.subscribe({
        // Obrigatório: promete que todo push vira notificação visível. O
        // navegador desassina quem recebe push sem mostrar nada.
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(chave),
      });

      const resposta = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assinatura.toJSON()),
      });

      if (!resposta.ok) {
        /*
        | O servidor recusou: desfaz a assinatura no navegador. Sem isto, o
        | aparelho ficaria assinado sem ninguém do outro lado sabendo — e o
        | botão mostraria "ligado" para um lembrete que nunca chega.
        */
        await assinatura.unsubscribe();
        throw new Error("não deu");
      }

      setEstado("ligado");
    } catch {
      setErro("Não deu para ligar os lembretes agora. Tente de novo em instantes.");
      await conferir();
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    setErro(null);

    try {
      const registro = await registroPronto();
      const assinatura = await registro?.pushManager.getSubscription();

      if (assinatura) {
        // Avisa o servidor ANTES de desassinar: depois do `unsubscribe` o
        // endpoint some, e ficaria uma linha órfã mandando aviso para o vazio.
        await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: assinatura.endpoint }),
        }).catch(() => {});

        await assinatura.unsubscribe();
      }

      setEstado("desligado");
    } catch {
      setErro("Não deu para desligar agora. Tente de novo em instantes.");
      await conferir();
    } finally {
      setOcupado(false);
    }
  }

  const podeMexer = estado === "ligado" || estado === "desligado";

  return (
    <SettingsRow
      icon={estado === "negado" ? BellOff : Bell}
      iconTone="coral"
      title="Lembrete de revisão"
      description={
        <>
          {explicacao(estado)}
          {erro && (
            <span role="alert" className="mt-1 block text-brick">
              {erro}
            </span>
          )}
        </>
      }
      trailing={
        ocupado ? (
          <Loader2 className="size-6 shrink-0 animate-spin text-content-subtle" aria-label="Um instante" />
        ) : podeMexer ? (
          <Switch
            checked={estado === "ligado"}
            onChange={(ligar_) => void (ligar_ ? ligar() : desligar())}
            label="Lembrete de revisão"
          />
        ) : null
      }
    />
  );
}
