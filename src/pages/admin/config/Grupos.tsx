import {
  DndContext,
  type DragEndEvent,
  type UniqueIdentifier,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ArrowDownToLine, Check, Lock, Plus, Shuffle, Trash2 } from 'lucide-react'
import { type ComponentProps, type ReactNode, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorDatos } from '@/components/EstadosPagina'
import { SelectorCategoria } from '@/components/admin/SelectorCategoria'
import { Escudo } from '@/components/partido/Escudo'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoriasConfig } from '@/hooks/useConfigCategorias'
import { type EquipoBombo, siguienteLetra, useBombos, useMutacionesGrupos } from '@/hooks/useConfigGrupos'
import { cn } from '@/lib/utils'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

/**
 * Bombos (§4.2 super admin 5): grupos de cada categoría. Se arman a mano (tocar un equipo y luego
 * el grupo destino, o arrastrarlo), con sorteo de los que faltan, o combinando: cabezas de serie a mano y sorteo del resto.
 * Arrastrar: con el mouse basta moverlo unos píxeles; en el celular, dejar el dedo apretado medio segundo (un toque
 * corto sigue eligiendo el equipo). Con teclado se usa "tocar y tocar" (Enter en el equipo y luego en el grupo).
 */
export default function Grupos() {
  const { torneo } = useOutletContext<ContextoConfig>()
  const categoriasQ = useCategoriasConfig(torneo?.id)
  const categorias = categoriasQ.data ?? []
  const [params, setParams] = useSearchParams()
  const categoria = categorias.find((c) => c.id === Number(params.get('cat'))) ?? categorias[0]
  const bombosQ = useBombos(categoria?.id)
  const mut = useMutacionesGrupos()
  const [elegido, setElegido] = useState<EquipoBombo | null>(null)
  const [sorteo, setSorteo] = useState(false)
  const [grupoABorrar, setGrupoABorrar] = useState<{ id: number; nombre: string; equipos: number } | null>(null)
  const [arrastrado, setArrastrado] = useState<EquipoBombo | null>(null)
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 8 } }),
  )

  if (!torneo) return <p className="text-muted-foreground">Primero crea un torneo en la sección Torneo.</p>

  const ocupado = mut.moverEquipo.isPending || mut.crearGrupo.isPending || mut.borrarGrupo.isPending || mut.sortear.isPending

  const mover = (equipo: EquipoBombo | null, grupoId: number | null, destino: string) => {
    if (!equipo || equipo.grupo_id === grupoId) return
    setElegido(null)
    mut.moverEquipo.mutate(
      { equipoId: equipo.id, grupoId },
      { onSuccess: () => toast.success(`${equipo.nombre} → ${destino}`, { duration: 2000 }) },
    )
  }

  const contenido = () => {
    if (bombosQ.isPending) {
      return (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando grupos">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      )
    }
    if (bombosQ.isError) {
      return <ErrorDatos nivel="h2" reintentar={() => void bombosQ.refetch()} reintentando={bombosQ.isRefetching} />
    }
    const { grupos, equipos, partidosDeGrupos } = bombosQ.data
    const cerrado = partidosDeGrupos > 0
    const sinGrupo = equipos.filter((e) => e.grupo_id === null)
    const chip = (e: EquipoBombo) => {
      const activo = elegido?.id === e.id
      if (cerrado) {
        return (
          <li key={e.id} className="flex min-h-11 items-center gap-2 rounded-full border bg-card py-1 pr-4 pl-1 font-semibold">
            <Escudo nombre={e.nombre} path={e.escudo_path} tamano="sm" />
            {e.nombre}
          </li>
        )
      }
      return (
        <li key={e.id}>
          <ChipEquipo
            equipo={e}
            activo={activo}
            disabled={ocupado}
            onClick={() => {
              setElegido(activo ? null : e)
            }}
          />
        </li>
      )
    }
    const destino = (texto: string, accion: () => void) =>
      elegido && (
        <Button variant="outline" className="w-full border-primary border-dashed text-primary" onClick={accion}>
          <ArrowDownToLine aria-hidden />
          {texto}
        </Button>
      )

    const nombreEquipo = (id: UniqueIdentifier) => equipos.find((e) => e.id === id)?.nombre ?? 'el equipo'
    const nombreZona = (id: UniqueIdentifier) =>
      id === 'sin-grupo' ? 'Sin grupo' : `Grupo ${grupos.find((g) => `grupo-${String(g.id)}` === id)?.nombre ?? ''}`
    const soltar = ({ active, over }: DragEndEvent) => {
      setArrastrado(null)
      if (!over) return
      const equipo = equipos.find((e) => e.id === active.id) ?? null
      if (over.id === 'sin-grupo') {
        mover(equipo, null, 'Sin grupo')
        return
      }
      const grupo = grupos.find((g) => `grupo-${String(g.id)}` === over.id)
      if (grupo) mover(equipo, grupo.id, `Grupo ${grupo.nombre}`)
    }

    return (
      <DndContext
        sensors={sensores}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Para mover un equipo, actívalo y luego activa el botón "Mover aquí" del grupo.',
          },
          announcements: {
            onDragStart: ({ active }) => `Moviendo ${nombreEquipo(active.id)}.`,
            onDragOver: ({ active, over }) =>
              over ? `${nombreEquipo(active.id)} sobre ${nombreZona(over.id)}.` : `${nombreEquipo(active.id)} fuera de los grupos.`,
            onDragEnd: ({ active, over }) =>
              over ? `${nombreEquipo(active.id)} soltado en ${nombreZona(over.id)}.` : `${nombreEquipo(active.id)} vuelve a su lugar.`,
            onDragCancel: ({ active }) => `Se canceló mover ${nombreEquipo(active.id)}.`,
          },
        }}
        onDragStart={({ active }) => {
          setElegido(null)
          setArrastrado(equipos.find((e) => e.id === active.id) ?? null)
        }}
        onDragCancel={() => {
          setArrastrado(null)
        }}
        onDragEnd={soltar}
      >
        {cerrado && (
          <p className="flex items-start gap-2 rounded-lg border bg-surface-warm p-3 text-sm">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
            {`Los grupos están cerrados: ya hay ${plural(partidosDeGrupos, 'partido', 'partidos')} de grupos. Para cambiarlos, primero borra los partidos de esta categoría en Fixture.`}
          </p>
        )}
        {!cerrado && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={ocupado || siguienteLetra(grupos.map((g) => g.nombre)) === null}
              onClick={() => {
                const nombre = siguienteLetra(grupos.map((g) => g.nombre))
                if (!nombre) return
                mut.crearGrupo.mutate(
                  { categoriaId: categoria?.id ?? 0, nombre },
                  { onSuccess: () => toast.success(`Grupo ${nombre} creado`, { duration: 2000 }) },
                )
              }}
            >
              <Plus aria-hidden />
              Agregar grupo
            </Button>
            <Button
              disabled={ocupado || grupos.length === 0 || sinGrupo.length === 0}
              onClick={() => {
                setSorteo(true)
              }}
            >
              <Shuffle aria-hidden />
              Sortear los que faltan
            </Button>
          </div>
        )}
        {!cerrado && (grupos.length === 0 || sinGrupo.length === 0) && equipos.length > 0 && (
          <p className="-mt-2 text-sm text-muted-foreground">
            {grupos.length === 0 ? 'Crea al menos un grupo para sortear.' : 'No quedan equipos sin grupo para sortear.'}
          </p>
        )}
        {!cerrado && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {elegido
              ? `${elegido.nombre} elegido. Toca el grupo donde va, o tócalo otra vez para soltarlo.`
              : 'Toca un equipo y luego el grupo donde va, o arrástralo (en el celular, déjalo apretado un momento). Puedes fijar a mano los cabezas de serie y sortear el resto.'}
          </p>
        )}

        <ZonaSoltar id="sin-grupo" aria-labelledby="titulo-sin-grupo" className="flex flex-col gap-3 rounded-lg border border-dashed bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="titulo-sin-grupo" className="text-2xl">
              {`Sin grupo (${String(sinGrupo.length)})`}
            </h2>
            {elegido?.grupo_id != null &&
              destino('Quitar del grupo', () => {
                mover(elegido, null, 'Sin grupo')
              })}
          </div>
          {equipos.length === 0 ? (
            <p className="text-muted-foreground">Esta categoría aún no tiene equipos. Agrégalos en la sección Equipos.</p>
          ) : sinGrupo.length === 0 ? (
            <p className="text-muted-foreground">Todos los equipos tienen grupo.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">{sinGrupo.map(chip)}</ul>
          )}
        </ZonaSoltar>

        {grupos.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
            Aún no hay grupos. Agrega el grupo A para empezar.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {grupos.map((g) => {
              const delGrupo = equipos.filter((e) => e.grupo_id === g.id)
              return (
                <li key={g.id}>
                  <ZonaSoltar
                    id={`grupo-${String(g.id)}`}
                    aria-labelledby={`grupo-${String(g.id)}`}
                    className="flex flex-col gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id={`grupo-${String(g.id)}`} className="text-2xl">
                        {`Grupo ${g.nombre}`}
                      </h2>
                      <span className="text-sm text-muted-foreground">{plural(delGrupo.length, 'equipo', 'equipos')}</span>
                      {(cerrado || elegido) && <span aria-hidden className="ml-auto size-11" />}
                      {!cerrado && !elegido && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={ocupado}
                          className="ml-auto text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={`Borrar grupo ${g.nombre}`}
                          onClick={() => {
                            setGrupoABorrar({ id: g.id, nombre: g.nombre, equipos: delGrupo.length })
                          }}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      )}
                    </div>
                    {elegido &&
                      elegido.grupo_id !== g.id &&
                      destino(`Mover aquí (Grupo ${g.nombre})`, () => {
                        mover(elegido, g.id, `Grupo ${g.nombre}`)
                      })}
                    {delGrupo.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin equipos.</p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">{delGrupo.map(chip)}</ul>
                    )}
                  </ZonaSoltar>
                </li>
              )
            })}
          </ul>
        )}

        <DragOverlay dropAnimation={null}>
          {arrastrado && <ChipFlotante equipo={arrastrado} />}
        </DragOverlay>

        <AlertDialog open={sorteo} onOpenChange={setSorteo}>
          <AlertDialogContent>
            <AlertDialogTitle>¿Sortear los equipos sin grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Se reparten al azar ${plural(sinGrupo.length, 'equipo', 'equipos')} entre ${plural(grupos.length, 'grupo', 'grupos')}, dejando los grupos parejos. Los que ya tienen grupo no se mueven.`}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setElegido(null)
                  mut.sortear.mutate(categoria?.id ?? 0, {
                    onSuccess: (n) => toast.success(`Sorteo listo: ${plural(n, 'equipo asignado', 'equipos asignados')}`, { duration: 3000 }),
                  })
                }}
              >
                Sortear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={grupoABorrar !== null}
          onOpenChange={(abierto) => {
            if (!abierto) setGrupoABorrar(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogTitle>{`¿Borrar el grupo ${grupoABorrar?.nombre ?? ''}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {grupoABorrar && grupoABorrar.equipos > 0
                ? `${plural(grupoABorrar.equipos, 'equipo vuelve', 'equipos vuelven')} a "Sin grupo".`
                : 'El grupo está vacío.'}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive-hover"
                onClick={() => {
                  if (grupoABorrar) {
                    const { id, nombre } = grupoABorrar
                    mut.borrarGrupo.mutate(id, { onSuccess: () => toast.success(`Grupo ${nombre} borrado`, { duration: 2000 }) })
                  }
                }}
              >
                Borrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DndContext>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <title>Grupos · Intercolonias Chita</title>
      <h1 className="text-4xl">Grupos</h1>
      {categoriasQ.isPending ? (
        <Skeleton className="h-11" />
      ) : categoriasQ.isError ? (
        <ErrorDatos nivel="h2" reintentar={() => void categoriasQ.refetch()} reintentando={categoriasQ.isRefetching} />
      ) : categorias.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Primero crea las categorías del torneo y sus equipos.
        </p>
      ) : (
        <>
          <SelectorCategoria
            categorias={categorias}
            categoria={categoria}
            cambiar={(id) => {
              setElegido(null)
              setParams({ cat: id }, { replace: true })
            }}
          />
          {contenido()}
        </>
      )}
    </div>
  )
}

/** Chip de un equipo: se toca para elegirlo o se arrastra (mouse, o dedo apretado en el celular). */
function ChipEquipo({
  equipo,
  activo,
  disabled = false,
  onClick,
}: {
  equipo: EquipoBombo
  activo: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: equipo.id, disabled })
  // Sin los atributos de teclado/ARIA de dnd-kit (attributes): con teclado se usa "tocar y tocar" (aria-pressed).
  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={disabled}
      aria-pressed={activo}
      onClick={onClick}
      {...listeners}
      className={cn(
        'flex min-h-11 touch-manipulation items-center gap-2 rounded-full border bg-card py-1 pr-4 pl-1 text-left font-semibold transition-colors select-none [-webkit-touch-callout:none] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60',
        activo ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
        isDragging && 'opacity-40',
      )}
    >
      <Escudo nombre={equipo.nombre} path={equipo.escudo_path} tamano="sm" />
      {equipo.nombre}
      {activo && <Check aria-hidden className="size-4" />}
    </button>
  )
}

/** Copia del chip que sigue al dedo o al mouse mientras se arrastra (solo visual). */
function ChipFlotante({ equipo }: { equipo: EquipoBombo }) {
  return (
    <div
      aria-hidden
      className="flex min-h-11 cursor-grabbing items-center gap-2 rounded-full border border-primary bg-primary py-1 pr-4 pl-1 font-semibold text-primary-foreground shadow-lg"
    >
      <Escudo nombre={equipo.nombre} path={equipo.escudo_path} tamano="sm" />
      {equipo.nombre}
    </div>
  )
}

/** Sección donde se puede soltar un equipo; se resalta cuando el equipo arrastrado está encima. */
function ZonaSoltar({ id, className, children, ...props }: ComponentProps<'section'> & { id: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <section ref={setNodeRef} className={cn(className, isOver && 'ring-3 ring-primary ring-offset-2')} {...props}>
      {children}
    </section>
  )
}
