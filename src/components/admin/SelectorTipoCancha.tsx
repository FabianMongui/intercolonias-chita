import { cn } from '@/lib/utils'

export type TipoCancha = 'F11' | 'F6'

/** Control segmentado F11 / F6 (canchas y categorías). */
export function SelectorTipoCancha({
  valor,
  cambiar,
  etiqueta = 'Tipo',
}: {
  valor: TipoCancha
  cambiar: (tipo: TipoCancha) => void
  etiqueta?: string
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{etiqueta}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(['F11', 'F6'] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={valor === t}
            onClick={() => {
              cambiar(t)
            }}
            className={cn(
              'min-h-11 rounded-lg font-semibold focus-visible:outline-3 focus-visible:outline-ring',
              valor === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface',
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
