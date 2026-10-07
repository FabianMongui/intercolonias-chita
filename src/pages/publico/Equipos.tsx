import { ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { ErrorDatos, SinTorneo, Vacio } from '@/components/EstadosPagina'
import { SelectorCategoria } from '@/components/SelectorCategoria'
import { Escudo } from '@/components/partido/Escudo'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoria } from '@/hooks/useCategoria'
import { useEquipos } from '@/hooks/useEquipos'
import { useTorneoActivo } from '@/hooks/useTorneoActivo'

export default function Equipos() {
  const { categoria } = useCategoria()
  const torneoQ = useTorneoActivo()
  const equiposQ = useEquipos(categoria?.id)
  const [params] = useSearchParams()
  const cat = params.get('cat')
  const search = cat ? `?cat=${encodeURIComponent(cat)}` : ''

  if (torneoQ.isError) {
    return <ErrorDatos reintentar={() => void torneoQ.refetch()} reintentando={torneoQ.isRefetching} />
  }
  if (!torneoQ.isPending && !torneoQ.data) return <SinTorneo />

  return (
    <div className="flex flex-col gap-6">
      <title>Equipos · Intercolonias Chita</title>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl">Equipos</h1>
        <SelectorCategoria />
      </div>

      {torneoQ.isPending || equiposQ.isLoading ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando equipos">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-[72px]" />
            </li>
          ))}
        </ul>
      ) : equiposQ.isError ? (
        <ErrorDatos nivel="h2" reintentar={() => void equiposQ.refetch()} reintentando={equiposQ.isRefetching} />
      ) : !equiposQ.data || equiposQ.data.length === 0 ? (
        <Vacio>Esta categoría aún no tiene equipos.</Vacio>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {equiposQ.data.map((e) => (
            <li key={e.id}>
              <Link
                to={{ pathname: `/equipos/${String(e.id)}`, search }}
                className="flex min-h-[72px] items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Escudo nombre={e.nombre} path={e.escudo_path} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{e.nombre}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {e.grupo ? `Grupo ${e.grupo.nombre}` : 'Sin grupo'}
                    {e.representante && ` · ${e.representante}`}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
