"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Trash2 } from "lucide-react";
import { Aviso, Button, TextField } from "@/components/admin/Form";
import { Card } from "@/components/ui";
import { adminFetch } from "@/lib/admin-client";
import { messageOf } from "@/lib/client";
import type { MediaItem } from "@/lib/admin-types";

interface Props {
  media: MediaItem[];
  limits: { max_image_kb: number; max_video_kb: number };
}

export function MediaLibrary({ media, limits }: Props) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const ehVideo = arquivo?.type.startsWith("video/") ?? false;

  function escolher(event: ChangeEvent<HTMLInputElement>) {
    setArquivo(event.target.files?.[0] ?? null);
    setErro(null);
    setEnviado(false);
  }

  async function enviar() {
    if (!arquivo) return;

    setBusy(true);
    setErro(null);

    const form = new FormData();
    form.append("file", arquivo);
    if (alt.trim() !== "") form.append("alt", alt);

    try {
      await adminFetch("/media", { method: "POST", body: form });
      setArquivo(null);
      setAlt("");
      setEnviado(true);
      router.refresh();
    } catch (error) {
      setErro(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <h2 className="text-xl">Enviar arquivo</h2>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {enviado && <Aviso tipo="ok">Enviado. O endereço está na lista abaixo.</Aviso>}

        <label className="block space-y-2">
          <span className="text-sm text-content-subtle">Imagem ou vídeo</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/ogg"
            onChange={escolher}
            className="block w-full cursor-pointer rounded-control bg-surface-sunken px-4 py-3 text-base file:mr-4 file:cursor-pointer file:rounded-pill file:border-0 file:bg-surface-bold file:px-4 file:py-2 file:text-sm file:font-bold file:text-on-bold"
          />
          <span className="block text-sm text-content-subtle">
            Imagens até {Math.round(limits.max_image_kb / 1024)} MB (PNG, JPEG, WebP, GIF, SVG). Vídeos até{" "}
            {Math.round(limits.max_video_kb / 1024)} MB (MP4, WebM, OGG). Vídeo maior que isso, hospede no YouTube e
            cole o link na etapa.
          </span>
        </label>

        {!ehVideo && (
          <TextField
            label="Descrição da imagem"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            hint="Descreva o que a imagem mostra, em uma frase, para quem não pode vê-la. É obrigatória quando a imagem entra numa etapa."
          />
        )}

        <Button peso="principal" onClick={enviar} disabled={!arquivo || busy}>
          {busy ? "Enviando…" : "Enviar"}
        </Button>
      </Card>

      {media.length === 0 ? (
        <Card tone="dashed">
          <p className="text-base text-content-secondary">
            Nenhum arquivo ainda. As figuras das lições de Sistemas Operacionais não aparecem aqui: elas moram no
            próprio app e o endereço delas começa com <code className="font-mono text-sm">/figuras/</code>.
          </p>
        </Card>
      ) : (
        <section aria-labelledby="enviados" className="space-y-4">
          <h2 id="enviados" className="text-2xl">
            {media.length} {media.length === 1 ? "arquivo" : "arquivos"}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {media.map((item) => (
              <li key={item.id}>
                <MediaCard item={item} onChange={() => router.refresh()} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function MediaCard({ item, onChange }: { item: MediaItem; onChange: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não deu para copiar. Selecione o endereço e copie à mão.");
    }
  }

  async function apagar() {
    setBusy(true);
    setErro(null);

    try {
      await adminFetch(`/media/${item.id}`, { method: "DELETE" });
      onChange();
    } catch (error) {
      setErro(messageOf(error));
      setBusy(false);
    }
  }

  return (
    <Card size="sm" className="flex h-full flex-col gap-3">
      <div className="overflow-hidden rounded-control bg-surface-sunken">
        {item.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.alt ?? ""} className="h-36 w-full object-contain" loading="lazy" />
        ) : (
          <video src={item.url} controls preload="metadata" className="h-36 w-full bg-black object-contain">
            <track kind="captions" />
          </video>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold" title={item.original_name}>
          {item.original_name}
        </p>
        <p className="text-sm text-content-subtle">
          {item.kind === "image" ? "Imagem" : "Vídeo"} · {(item.size / 1024).toFixed(0)} kB
        </p>
        {item.kind === "image" && !item.alt && (
          <p className="mt-1 text-sm text-brick">Sem descrição: não pode entrar numa etapa assim.</p>
        )}
      </div>

      {erro && <p className="text-sm text-brick">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copiar}
          className="flex flex-1 items-center justify-center gap-2 rounded-control bg-surface-sunken px-3 py-2 text-sm font-bold"
        >
          {copiado ? <Check className="size-4 text-sage" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copiado ? "Copiado" : "Copiar endereço"}
        </button>
        <button
          type="button"
          onClick={apagar}
          disabled={busy}
          aria-label={`Apagar ${item.original_name}`}
          className="rounded-control bg-surface-sunken px-3 py-2 text-content-faint transition hover:text-brick disabled:opacity-40"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}
