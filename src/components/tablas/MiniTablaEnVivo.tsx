import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Movimiento } from '@/components/tablas/TablaPosiciones'
import { slugCategoria } from '@/hooks/useCategoria'
import { usePosiciones } from '@/hooks/useTablas'
import { cn } from '@/lib/utils'

/** "Veteranos" → "Vet.", "Femenino" → "Fem."; los nombres cortos quedan igual (pestañas del mismo ancho). */
function abreviar(nombre: string): string {
  return nombre.length <= 6 ? nombre : `${nombre.slice(0, 3)}.`
}

/**
 * Tabla en vivo compacta (pantalla En vivo): solo los equipos que están jugando en la categoría elegida,
 * con posición, ▲/▼ y puntos. Pestañas con las categorías que juegan ahora; el enlace abre Tablas en esa categoría.
 */
export function MiniTablaEnVivo({ categorias }: { categorias: { id: number; nombre: string }[] }) {
  const [elegidaId, setElegidaId] = useState<number | null>(null)
  const elegida = categorias.find((c) => c.id === elegidaId) ?? categorias[0]
  const posicionesQ = usePosiciones(elegida?.id)
  if (!elegida) return null
  const enJuego = (posicionesQ.data ?? []).filter((f) => f.en_juego)
  // Si dos categorías quedarían con la misma abreviatura ("Mas."), se muestran los nombres completos.
  const cortos = categorias.map((c) => abreviar(c.nombre))
  const etiqueta = (i: number) => (new Set(cortos).size === cortos.length ? cortos[i] : categorias[i]?.nombre)

  return (
    <section aria-labelledby="titulo-tabla-en-vivo" className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-tabla-en-vivo" className="flex items-center gap-1.5 font-sans text-sm font-bold text-live">
          <span aria-hidden className="size-2 rounded-full bg-live" />
          Tabla en vivo
        </h2>
        {categorias.length > 1 && (
          <div role="group" aria-label="Categoría" className="flex overflow-hidden rounded-md border">
            {categorias.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === elegida.id}
                aria-label={c.nombre}
                onClick={() => {
                  setElegidaId(c.id)
                }}
                className={cn(
                  'min-h-11 w-14 text-xs font-semibold focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ring',
                  i > 0 && 'border-l',
                  c.id === elegida.id ? 'bg-primary text-primary-foreground' : 'bg-surface hover:bg-muted',
                )}
              >
                {etiqueta(i)}
              </button>
            ))}
          </div>
        )}
      </div>
      {posicionesQ.isPending ? (
        <Skeleton className="h-20" />
      ) : enJuego.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin equipos en juego en esta categoría.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {enJuego.map((f) => (
            <li key={f.equipo_id} className="flex min-h-10 items-center gap-2 py-1 text-sm">
              <span className="w-10 shrink-0 font-semibold whitespace-nowrap tabular-nums">
                {f.posicion != null ? `${String(f.posicion)}°` : '–'}
                <Movimiento fila={f} />
              </span>
              <span className="min-w-0 flex-1 truncate">{f.equipo}</span>
              {f.grupo && <span className="shrink-0 text-xs text-muted-foreground">{`Grupo ${f.grupo}`}</span>}
              <span className="w-14 shrink-0 text-right">
                <span className="font-display text-lg leading-none">{f.puntos ?? 0}</span>
                <span className="text-xs text-muted-foreground"> pts</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to={{ pathname: '/tablas', search: `?cat=${slugCategoria(elegida.nombre)}` }}
        className="inline-flex min-h-11 items-center gap-1 self-end rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {`Ver tabla de ${elegida.nombre}`}
        <ChevronRight aria-hidden className="size-4" />
      </Link>
    </section>
  )
}
