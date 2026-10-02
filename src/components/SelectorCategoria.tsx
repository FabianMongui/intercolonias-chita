import { useCategoria } from '@/hooks/useCategoria'
import { cn } from '@/lib/utils'

/** Selector de categoría (Única / Veteranos / Femenino…). La elección vive en `?cat=`. */
export function SelectorCategoria() {
  const { categorias, categoria, elegir } = useCategoria()
  if (categorias.length < 2) return null

  return (
    <div role="group" aria-label="Categoría" className="flex gap-2 overflow-x-auto pb-1">
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
              'min-h-11 shrink-0 rounded-full border px-4 font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
              activa
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-foreground hover:bg-muted',
            )}
          >
            {c.nombre}
          </button>
        )
      })}
    </div>
  )
}
