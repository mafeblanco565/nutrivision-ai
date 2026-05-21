import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-7xl">🍽️</p>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">404 — Página no encontrada</h1>
        <p className="text-muted-foreground text-sm">
          La página que buscas no existe o fue movida.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Volver al dashboard</Link>
      </Button>
    </main>
  );
}
