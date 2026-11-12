import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { ErrorDatos, SinTorneo, Vacio } from '@/components/EstadosPagina'
import { HoraOficial } from '@/components/HoraOficial'
import { TarjetaPartido, TarjetaPartidoSkeleton } from '@/components/partido/TarjetaPartido'
import { MiniTablaEnVivo } from '@/components/tablas/MiniTablaEnVivo'
import { Skeleton } from '@/components/ui/skeleton'
import type { Partido } from '@/hooks/usePartidos'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import { horaReferencia } from '@/lib/orden'
import { formatearRangoFechas } from '@/lib/time'

/** En vivo es un resumen: el resto está en Partidos (pedido del dueño). */
const CUANTOS_PROXIMOS = 2
const CUANTOS_RESULTADOS = 2

function horaFin(p: Partido): number {
  return p.fin_real ? Date.parse(p.fin_real) : 0
}

export default function EnVivo() {
  const datos = usePartidosTorneo()
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

  // Próximos y resultados de todas las categorías mezcladas (§ fase 8).
  const proximos = partidos
    .filter((p) => p.estado === 'programado' && p.id !== siguiente?.id)
    .sort((a, b) => horaReferencia(a) - horaReferencia(b))
    .slice(0, CUANTOS_PROXIMOS)
  const resultados = partidos
    .filter((p) => p.estado === 'finalizado')
    .sort((a, b) => horaFin(b) - horaFin(a))
    .slice(0, CUANTOS_RESULTADOS)
  // Categorías con partido de grupos en juego, en el orden del torneo (para la tabla en vivo).
  const categoriasEnJuego = torneo.categorias.filter((c) =>
    enVivo.some((p) => p.categoria_id === c.id && p.fase === 'grupos'),
  )
  const verTodos = (texto: string) => (
    <Link
      to="/partidos"
      className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {texto}
      <ChevronRight aria-hidden className="size-4" />
    </Link>
  )
  const conCategoria = (p: Partido) => (
    <li key={p.id} className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-muted-foreground">{nombreCategoria(p.categoria_id)}</span>
      {tarjeta(p)}
    </li>
  )
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

      {categoriasEnJuego.length > 0 && <MiniTablaEnVivo categorias={categoriasEnJuego} />}

      <section aria-labelledby="titulo-proximos" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titulo-proximos" className="text-3xl">
            Próximos
          </h2>
          {proximos.length > 0 && verTodos('Ver todos')}
        </div>
        {proximos.length === 0 ? (
          <Vacio>No quedan partidos pendientes.</Vacio>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">{proximos.map(conCategoria)}</ul>
        )}
      </section>

      <section aria-labelledby="titulo-resultados" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titulo-resultados" className="text-3xl">
            Últimos resultados
          </h2>
          {resultados.length > 0 && verTodos('Ver todos')}
        </div>
        {resultados.length === 0 ? (
          <Vacio>Todavía no hay partidos terminados.</Vacio>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">{resultados.map(conCategoria)}</ul>
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
