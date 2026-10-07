import { Escudo } from '@/components/partido/Escudo'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

export type GoleadorRow = Database['public']['Views']['goleadores']['Row']

interface GoleadoresProps {
  /** Filas de la vista `goleadores`, ya ordenadas por goles (desc). */
  filas: GoleadorRow[]
}

/** Puesto visual: los empates comparten número (1, 1, 3…). Solo presentación del orden recibido. */
function puestos(filas: GoleadorRow[]): number[] {
  const resultado: number[] = []
  filas.forEach((fila, i) => {
    const anterior = filas[i - 1]
    const previo = resultado[i - 1]
    resultado.push(anterior && previo !== undefined && anterior.goles === fila.goles ? previo : i + 1)
  })
  return resultado
}

export function Goleadores({ filas }: GoleadoresProps) {
  if (filas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-card px-4 py-8 text-center text-muted-foreground">
        Aún no hay goles
      </p>
    )
  }

  const lista = puestos(filas)

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">Goleadores</caption>
        <thead className="border-b bg-muted">
          <tr className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <th scope="col" className="w-11 py-2 text-center">
              <abbr title="Posición" className="no-underline">
                Pos
              </abbr>
            </th>
            <th scope="col" className="px-2 py-2 text-left">
              Jugador
            </th>
            <th scope="col" className="w-16 px-2 py-2 text-center">
              Goles
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => {
            const puesto = lista[i] ?? i + 1
            const jugador = fila.jugador ?? 'Jugador'
            const equipo = fila.equipo ?? 'Equipo'
            return (
              <tr key={fila.jugador_id ?? `fila-${String(i)}`} className="border-b last:border-b-0">
                <td className="py-2 text-center">
                  <span
                    className={cn(
                      'inline-flex size-8 items-center justify-center rounded-full font-semibold tabular-nums',
                      puesto === 1 && 'bg-accent text-accent-foreground',
                    )}
                  >
                    {puesto}
                  </span>
                </td>
                <th scope="row" className="px-2 py-2 text-left font-normal">
                  <span className="flex min-h-11 flex-col justify-center">
                    <span className="font-semibold leading-tight [overflow-wrap:anywhere]">
                      {fila.numero != null && (
                        <span className="text-muted-foreground tabular-nums">
                          #{fila.numero}{' '}
                        </span>
                      )}
                      {jugador}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Escudo nombre={equipo} path={fila.escudo_path} tamano="sm" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">{equipo}</span>
                    </span>
                  </span>
                </th>
                <td className="marcador px-2 py-2 text-center text-3xl">{fila.goles ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function GoleadoresSkeleton({ filas = 5 }: { filas?: number }) {
  return (
    <div aria-hidden className="overflow-hidden rounded-lg border bg-card">
      <div className="h-8 border-b bg-muted" />
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex h-[4.25rem] items-center gap-3 border-b px-3 last:border-b-0">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3.5 w-2/5" />
          </div>
          <Skeleton className="h-7 w-8" />
        </div>
      ))}
    </div>
  )
}
