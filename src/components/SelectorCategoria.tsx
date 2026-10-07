import { Skeleton } from '@/components/ui/skeleton'
import { useCategoria } from '@/hooks/useCategoria'
import { useTorneoActivo } from '@/hooks/useTorneoActivo'
import { cn } from '@/lib/utils'

/**
 * Selector de categoría como control segmentado: una sola fila, segmentos del mismo ancho.
 * La elección vive en `?cat=`.
 */
export function SelectorCategoria() {
  const { isPending } = useTorneoActivo()
  const { categorias, categoria, elegir } = useCategoria()
  // Mientras llega el torneo se reserva el alto del control para que nada salte (CLS).
  if (isPending) return <Skeleton className="h-[52px] w-full rounded-xl" />
  if (categorias.length < 2) return null

  return (
    <div
      role="group"
      aria-label="Categoría"
      className="grid auto-cols-fr grid-flow-col gap-1 overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none]"
    >
      {categorias.map((c) => {
        const activa = c.id === categoria?.id
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={activa}
            onClick={() => {
              elegir(c.id)
            }}
            className={cn(
              'min-h-11 min-w-20 rounded-lg px-3 text-sm leading-tight font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-ring',
              activa
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-surface hover:text-foreground',
            )}
          >
            {c.nombre}
          </button>
        )
      })}
    </div>
  )
}
