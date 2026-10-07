import { Trophy } from 'lucide-react'

/**
 * Marca del ganador (dato `ganador` de la base). Verde oscuro: ≥ 3:1 sobre blanco y crema
 * (WCAG 1.4.11); el dorado no alcanza. `compacta` = solo ícono, para filas angostas.
 */
export function MarcaGanador({ compacta = false }: { compacta?: boolean }) {
  if (compacta) {
    return (
      <>
        <Trophy aria-hidden className="size-4 shrink-0 text-primary" />
        <span className="sr-only"> (ganador)</span>
      </>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
      <Trophy aria-hidden className="size-3.5" />
      Ganó
    </span>
  )
}
