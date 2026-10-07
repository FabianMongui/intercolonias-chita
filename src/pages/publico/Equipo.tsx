import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ErrorDatos, NoEncontrado, Vacio } from '@/components/EstadosPagina'
import { Escudo } from '@/components/partido/Escudo'
import { TarjetaPartido, TarjetaPartidoSkeleton } from '@/components/partido/TarjetaPartido'
import { Skeleton } from '@/components/ui/skeleton'
import { useEquipo } from '@/hooks/useEquipos'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import { usePosiciones } from '@/hooks/useTablas'
import { agrupar } from '@/lib/agrupar'
import { horaReferencia } from '@/lib/orden'
import { claveDia, formatearFechaLarga } from '@/lib/time'

export default function Equipo() {
  const id = Number(useParams().id)
  const equipoQ = useEquipo(id)
  const datos = usePartidosTorneo()
  const posicionesQ = usePosiciones(equipoQ.data?.categoria.id)
  const [params] = useSearchParams()
  const cat = params.get('cat')
  const volver = { pathname: '/equipos', search: cat ? `?cat=${encodeURIComponent(cat)}` : '' }

  const enlaceVolver = (
    <Link to={volver} className="inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
      Ver todos los equipos
    </Link>
  )

  // Un id que no es número nunca carga: se trata como no encontrado.
  if (!Number.isInteger(id) || id <= 0) return <NoEncontrado que="Equipo" volver={enlaceVolver} />
  if (equipoQ.isPending) return <EquipoCargando />
  if (equipoQ.isError) {
    return <ErrorDatos reintentar={() => void equipoQ.refetch()} reintentando={equipoQ.isRefetching} />
  }
  const equipo = equipoQ.data
  if (!equipo) return <NoEncontrado que="Equipo" volver={enlaceVolver} />

  const fila = posicionesQ.data?.find((f) => f.equipo_id === equipo.id)
  const partidos = datos.partidos
    .filter((p) => p.equipo_local_id === equipo.id || p.equipo_visitante_id === equipo.id)
    .sort((a, b) => horaReferencia(a) - horaReferencia(b))

  return (
    <div className="flex flex-col gap-8">
      <title>{`${equipo.nombre} · Intercolonias Chita`}</title>
      <Link
        to={volver}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-md font-semibold text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden className="size-5" />
        Equipos
      </Link>

      <header className="flex items-center gap-4">
        <Escudo nombre={equipo.nombre} path={equipo.escudo_path} tamano="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-4xl break-words">{equipo.nombre}</h1>
          <p className="text-muted-foreground">
            {[equipo.categoria.nombre, equipo.grupo && `Grupo ${equipo.grupo.nombre}`].filter(Boolean).join(' · ')}
          </p>
          {/* Antes de jugar, el orden es solo el desempate: no se muestra la posición. */}
          {fila?.posicion != null && (fila.pj ?? 0) > 0 && (
            <p className="font-semibold">
              {[`${String(fila.posicion)}°${fila.grupo ? ` del Grupo ${fila.grupo}` : ''}`, `${String(fila.puntos ?? 0)} pts`].join(' · ')}
            </p>
          )}
          {equipo.representante && (
            <p className="text-sm text-muted-foreground">Representante: {equipo.representante}</p>
          )}
        </div>
      </header>

      <section aria-labelledby="titulo-partidos-equipo" className="flex flex-col gap-3">
        <h2 id="titulo-partidos-equipo" className="text-3xl">
          Partidos
        </h2>
        {datos.cargando ? (
          <div className="grid gap-3 md:grid-cols-2">
            <TarjetaPartidoSkeleton />
            <TarjetaPartidoSkeleton />
          </div>
        ) : datos.error ? (
          <ErrorDatos
            nivel="h3"
            mensaje="No pudimos cargar los partidos"
            reintentar={datos.reintentar}
            reintentando={datos.reintentando}
          />
        ) : partidos.length === 0 ? (
          <Vacio>Este equipo aún no tiene partidos programados.</Vacio>
        ) : (
          agrupar(partidos, (p) => (p.hora_programada ? claveDia(p.hora_programada) : '')).map(([dia, delDia]) => (
            <div key={dia || 'sin-horario'} className="flex flex-col gap-2">
              <h3 className="text-xl first-letter:uppercase">
                {dia ? formatearFechaLarga(dia) : 'Sin horario'}
              </h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {delDia.map((p) => (
                  <li key={p.id}>
                    <TarjetaPartido
                      partido={p}
                      etiquetaPartido={datos.etiquetaPartido}
                      desfaseMs={datos.desfaseMs}
                      minutosPorTiempo={datos.minutosPorTiempo(p.categoria_id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="titulo-plantel" className="flex flex-col gap-3">
        <h2 id="titulo-plantel" className="text-3xl">
          Plantel
        </h2>
        {equipo.jugadores.length === 0 ? (
          <Vacio>Aún no hay jugadores inscritos.</Vacio>
        ) : (
          <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {equipo.jugadores.map((j) => (
              <li key={j.id} className="flex min-h-11 items-center gap-3 border-b py-2">
                <span className="w-8 shrink-0 text-right font-display text-2xl leading-none tabular-nums text-primary">
                  {j.numero ?? '–'}
                </span>
                <span className="min-w-0 flex-1 truncate">{j.nombre}</span>
                {j.posicion && <span className="shrink-0 text-sm text-muted-foreground">{j.posicion}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function EquipoCargando() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Cargando equipo">
      <Skeleton className="h-11 w-28" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
      <TarjetaPartidoSkeleton />
    </div>
  )
}
