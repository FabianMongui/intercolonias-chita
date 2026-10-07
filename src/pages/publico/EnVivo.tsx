import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { ErrorDatos, SinTorneo, Vacio } from '@/components/EstadosPagina'
import { HoraOficial } from '@/components/HoraOficial'
import { SelectorCategoria } from '@/components/SelectorCategoria'
import { TarjetaPartido, TarjetaPartidoSkeleton } from '@/components/partido/TarjetaPartido'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoria } from '@/hooks/useCategoria'
import type { Partido } from '@/hooks/usePartidos'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import { agrupar } from '@/lib/agrupar'
import { horaReferencia } from '@/lib/orden'
import { claveDia, formatearFechaLarga, formatearRangoFechas } from '@/lib/time'

const CUANTOS_PROXIMOS = 6
const CUANTOS_RESULTADOS = 6

function horaFin(p: Partido): number {
  return p.fin_real ? Date.parse(p.fin_real) : 0
}

export default function EnVivo() {
  const datos = usePartidosTorneo()
  const { categoria } = useCategoria()
  const { search } = useLocation()
  const { torneo, partidos, desfaseMs, etiquetaPartido, minutosPorTiempo, nombreCategoria } = datos

  if (datos.cargando) return <EnVivoCargando />
  if (datos.error) return <ErrorDatos reintentar={datos.reintentar} reintentando={datos.reintentando} />
  if (!torneo) return <SinTorneo />

  // En vivo: todas las categorías (lo que se juega ahora importa sin importar el filtro).
  const enVivo = partidos.filter((p) => p.estado === 'en_vivo')
  // Si no hay nada en vivo, se destaca el siguiente partido del torneo (cualquier categoría).
  const siguiente =
    enVivo.length === 0
      ? partidos
          .filter((p) => p.estado === 'programado')
          .sort((a, b) => horaReferencia(a) - horaReferencia(b))[0]
      : undefined

  const deCategoria = partidos.filter((p) => p.categoria_id === categoria?.id)
  const proximos = deCategoria
    .filter((p) => p.estado === 'programado' && p.id !== siguiente?.id)
    .sort((a, b) => horaReferencia(a) - horaReferencia(b))
  const proximosVisibles = proximos.slice(0, CUANTOS_PROXIMOS)
  const resultados = deCategoria
    .filter((p) => p.estado === 'finalizado')
    .sort((a, b) => horaFin(b) - horaFin(a))
    .slice(0, CUANTOS_RESULTADOS)
  const tarjeta = (p: Partido, destacado = false) => (
    <TarjetaPartido
      partido={p}
      etiquetaPartido={etiquetaPartido}
      desfaseMs={desfaseMs}
      minutosPorTiempo={minutosPorTiempo(p.categoria_id)}
      destacado={destacado}
    />
  )

  return (
    <div className="flex flex-col gap-8">
      <title>{`En vivo · ${torneo.nombre}`}</title>
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl">{torneo.nombre}</h1>
        <p className="text-muted-foreground">{formatearRangoFechas(torneo.fecha_inicio, torneo.fecha_fin)}</p>
        <HoraOficial />
      </header>

      <section aria-labelledby="titulo-en-vivo" className="flex flex-col gap-3">
        <h2 id="titulo-en-vivo" className="text-3xl">
          {enVivo.length > 0 ? 'En vivo ahora' : 'Siguiente partido'}
        </h2>
        {enVivo.length > 0 ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {enVivo.map((p) => (
              <li key={p.id} className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-muted-foreground">{nombreCategoria(p.categoria_id)}</span>
                {tarjeta(p, true)}
              </li>
            ))}
          </ul>
        ) : siguiente ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-muted-foreground">
                {nombreCategoria(siguiente.categoria_id)}
              </span>
              {tarjeta(siguiente, true)}
            </div>
          </div>
        ) : (
          <Vacio>No hay partidos en juego ni pendientes.</Vacio>
        )}
      </section>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground">Próximos y resultados de la categoría</p>
        <SelectorCategoria />
      </div>

      <section aria-labelledby="titulo-proximos" className="flex flex-col gap-3">
        <h2 id="titulo-proximos" className="text-3xl">
          Próximos
        </h2>
        {proximos.length === 0 ? (
          <Vacio>No quedan partidos pendientes en esta categoría.</Vacio>
        ) : (
          <>
            {agrupar(proximosVisibles, (p) => (p.hora_programada ? claveDia(p.hora_programada) : '')).map(
              ([dia, delDia]) => (
                <div key={dia || 'sin-horario'} className="flex flex-col gap-2">
                  <h3 className="text-xl first-letter:uppercase">
                    {dia ? formatearFechaLarga(dia) : 'Sin horario'}
                  </h3>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {delDia.map((p) => (
                      <li key={p.id}>{tarjeta(p)}</li>
                    ))}
                  </ul>
                </div>
              ),
            )}
            {proximos.length > CUANTOS_PROXIMOS && (
              <Link
                to={{ pathname: '/partidos', search }}
                className="inline-flex min-h-11 items-center gap-1 self-start rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Ver todos los partidos
                <ChevronRight aria-hidden className="size-5" />
              </Link>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="titulo-resultados" className="flex flex-col gap-3">
        <h2 id="titulo-resultados" className="text-3xl">
          Últimos resultados
        </h2>
        {resultados.length === 0 ? (
          <Vacio>Todavía no hay partidos terminados en esta categoría.</Vacio>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {resultados.map((p) => (
              <li key={p.id}>{tarjeta(p)}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function EnVivoCargando() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Cargando partidos">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <TarjetaPartidoSkeleton destacado />
      <div className="grid gap-3 md:grid-cols-2">
        <TarjetaPartidoSkeleton />
        <TarjetaPartidoSkeleton />
      </div>
    </div>
  )
}
