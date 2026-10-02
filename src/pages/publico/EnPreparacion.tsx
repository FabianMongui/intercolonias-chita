import { SelectorCategoria } from '@/components/SelectorCategoria'

// Marcador de posición de la Fase 1: cada sección se reemplaza por su pantalla real.
export function EnPreparacion({ titulo }: { titulo: string }) {
  return (
    <section className="flex flex-col gap-4">
      <title>{`${titulo} · Intercolonias Chita`}</title>
      <h1 className="text-4xl">{titulo}</h1>
      <SelectorCategoria />
      <p className="text-muted-foreground">Esta sección estará disponible pronto.</p>
    </section>
  )
}
