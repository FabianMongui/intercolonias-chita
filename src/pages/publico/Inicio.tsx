import { CalendarDays, Clock, MapPin, RefreshCw, Trophy } from 'lucide-react'
import { HoraOficial } from '@/components/HoraOficial'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { type TorneoActivo, useTorneoActivo } from '@/hooks/useTorneoActivo'
import { formatearHoraJornada, formatearRangoFechas } from '@/lib/time'

export default function Inicio() {
  const { data: torneo, isPending, isError, refetch, isRefetching } = useTorneoActivo()

  if (isPending) return <InicioCargando />

  if (isError) {
    return (
      <section className="flex flex-col items-start gap-4">
        <h1 className="text-4xl">No pudimos cargar el torneo</h1>
        <p role="alert" className="text-muted-foreground">
          Revisa tu conexión e intenta de nuevo.
        </p>
        <Button onClick={() => void refetch()} disabled={isRefetching}>
          <RefreshCw aria-hidden />
          {isRefetching ? 'Reintentando…' : 'Reintentar'}
        </Button>
      </section>
    )
  }

  if (!torneo) {
    return (
      <section className="flex flex-col items-start gap-3">
        <Trophy aria-hidden className="size-10 text-gold" />
        <h1 className="text-4xl">No hay un torneo activo</h1>
        <p className="text-muted-foreground">Cuando se publique el próximo torneo aparecerá aquí.</p>
      </section>
    )
  }

  return <ResumenTorneo torneo={torneo} />
}

function ResumenTorneo({ torneo }: { torneo: TorneoActivo }) {
  return (
    <div className="flex flex-col gap-6">
      <title>{`${torneo.nombre} · Intercolonias Chita`}</title>
      <section className="flex flex-col gap-2">
        <h1 className="text-4xl">{torneo.nombre}</h1>
        <ul className="flex flex-col gap-1">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden className="size-5 shrink-0 text-primary" />
            {formatearRangoFechas(torneo.fecha_inicio, torneo.fecha_fin)}
          </li>
          <li className="flex items-center gap-2">
            <Clock aria-hidden className="size-5 shrink-0 text-primary" />
            Jornada de {formatearHoraJornada(torneo.hora_inicio_jornada)} a{' '}
            {formatearHoraJornada(torneo.hora_fin_jornada)}
          </li>
        </ul>
        <HoraOficial />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="text-3xl">
          Categorías
        </h2>
        {torneo.categorias.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay categorías.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {torneo.categorias.map((categoria) => (
              <li key={categoria.id} className="rounded-lg border bg-card p-4">
                <p className="text-lg font-semibold">{categoria.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {categoria.tipo_cancha} · 2 × {categoria.minutos_por_tiempo} min · descanso{' '}
                  {categoria.minutos_descanso} min
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="titulo-canchas">
        <h2 id="titulo-canchas" className="text-3xl">
          Canchas
        </h2>
        {torneo.canchas.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay canchas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {torneo.canchas.map((cancha) => (
              <li
                key={cancha.id}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-x-2">
                  <MapPin aria-hidden className="size-5 shrink-0 text-primary" />
                  <span className="font-semibold">{cancha.nombre}</span>
                  <span className="text-sm text-muted-foreground">{cancha.tipo}</span>
                </span>
                <span
                  className={
                    cancha.activa
                      ? 'shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground'
                      : 'shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground'
                  }
                >
                  {cancha.activa ? 'Habilitada' : 'Cerrada'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function InicioCargando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando torneo">
      <section className="flex flex-col gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-40" />
      </section>
      <section className="flex flex-col gap-3">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <Skeleton className="mb-1 h-9 w-32" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </section>
    </div>
  )
}
