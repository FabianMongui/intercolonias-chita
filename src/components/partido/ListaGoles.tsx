import type { PartidoDetalle } from '@/hooks/usePartido'
import { cn } from '@/lib/utils'

interface ListaGolesProps {
  eventos: PartidoDetalle['eventos']
  localId: number | null
  visitanteId: number | null
  /** Opcionales: solo para el texto del lector de pantalla ("gol de Chita FC"). */
  nombreLocal?: string | null
  nombreVisitante?: string | null
}

type Evento = PartidoDetalle['eventos'][number]

function textoJugador(evento: Evento): string {
  const { jugador } = evento
  if (!jugador) return 'Sin jugador'
  return jugador.numero != null ? `#${String(jugador.numero)} ${jugador.nombre}` : jugador.nombre
}

/**
 * Goles del partido, cada uno del lado del equipo al que se le suma (`equipo_id`, §3.1):
 * en un autogol aparece del lado del rival del jugador, marcado "(autogol)".
 */
export function ListaGoles({
  eventos,
  localId,
  visitanteId,
  nombreLocal,
  nombreVisitante,
}: ListaGolesProps) {
  const goles = eventos.filter((e) => e.tipo === 'gol')

  if (goles.length === 0) {
    return <p className="py-4 text-center text-muted-foreground">Aún no hay goles</p>
  }

  return (
    <ol className="flex flex-col divide-y">
      {goles.map((gol) => {
        const esVisitante = visitanteId !== null && gol.equipo_id === visitanteId
        const esLocal = !esVisitante && (localId === null || gol.equipo_id === localId)
        const nombreEquipo = esVisitante ? nombreVisitante : esLocal ? nombreLocal : null
        const minuto = gol.minuto != null ? `${String(gol.minuto)}'` : '–'
        const detalle = (
          <span className="min-w-0 [overflow-wrap:anywhere]">
            <span className={cn(!gol.jugador && 'text-muted-foreground italic')}>
              {textoJugador(gol)}
            </span>
            {gol.autogol && <span className="text-muted-foreground"> (autogol)</span>}
          </span>
        )
        return (
          <li
            key={gol.id}
            className="grid min-h-11 grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2 py-2"
          >
            {nombreEquipo && <span className="sr-only">Gol de {nombreEquipo}:</span>}
            <span className="text-right">{esVisitante ? null : detalle}</span>
            <span className="marcador justify-self-center rounded-md bg-muted px-2 py-1 text-xl">
              {minuto}
            </span>
            <span>{esVisitante ? detalle : null}</span>
          </li>
        )
      })}
    </ol>
  )
}
