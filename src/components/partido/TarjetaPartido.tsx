import { Clock, MapPin } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useAhoraServidor } from '@/hooks/useAhoraServidor'
import { usePestanaVisible } from '@/hooks/usePestanaVisible'
import type { Partido } from '@/hooks/usePartidos'
import { textoFasePartido } from '@/lib/fases'
import { textoReferencia } from '@/lib/referencias'
import { cn } from '@/lib/utils'
import { Escudo } from './Escudo'
import { IndicadorEnVivo } from './IndicadorEnVivo'
import { MarcaGanador } from './MarcaGanador'
import { Marcador } from './Marcador'
import { Reloj } from './Reloj'
import { TextoHora } from './TextoHora'

type EtiquetaPartido = (id: number) => string | null | undefined

interface TarjetaPartidoProps {
  partido: Partido
  etiquetaPartido: EtiquetaPartido
  desfaseMs: number | undefined
  minutosPorTiempo: number
  /** Variante grande para el "siguiente partido" de la portada. */
  destacado?: boolean
}

/** Solo se muestra la cuenta regresiva si faltan menos de 2 horas. */
const LIMITE_CUENTA_MIN = 120
/** "Por empezar" hasta 30 min después de la hora; luego no se muestra nada. */
const LIMITE_RETRASO_MIN = 30

const CAJA =
  'flex flex-col gap-3 rounded-lg border p-4 transition-colors duration-(--duracion-rapida)'

export function TarjetaPartido({
  partido,
  etiquetaPartido,
  desfaseMs,
  minutosPorTiempo,
  destacado = false,
}: TarjetaPartidoProps) {
  const { search } = useLocation()
  const { estado } = partido
  const enVivo = estado === 'en_vivo'
  const finalizado = estado === 'finalizado'
  const programado = !enVivo && !finalizado

  return (
    <Link
      to={{ pathname: `/partido/${String(partido.id)}`, search }}
      className={cn(
        CAJA,
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
        destacado
          ? 'border-gold bg-surface-warm text-surface-warm-foreground hover:border-primary'
          : 'bg-card text-card-foreground hover:border-primary',
      )}
    >
      <div className="flex min-h-7 items-center justify-between gap-2">
        <span className="min-w-0 text-sm font-semibold text-muted-foreground">
          {textoFasePartido(partido)}
        </span>
        {enVivo && <IndicadorEnVivo />}
        {finalizado && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold text-foreground">
            Final
          </span>
        )}
        {programado && <CuentaRegresiva partido={partido} desfaseMs={desfaseMs} />}
      </div>

      <div
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2',
          destacado ? 'min-h-32' : 'min-h-24',
        )}
      >
        <Lado
          equipo={partido.local}
          referencia={partido.ref_local}
          etiquetaPartido={etiquetaPartido}
          gano={finalizado && partido.ganador !== null && partido.ganador === partido.local?.id}
          destacado={destacado}
        />
        <div className="flex min-w-16 flex-col items-center gap-1 pt-1">
          {programado ? (
            <span
              className={cn(
                'marcador text-muted-foreground',
                destacado ? 'pt-3 text-4xl' : 'pt-2 text-3xl',
              )}
            >
              VS
            </span>
          ) : (
            <Marcador
              golesLocal={partido.goles_local}
              golesVisitante={partido.goles_visitante}
              penalesLocal={partido.penales_local}
              penalesVisitante={partido.penales_visitante}
              tamano={enVivo || destacado ? 'lg' : 'md'}
            />
          )}
          {enVivo && desfaseMs !== undefined && (
            <Reloj
              partido={partido}
              minutosPorTiempo={minutosPorTiempo}
              desfaseMs={desfaseMs}
              className="text-2xl text-primary"
            />
          )}
        </div>
        <Lado
          equipo={partido.visitante}
          referencia={partido.ref_visitante}
          etiquetaPartido={etiquetaPartido}
          gano={
            finalizado && partido.ganador !== null && partido.ganador === partido.visitante?.id
          }
          destacado={destacado}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {partido.cancha?.nombre ?? 'Cancha por definir'}
        </span>
        {programado && (
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="size-4 shrink-0" />
            <TextoHora partido={partido} />
          </span>
        )}
      </div>
    </Link>
  )
}

function Lado({
  equipo,
  referencia,
  etiquetaPartido,
  gano,
  destacado,
}: {
  equipo: Partido['local']
  referencia: string | null
  etiquetaPartido: EtiquetaPartido
  gano: boolean
  destacado: boolean
}) {
  const tamano = destacado ? 'lg' : 'md'
  if (!equipo) {
    return (
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span
          aria-hidden
          className={cn(
            'shrink-0 rounded-full border-2 border-dashed border-input',
            destacado ? 'size-16' : 'size-10',
          )}
        />
        <span className="text-sm text-muted-foreground italic [overflow-wrap:anywhere]">
          {textoReferencia(referencia, etiquetaPartido)}
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Escudo nombre={equipo.nombre} path={equipo.escudo_path} tamano={tamano} />
      <span
        className={cn(
          'leading-tight [overflow-wrap:anywhere]',
          destacado ? 'text-base' : 'text-sm',
          gano ? 'font-bold' : 'font-semibold',
        )}
      >
        {equipo.nombre}
      </span>
      {gano && <MarcaGanador />}
    </div>
  )
}

/** "en 25 min" según la hora del servidor; solo si faltan menos de 2 h. */
function CuentaRegresiva({
  partido,
  desfaseMs,
}: {
  partido: Partido
  desfaseMs: number | undefined
}) {
  const pestanaVisible = usePestanaVisible()
  const ahora = useAhoraServidor(desfaseMs, 30_000, pestanaVisible)
  const referencia = partido.hora_estimada ?? partido.hora_programada
  if (ahora === undefined || !referencia) return null
  const minutos = Math.ceil((Date.parse(referencia) - ahora) / 60_000)
  if (Number.isNaN(minutos) || minutos >= LIMITE_CUENTA_MIN || minutos < -LIMITE_RETRASO_MIN) {
    return null
  }
  return (
    <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-accent-foreground tabular-nums">
      {minutos > 0 ? `en ${String(minutos)} min` : 'Por empezar'}
    </span>
  )
}

export function TarjetaPartidoSkeleton({ destacado = false }: { destacado?: boolean }) {
  const escudo = destacado ? 'size-16' : 'size-10'
  return (
    <div
      aria-hidden
      className={cn(CAJA, destacado ? 'border-gold bg-surface-warm' : 'bg-card')}
    >
      <div className="flex min-h-7 items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2',
          destacado ? 'min-h-32' : 'min-h-24',
        )}
      >
        {[0, 1, 2].map((i) =>
          i === 1 ? (
            <div key={i} className="flex min-w-16 justify-center pt-2">
              <Skeleton className="h-9 w-16" />
            </div>
          ) : (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className={cn('rounded-full', escudo)} />
              <Skeleton className="h-4 w-20" />
            </div>
          ),
        )}
      </div>
      <Skeleton className="h-5 w-28" />
    </div>
  )
}
