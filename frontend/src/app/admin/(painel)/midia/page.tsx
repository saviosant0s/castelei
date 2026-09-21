import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { Card } from "@/components/ui";
import { adminGet } from "@/lib/admin";
import type { MediaItem } from "@/lib/admin-types";

export const metadata: Metadata = { title: "Mídia" };

interface Resposta {
  media: MediaItem[];
  limits: { max_image_kb: number; max_video_kb: number };
}

export default async function Midia() {
  const { media, limits } = await adminGet<Resposta>("/media");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl">Biblioteca de mídia</h1>
        <p className="text-base text-content-secondary">
          Envie a imagem ou o vídeo aqui, copie o endereço e cole dentro da etapa da lição.
        </p>
      </header>

      <Card tone="sky" className="space-y-3">
        <h2 className="text-xl">Como usar numa etapa</h2>
        <p className="text-base">Cole o endereço copiado no campo <code className="font-mono text-sm">src</code>:</p>
        <pre className="overflow-x-auto rounded-control bg-surface-raised p-4 font-mono text-sm">{`"figure": {
  "src": "https://…/api/media/midia/images/exemplo-a1b2c3.png",
  "alt": "O que a figura mostra, em uma frase.",
  "caption": "A legenda que aparece embaixo."
}

"video": {
  "src": "https://www.youtube.com/watch?v=…",
  "title": "Título do vídeo",
  "caption": "O que o vídeo mostra."
}`}</pre>
      </Card>

      <MediaLibrary media={media} limits={limits} />
    </div>
  );
}
