import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Botón de filtro tipo chip (≥ 44 px). Va dentro de un `role="group"` con `aria-label`. */
export function ChipFiltro({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'min-h-11 shrink-0 rounded-full border px-4 font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
        activo
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-surface text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
