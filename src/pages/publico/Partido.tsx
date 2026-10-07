import { ArrowLeft, MapPin } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ErrorDatos, NoEncontrado } from '@/components/EstadosPagina'
import { Escudo } from '@/components/partido/Escudo'
import { IndicadorEnVivo } from '@/components/partido/IndicadorEnVivo'
import { ListaGoles } from '@/components/partido/ListaGoles'
import { MarcaGanador } from '@/components/partido/MarcaGanador'
import { Marcador } from '@/components/partido/Marcador'
import { Reloj } from '@/components/partido/Reloj'
import { TextoHora } from '@/components/partido/TextoHora'
import { Skeleton } from '@/components/ui/skeleton'
import { type PartidoDetalle, usePartido } from '@/hooks/usePartido'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import { textoFasePartido } from '@/lib/fases'
import { textoReferencia } from '@/lib/referencias'
import { claveDia, formatearFechaLarga, formatearHora } from '@/lib/time'

type EtiquetaPartido = (id: number) => string | null | undefined

export default function Partido() {
  const id = Number(useParams().id)
  const partidoQ = usePartido(id)
  const { etiquetaPartido, desfaseMs } = usePartidosTorneo()
  const [params] = useSearchParams()
  const cat = params.get('cat')
  const search = cat ? `?cat=${encodeURIComponent(cat)}` : ''
  const volver = { pathname: '/partidos', search }
  const enlaceVolver = (
    <Link to={volver} className="inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
      Ver todos los partidos
    </Link>
  )

  // Un id que no es número nunca carga: se trata como no encontrado.
  if (!Number.isInteger(id) || id <= 0) return <NoEncontrado que="Partido" volver={enlaceVolver} />
  if (partidoQ.isPending) return <PartidoCargando />
  if (partidoQ.isError) {
    return <ErrorDatos reintentar={() => void partidoQ.refetch()} reintentando={partidoQ.isRefetching} />
  }
  const p = partidoQ.data
  if (!p) return <NoEncontrado que="Partido" volver={enlaceVolver} />

  const nombreLocal = p.local?.nombre ?? textoReferencia(p.ref_local, etiquetaPartido)
  const nombreVisitante = p.visitante?.nombre ?? textoReferencia(p.ref_visitante, etiquetaPartido)
  const enVivo = p.estado === 'en_vivo'
  const finalizado = p.estado === 'finalizado'
  const conMarcador = enVivo || finalizado

  return (
    <div className="flex flex-col gap-8">
      <title>{`${nombreLocal} vs ${nombreVisitante} · Intercolonias Chita`}</title>
      <BotonVolver alternativa={volver} />

      <section aria-labelledby="titulo-partido" className="flex flex-col gap-4 rounded-lg border bg-card p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {[p.categoria.nombre, textoFasePartido(p)].filter(Boolean).join(' · ')}
          </span>
          {p.cancha && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-4" />
              {p.cancha.nombre}
            </span>
          )}
        </div>

        <h1 id="titulo-partido" className="sr-only">
          {`${nombreLocal} contra ${nombreVisitante}`}
        </h1>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <LadoEquipo search={search} equipo={p.local} referencia={p.ref_local} etiquetaPartido={etiquetaPartido} gano={p.ganador != null && p.ganador === p.local?.id} />
          <div className="flex flex-col items-center gap-2 pt-2">
            {conMarcador ? (
              <Marcador
                golesLocal={p.goles_local}
                golesVisitante={p.goles_visitante}
                penalesLocal={p.penales_local}
                penalesVisitante={p.penales_visitante}
                tamano="lg"
              />
            ) : (
              <span className="font-display text-4xl text-muted-foreground">vs</span>
            )}
            {enVivo && <IndicadorEnVivo />}
            {enVivo && desfaseMs !== undefined && (
              <Reloj partido={p} minutosPorTiempo={p.categoria.minutos_por_tiempo} desfaseMs={desfaseMs} className="text-2xl" />
            )}
            {finalizado && <span className="font-semibold text-muted-foreground">Final</span>}
            {!conMarcador && (
              <span className="text-center text-sm">
                <TextoHora partido={p} corto />
              </span>
            )}
          </div>
          <LadoEquipo search={search} equipo={p.visitante} referencia={p.ref_visitante} etiquetaPartido={etiquetaPartido} gano={p.ganador != null && p.ganador === p.visitante?.id} />
        </div>

        {/* Un solo anuncio para lectores de pantalla: siempre montado, cambia solo el texto. */}
        <p role="status" className="sr-only">
          {conMarcador
            ? `${nombreLocal} ${String(p.goles_local)}, ${nombreVisitante} ${String(p.goles_visitante)}`
            : ''}
        </p>
      </section>

      {conMarcador && (
        <section aria-labelledby="titulo-goles" className="flex flex-col gap-3">
          <h2 id="titulo-goles" className="text-3xl">
            Goles
          </h2>
          <ListaGoles
            eventos={p.eventos}
            localId={p.equipo_local_id}
            visitanteId={p.equipo_visitante_id}
            nombreLocal={nombreLocal}
            nombreVisitante={nombreVisitante}
          />
        </section>
      )}

      <section aria-labelledby="titulo-horas" className="flex flex-col gap-3">
        <h2 id="titulo-horas" className="text-3xl">
          Horario
        </h2>
        <Horas partido={p} />
      </section>
    </div>
  )
}

function LadoEquipo({
  equipo,
  referencia,
  etiquetaPartido,
  gano,
  search,
}: {
  search: string
  equipo: PartidoDetalle['local']
  referencia: string | null
  etiquetaPartido: EtiquetaPartido
  gano: boolean
}) {
  if (!equipo) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <span aria-hidden className="size-16 shrink-0 rounded-full border-2 border-dashed border-input" />
        <span className="text-muted-foreground italic [overflow-wrap:anywhere]">
          {textoReferencia(referencia, etiquetaPartido)}
        </span>
      </div>
    )
  }
  return (
    <Link
      to={{ pathname: `/equipos/${String(equipo.id)}`, search }}
      className="flex min-h-11 flex-col items-center gap-2 rounded-md text-center focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Escudo nombre={equipo.nombre} path={equipo.escudo_path} tamano="lg" />
      <span className="font-semibold leading-tight [overflow-wrap:anywhere]">{equipo.nombre}</span>
      {gano && <MarcaGanador />}
    </Link>
  )
}

/** Horas programada/estimada y las reales que fijó el servidor (§3.3). */
function Horas({ partido: p }: { partido: PartidoDetalle }) {
  // La estimada solo aporta si el partido está pendiente y cambió respecto a la programada.
  const estimadaDistinta =
    p.estado === 'programado' &&
    p.hora_estimada !== null &&
    (p.hora_programada === null || formatearHora(p.hora_estimada) !== formatearHora(p.hora_programada))
  const filas: [string, string | null][] = [
    ['Programado', p.hora_programada],
    ['Estimado', estimadaDistinta ? p.hora_estimada : null],
    ['Inicio', p.inicio_real],
    ['Fin del 1er tiempo', p.fin_primer_tiempo],
    ['Inicio del 2º tiempo', p.inicio_segundo_tiempo],
    ['Final', p.fin_real],
  ]
  const visibles = filas.filter((f): f is [string, string] => f[1] !== null)
  if (visibles.length === 0) return <p className="text-muted-foreground">Hora por definir.</p>
  const dia = p.hora_programada ?? p.hora_estimada
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
      {dia && (
        <div className="contents">
          <dt className="text-muted-foreground">Día</dt>
          <dd className="font-semibold first-letter:uppercase">{formatearFechaLarga(claveDia(dia))}</dd>
        </div>
      )}
      {visibles.map(([etiqueta, hora]) => (
        <div key={etiqueta} className="contents">
          <dt className="text-muted-foreground">{etiqueta}</dt>
          <dd className="font-semibold tabular-nums">{formatearHora(hora)}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Vuelve a donde estaba (En vivo, Equipo…) si llegó navegando; si abrió el link directo, a Partidos. */
function BotonVolver({ alternativa }: { alternativa: { pathname: string; search: string } }) {
  const navigate = useNavigate()
  const { key } = useLocation()
  const clase =
    'inline-flex min-h-11 items-center gap-2 self-start rounded-md font-semibold text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring'
  if (key === 'default') {
    return (
      <Link to={alternativa} className={clase}>
        <ArrowLeft aria-hidden className="size-5" />
        Partidos
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={clase}
      onClick={() => {
        void navigate(-1)
      }}
    >
      <ArrowLeft aria-hidden className="size-5" />
      Volver
    </button>
  )
}

function PartidoCargando() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Cargando partido">
      <Skeleton className="h-11 w-28" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
