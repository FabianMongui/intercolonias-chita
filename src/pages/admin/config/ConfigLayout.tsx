import { ShieldAlert } from 'lucide-react'
import { useId } from 'react'
import { Link, Outlet, useOutletContext } from 'react-router'
import { ErrorDatos } from '@/components/EstadosPagina'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Perfil } from '@/hooks/usePerfil'
import { useTorneoEnEdicion } from '@/hooks/useTorneos'
import type { Database } from '@/types/database'

export type Torneo = Database['public']['Tables']['torneos']['Row']

export interface ContextoConfig {
  perfil: Perfil
  /** Torneo en edición; undefined si todavía no existe ninguno. */
  torneo: Torneo | undefined
  elegirTorneo: (id: number) => void
}

/** Configuración del torneo: solo super admin (§4.2). Comparte el selector de "torneo en edición". */
export default function ConfigLayout() {
  const perfil = useOutletContext<Perfil>()
  const { torneosQ, torneos, torneo, elegir } = useTorneoEnEdicion()
  const idSelector = useId()

  if (perfil.rol !== 'super_admin') {
    return (
      <section className="flex flex-col items-start gap-3">
        <title>No autorizado · Intercolonias Chita</title>
        <ShieldAlert aria-hidden className="size-10 text-destructive" />
        <h1 className="text-4xl">No autorizado</h1>
        <p className="text-muted-foreground">La configuración del torneo es solo para el super admin.</p>
        <Button asChild variant="outline">
          <Link to="/admin">Volver a Control de partidos</Link>
        </Button>
      </section>
    )
  }

  if (torneosQ.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando torneos">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (torneosQ.isError) {
    return <ErrorDatos reintentar={() => void torneosQ.refetch()} reintentando={torneosQ.isRefetching} />
  }

  const contexto: ContextoConfig = { perfil, torneo, elegirTorneo: elegir }

  return (
    <div className="flex flex-col gap-6">
      {torneos.length > 0 && torneo && (
        <div className="flex flex-col gap-1 rounded-lg border bg-surface-warm p-2 text-surface-warm-foreground">
          <label htmlFor={idSelector} className="text-sm font-semibold">
            Torneo en edición
          </label>
          <select
            id={idSelector}
            value={torneo.id}
            onChange={(e) => {
              elegir(Number(e.target.value))
            }}
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {torneos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <p className="text-sm">
            {torneo.activo
              ? 'Es el torneo que ve el público.'
              : `No está activo; el público ve “${torneos.find((t) => t.activo)?.nombre ?? 'ningún torneo'}”.`}
          </p>
        </div>
      )}
      <Outlet context={contexto} />
    </div>
  )
}
