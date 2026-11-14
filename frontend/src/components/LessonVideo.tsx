"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * O vídeo de uma etapa.
 *
 * Dois caminhos, porque são dois problemas diferentes: um arquivo curto
 * enviado pelo painel toca no próprio app, e um vídeo longo mora no YouTube —
 * hospedar aula inteira sairia caro e ainda teria que resolver sozinho
 * legenda, qualidade e conexão ruim.
 *
 * O link do YouTube é reescrito para o endereço de incorporação. Colar o link
 * da barra de endereços é o que qualquer pessoa faz, e ele não funciona dentro
 * de um quadro — a tela ficaria em branco sem dizer por quê.
 */
export function youtubeId(src: string): string | null {
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") return url.pathname.slice(1) || null;

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const match = url.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/);
      return match?.[1] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

interface Props {
  video: { src: string; title?: string; caption?: string; poster?: string };
}

export function LessonVideo({ video }: Props) {
  const id = youtubeId(video.src);
  const titulo = video.title ?? "Vídeo da lição";
  const [tocando, setTocando] = useState(false);

  return (
    <figure className="mt-6 overflow-hidden rounded-2xl bg-surface-raised p-3 shadow-lift">
      {id ? (
        /*
        | A miniatura primeiro, o vídeo só no toque. O quadro do YouTube pesa
        | quase 1 MB e liga o player assim que a etapa abre: quem estuda no
        | ônibus, com pacote de dados, pagaria por um vídeo que talvez nem
        | queira ver. A miniatura é uma imagem só.
        */
        tocando ? (
          <iframe
            // O domínio sem cookie não acompanha quem assiste. O app é de estudo,
            // e a política de privacidade não promete rastrear ninguém.
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={titulo}
            allow="accelerometer; autoplay; clipped-media; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full rounded-xl border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setTocando(true)}
            aria-label={`Assistir: ${titulo}`}
            className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover opacity-90" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-sky text-on-accent transition group-hover:scale-105">
                <Play className="ml-1 size-8" aria-hidden="true" />
              </span>
            </span>
          </button>
        )
      ) : (
        <video
          src={video.src}
          poster={video.poster}
          controls
          preload="metadata"
          title={titulo}
          className="aspect-video w-full rounded-xl bg-black"
        >
          <track kind="captions" />
        </video>
      )}

      {(video.caption || video.title) && (
        <figcaption className="mt-2 px-2 pb-1 text-sm text-ink/70">{video.caption ?? video.title}</figcaption>
      )}
    </figure>
  );
}
