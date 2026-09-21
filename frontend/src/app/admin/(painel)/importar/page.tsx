import type { Metadata } from "next";
import { ImportForm, TemplateLink } from "@/components/admin/ImportForm";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Importar" };

export default function Importar() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl">Importar matéria</h1>
        <p className="text-base text-content-secondary">
          Um arquivo JSON traz a matéria inteira: lições, etapas e questões. Importar de novo o mesmo arquivo não
          duplica nada — atualiza o que mudou.
        </p>
      </header>

      <Card tone="sky" className="space-y-3">
        <h2 className="text-xl">Como fazer</h2>
        <ol className="list-inside list-decimal space-y-1.5 text-base">
          <li>Baixe o modelo: ele traz a estrutura certa com os campos explicados.</li>
          <li>Peça o conteúdo a uma IA usando o modelo como base.</li>
          <li>Confira aqui antes de publicar. Nada é gravado nessa etapa.</li>
          <li>Importe.</li>
        </ol>
        <TemplateLink />
      </Card>

      <ImportForm />
    </div>
  );
}
