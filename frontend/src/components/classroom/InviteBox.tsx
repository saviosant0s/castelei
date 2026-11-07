"use client";

import { useEffect, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { formatCode } from "@/lib/classrooms";

/**
 * O convite: o código para falar em sala e o link para mandar no grupo.
 *
 * O endereço do link sai do próprio navegador depois de montar a tela: no
 * servidor não há janela, e um endereço fixo quebraria nas prévias.
 */
export function InviteBox({ code }: { code: string }) {
  const [link, setLink] = useState(`/turmas/entrar/${code}`);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Só no navegador existe o endereço do site e o botão de compartilhar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLink(`${window.location.origin}/turmas/entrar/${code}`);
    setCanShare(typeof navigator.share === "function");
  }, [code]);

  async function copy(text: string, what: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-content-subtle">Código da turma</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-[0.2em]">{formatCode(code)}</p>
      </div>
      {/* Em tela estreita, um embaixo do outro: lado a lado, os rótulos quebravam em duas linhas. */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn btn-ghost flex-1 border-2 border-ink/15" onClick={() => copy(formatCode(code), "code")}>
          <Copy className="size-4" aria-hidden={true} />
          {copied === "code" ? "Copiado" : "Copiar código"}
        </button>
        {canShare ? (
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => navigator.share({ title: "Entre na minha turma no Castelei", url: link }).catch(() => undefined)}
          >
            <Share2 className="size-4" aria-hidden={true} />
            Mandar convite
          </button>
        ) : (
          <button type="button" className="btn btn-primary flex-1" onClick={() => copy(link, "link")}>
            <Copy className="size-4" aria-hidden={true} />
            {copied === "link" ? "Link copiado" : "Copiar link"}
          </button>
        )}
      </div>
    </div>
  );
}
