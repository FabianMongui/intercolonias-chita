import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorDatos } from '@/components/EstadosPagina'
import { FormularioEquipo } from '@/components/admin/FormularioEquipo'
import { SelectorCategoria } from '@/components/admin/SelectorCategoria'
import { Escudo } from '@/components/partido/Escudo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoriasConfig } from '@/hooks/useConfigCategorias'
import { useEquiposConfig, useMutacionesEquipos } from '@/hooks/useConfigEquipos'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

/** Equipos por categoría del torneo en edición (§4.2 super admin 4). */
export default function Equipos() {
  const { torneo } = useOutletContext<ContextoConfig>()
  const categoriasQ = useCategoriasConfig(torneo?.id)
  const categorias = categoriasQ.data ?? []
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const categoria = categorias.find((c) => c.id === Number(params.get('cat'))) ?? categorias[0]
  const equiposQ = useEquiposConfig(categoria?.id)
  const { crearEquipo } = useMutacionesEquipos()
  const [formulario, setFormulario] = useState(0)

  if (!torneo) return <p className="text-muted-foreground">Primero crea un torneo en la sección Torneo.</p>

  const search = categoria ? `?cat=${String(categoria.id)}` : ''

  return (
    <div className="flex flex-col gap-6">
      <title>Equipos · Intercolonias Chita</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Equipos</h1>
        {categoria && (
          <Button
            onClick={() => {
              setFormulario((n) => n + 1)
            }}
          >
            <Plus aria-hidden />
            Nuevo equipo
          </Button>
        )}
      </div>

      {categoriasQ.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando equipos">
          <Skeleton className="h-11" />
          <Skeleton className="h-[72px]" />
        </div>
      ) : categoriasQ.isError ? (
        <ErrorDatos
          nivel="h2"
          reintentar={() => void categoriasQ.refetch()}
          reintentando={categoriasQ.isRefetching}
        />
      ) : categorias.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Primero crea las categorías del torneo; cada equipo pertenece a una.
        </p>
      ) : (
        <>
          <SelectorCategoria
            categorias={categorias}
            categoria={categoria}
            cambiar={(id) => {
              setParams({ cat: id }, { replace: true })
            }}
          />

          {equiposQ.isPending ? (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando equipos">
              <Skeleton className="h-[72px]" />
              <Skeleton className="h-[72px]" />
            </div>
          ) : equiposQ.isError ? (
            <ErrorDatos nivel="h2" reintentar={() => void equiposQ.refetch()} reintentando={equiposQ.isRefetching} />
          ) : equiposQ.data.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
              Esta categoría aún no tiene equipos. Agrega el primero.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {equiposQ.data.map((e) => (
                <li key={e.id}>
                  <Link
                    to={{ pathname: `/admin/equipos/${String(e.id)}`, search }}
                    className="flex min-h-[72px] items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Escudo nombre={e.nombre} path={e.escudo_path} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{e.nombre}</span>
                      <span className="truncate text-sm text-muted-foreground">
                        {[
                          e.jugadores === 1 ? '1 jugador' : `${String(e.jugadores)} jugadores`,
                          e.grupo ? `Grupo ${e.grupo.nombre}` : 'Sin grupo',
                        ].join(' · ')}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {formulario > 0 && categoria && (
        <FormularioEquipo
          key={formulario}
          equipo={null}
          ocupado={crearEquipo.isPending}
          cerrar={() => {
            setFormulario(0)
          }}
          guardar={(datos) => {
            crearEquipo.mutate(
              { categoriaId: categoria.id, datos },
              {
                onSuccess: (id) => {
                  toast.success('Equipo creado. Agrega su escudo y jugadores.', { duration: 3000 })
                  setFormulario(0)
                  void navigate({ pathname: `/admin/equipos/${String(id)}`, search })
                },
              },
            )
          }}
        />
      )}
    </div>
  )
}
