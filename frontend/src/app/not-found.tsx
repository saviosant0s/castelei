import Link from "next/link";
import { CastleMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div className="space-y-5">
        <CastleMark className="mx-auto size-16" />
        <h1 className="text-2xl">Essa página não existe</h1>
        <p className="text-base text-ink/70">O link pode estar errado ou a lição mudou de lugar.</p>
        <Link href="/inicio" className="btn btn-primary">Voltar ao início</Link>
      </div>
    </main>
  );
}
