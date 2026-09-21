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

  return (
    <figure className="mt-6 overflow-hidden rounded-2xl bg-surface-raised p-3 shadow-lift">
      {id ? (
        <iframe
          // O domínio sem cookie não acompanha quem assiste. O app é de estudo,
          // e a política de privacidade não promete rastrear ninguém.
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={titulo}
          allow="accelerometer; autoplay; clipped-media; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-xl border-0"
        />
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
