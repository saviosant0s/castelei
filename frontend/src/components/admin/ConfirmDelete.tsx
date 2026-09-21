"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Aviso, Button, TextField } from "@/components/admin/Form";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { messageOf } from "@/lib/client";

interface Props {
  /** rota do painel, sem o /api/admin */
  path: string;
  /** o que a pessoa precisa digitar para confirmar */
  nome: string;
  rotulo: string;
  aviso: string;
  onDeleted: () => void;
}

/**
 * Exclusão que pede o nome digitado.
 *
 * Não é burocracia: apagar uma lição leva junto, por cascata no banco, as
 * tentativas e respostas de quem já estudou ela. Isso não tem volta e não
 * aparece em lugar nenhum antes de acontecer — digitar o nome é o que
 * transforma um clique distraído em uma decisão.
 */
export function ConfirmDelete({ path, nome, rotulo, aviso, onDeleted }: Props) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function apagar() {
    setBusy(true);
    setErro(null);

    try {
      await adminFetch(path, { method: "DELETE", body: { confirm: texto } });
      onDeleted();
    } catch (error) {
      setErro(messageOf(error));
      setBusy(false);
    }
  }

  if (!aberto) {
    return (
      <Button peso="perigo" onClick={() => setAberto(true)}>
        <span className="flex items-center gap-2">
          <Trash2 className="size-4" aria-hidden="true" />
          {rotulo}
        </span>
      </Button>
    );
  }

  return (
    <Card tone="outline" className="space-y-4">
      <Aviso tipo="atencao">{aviso}</Aviso>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <TextField
        label={`Digite "${nome}" para confirmar`}
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        autoComplete="off"
      />

      <div className="flex gap-3">
        <Button peso="perigo" disabled={busy || texto.trim() !== nome} onClick={apagar}>
          {busy ? "Apagando…" : "Apagar para sempre"}
        </Button>
        <Button
          onClick={() => {
            setAberto(false);
            setTexto("");
            setErro(null);
          }}
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
