import { type ReactNode, useId } from 'react'
import { ChevronRight, GitFork, Trophy } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Escudo } from '@/components/partido/Escudo'
import { IndicadorEnVivo } from '@/components/partido/IndicadorEnVivo'
import { MarcaGanador } from '@/components/partido/MarcaGanador'
import { TextoHora } from '@/components/partido/TextoHora'
import type { Partido } from '@/hooks/usePartidos'
import { textoFasePartido } from '@/lib/fases'
import { textoReferencia } from '@/lib/referencias'
import { cn } from '@/lib/utils'

type EtiquetaPartido = (id: number) => string | null | undefined

interface LlavesProps {
  /** Partidos de eliminatoria de una categoría (semifinal, tercer_puesto, final). */
  partidos: Partido[]
  etiquetaPartido: EtiquetaPartido
}

const porOrden = (a: Partido, b: Partido) => (a.ronda ?? 0) - (b.ronda ?? 0) || a.id - b.id

/**
 * Llaves: Semifinales → Final → Campeón, y aparte el 3er puesto.
 * Móvil apilado vertical; desde lg en columnas. El campeón es `ganador` de la final (lo da la base).
 */
export function Llaves({ partidos, etiquetaPartido }: LlavesProps) {
  const semis = partidos.filter((p) => p.fase === 'semifinal').sort(porOrden)
  const final = partidos.find((p) => p.fase === 'final')
  const tercero = partidos.find((p) => p.fase === 'tercer_puesto')

  if (semis.length === 0 && !final && !tercero) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-4 py-8 text-center">
        <GitFork aria-hidden className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">Esta categoría no tiene llaves</p>
      </div>
    )
  }

  let campeon: Partido['local'] = null
  if (final?.ganador != null) {
    if (final.local?.id === final.ganador) campeon = final.local
    else if (final.visitante?.id === final.ganador) campeon = final.visitante
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,0.8fr)] lg:items-center lg:gap-3">
        <Columna titulo="Semifinales">
          {semis.length > 0 ? (
            semis.map((p) => <Cruce key={p.id} partido={p} etiquetaPartido={etiquetaPartido} />)
          ) : (
            <p className="text-muted-foreground">Por definir</p>
          )}
        </Columna>
        <Flecha />
        <Columna titulo="Final">
          {final ? (
            <Cruce partido={final} etiquetaPartido={etiquetaPartido} esFinal />
          ) : (
            <p className="text-muted-foreground">Por definir</p>
          )}
        </Columna>
        <Flecha />
        <Columna titulo="Campeón">
          <div className="flex min-h-24 items-center gap-3 rounded-lg border-2 border-gold bg-surface-warm p-4 text-surface-warm-foreground">
            <Trophy aria-hidden className="size-8 shrink-0 text-gold-foreground" />
            {campeon ? (
              <span className="flex min-w-0 items-center gap-3">
                <Escudo nombre={campeon.nombre} path={campeon.escudo_path} tamano="lg" />
                <span className="font-display text-3xl leading-none [overflow-wrap:anywhere]">
                  {campeon.nombre}
                </span>
              </span>
            ) : (
              <span className="text-lg font-semibold">Por definir</span>
            )}
          </div>
        </Columna>
      </div>

      {tercero && (
        <Columna titulo="Tercer puesto" className="lg:max-w-sm">
          <Cruce partido={tercero} etiquetaPartido={etiquetaPartido} />
        </Columna>
      )}
    </div>
  )
}

function Columna({
  titulo,
  className,
  children,
}: {
  titulo: string
  className?: string
  children: ReactNode
}) {
  const idTitulo = useId()
  return (
    <section className={cn('flex flex-col gap-3', className)} aria-labelledby={idTitulo}>
      <h3 id={idTitulo} className="text-2xl">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

/** Separador visual entre columnas en escritorio. */
function Flecha() {
  return <ChevronRight aria-hidden className="hidden size-6 text-gold lg:block" />
}

function Cruce({
  partido,
  etiquetaPartido,
  esFinal = false,
}: {
  partido: Partido
  etiquetaPartido: EtiquetaPartido
  esFinal?: boolean
}) {
  const { search } = useLocation()
  const jugado = partido.estado !== 'programado'
  const hayPenales = partido.penales_local != null && partido.penales_visitante != null

  // Sobre el dorado el texto va en café (contraste); el gris no alcanza 4.5:1.
  const tono = esFinal ? 'text-gold-foreground' : 'text-muted-foreground'
  let estado: ReactNode
  if (partido.estado === 'en_vivo') estado = <IndicadorEnVivo />
  else if (partido.estado === 'finalizado')
    estado = <span className={cn('text-sm font-semibold', tono)}>Final</span>
  else
    estado = (
      <span className={cn('text-sm tabular-nums', tono)}>
        <TextoHora partido={partido} corto />
      </span>
    )

  return (
    <Link
      to={{ pathname: `/partido/${String(partido.id)}`, search }}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-card transition-colors duration-(--duracion-rapida) hover:border-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
        esFinal && 'border-2 border-gold',
      )}
    >
      <div
        className={cn(
          'flex min-h-9 items-center justify-between gap-2 px-3 py-1',
          esFinal ? 'bg-gold text-gold-foreground' : 'bg-muted',
        )}
      >
        <span className={cn('text-sm font-semibold', !esFinal && 'text-muted-foreground')}>
          {textoFasePartido(partido)}
        </span>
        {estado}
      </div>
      <FilaEquipo
        equipo={partido.local}
        referencia={partido.ref_local}
        etiquetaPartido={etiquetaPartido}
        goles={jugado ? partido.goles_local : null}
        penales={hayPenales ? partido.penales_local : null}
        gano={partido.ganador !== null && partido.ganador === partido.local?.id}
      />
      <FilaEquipo
        equipo={partido.visitante}
        referencia={partido.ref_visitante}
        etiquetaPartido={etiquetaPartido}
        goles={jugado ? partido.goles_visitante : null}
        penales={hayPenales ? partido.penales_visitante : null}
        gano={partido.ganador !== null && partido.ganador === partido.visitante?.id}
      />
    </Link>
  )
}

function FilaEquipo({
  equipo,
  referencia,
  etiquetaPartido,
  goles,
  penales,
  gano,
}: {
  equipo: Partido['local']
  referencia: string | null
  etiquetaPartido: EtiquetaPartido
  goles: number | null
  penales: number | null
  gano: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-h-11 items-center gap-2 border-t px-3 py-1.5',
        gano && 'bg-surface-warm text-surface-warm-foreground',
      )}
    >
      {equipo ? (
        <>
          <Escudo nombre={equipo.nombre} path={equipo.escudo_path} tamano="sm" />
          <span
            className={cn(
              'min-w-0 flex-1 leading-tight [overflow-wrap:anywhere]',
              gano ? 'font-bold' : 'font-semibold',
            )}
          >
            {equipo.nombre}
          </span>
          {gano && <MarcaGanador compacta />}
        </>
      ) : (
        <>
          <span aria-hidden className="size-6 shrink-0 rounded-full border-2 border-dashed border-input" />
          <span className="min-w-0 flex-1 text-sm text-muted-foreground italic [overflow-wrap:anywhere]">
            {textoReferencia(referencia, etiquetaPartido)}
          </span>
        </>
      )}
      {goles !== null && (
        <span className="flex shrink-0 items-baseline gap-1">
          {penales !== null && (
            <span className="text-sm text-muted-foreground tabular-nums">
              ({penales}
              <span className="sr-only"> en penales</span>)
            </span>
          )}
          <span className="marcador w-6 text-right text-2xl">
            {goles}
            <span className="sr-only"> goles</span>
          </span>
        </span>
      )}
    </div>
  )
}
