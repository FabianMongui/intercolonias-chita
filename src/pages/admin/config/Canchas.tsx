import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { useOutletContext } from 'react-router'
import { toast } from 'sonner'
import { ErrorFormulario } from '@/components/CampoClave'
import { ErrorDatos } from '@/components/EstadosPagina'
import { ConfirmarBorrado } from '@/components/admin/ConfirmarBorrado'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { type CanchaConfig, type DatosCancha, useCanchasConfig, useMutacionesCanchas } from '@/hooks/useConfigCanchas'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

/** Canchas del torneo en edición (§4.2 super admin 2): crear, tipo, activar/cerrar, orden y borrar. */
export default function Canchas() {
  const { torneo } = useOutletContext<ContextoConfig>()
  const canchasQ = useCanchasConfig(torneo?.id)
  const mutaciones = useMutacionesCanchas(torneo?.id)
  const [formulario, setFormulario] = useState<{ cancha: CanchaConfig | null; clave: number } | null>(null)
  const [aCerrar, setACerrar] = useState<CanchaConfig | null>(null)
  const [aBorrar, setABorrar] = useState<CanchaConfig | null>(null)
  const [aperturas, setAperturas] = useState(0)
  const canchas = canchasQ.data ?? []

  if (!torneo) {
    return <p className="text-muted-foreground">Primero crea un torneo en la sección Torneo.</p>
  }

  const abrirFormulario = (cancha: CanchaConfig | null) => {
    setAperturas((n) => n + 1)
    setFormulario({ cancha, clave: aperturas + 1 })
  }

  const cambiarActiva = (cancha: CanchaConfig, activa: boolean) => {
    // Cerrar una cancha con partidos pendientes pide confirmación; abrirla no.
    if (!activa && cancha.pendientes > 0) {
      setACerrar(cancha)
      return
    }
    mutaciones.editar.mutate(
      { id: cancha.id, datos: { activa } },
      { onSuccess: () => toast.success(`${cancha.nombre} ${activa ? 'habilitada' : 'cerrada'}`, { duration: 3000 }) },
    )
  }

  const mover = (indice: number, delta: -1 | 1) => {
    const ids = canchas.map((c) => c.id)
    const destino = indice + delta
    const a = ids[indice]
    const b = ids[destino]
    if (a === undefined || b === undefined) return
    ids[indice] = b
    ids[destino] = a
    mutaciones.reordenar.mutate(ids)
  }

  return (
    <div className="flex flex-col gap-6">
      <title>Canchas · Intercolonias Chita</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Canchas</h1>
        <Button
          onClick={() => {
            abrirFormulario(null)
          }}
        >
          <Plus aria-hidden />
          Nueva cancha
        </Button>
      </div>

      {canchasQ.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando canchas">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : canchasQ.isError ? (
        <ErrorDatos nivel="h2" reintentar={() => void canchasQ.refetch()} reintentando={canchasQ.isRefetching} />
      ) : canchas.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Este torneo aún no tiene canchas. Agrega la primera.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {canchas.map((c, i) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <h2 className="truncate text-2xl leading-tight">{c.nombre}</h2>
                  <p className="text-sm text-muted-foreground">
                    {`${c.tipo} · ${c.pendientes > 0 ? plural(c.pendientes, 'pendiente', 'pendientes') : 'sin pendientes'}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    aria-hidden
                    className={c.activa ? 'text-sm font-semibold text-primary' : 'text-sm font-semibold text-muted-foreground'}
                  >
                    {c.activa ? 'Habilitada' : 'Cerrada'}
                  </span>
                  <Switch
                    checked={c.activa}
                    disabled={mutaciones.ocupado}
                    aria-label={`Habilitar ${c.nombre}`}
                    onCheckedChange={(activa) => {
                      cambiarActiva(c, activa)
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    abrirFormulario(c)
                  }}
                >
                  <Pencil aria-hidden />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Subir ${c.nombre}`}
                  disabled={i === 0 || mutaciones.ocupado}
                  onClick={() => {
                    mover(i, -1)
                  }}
                >
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Bajar ${c.nombre}`}
                  disabled={i === canchas.length - 1 || mutaciones.ocupado}
                  onClick={() => {
                    mover(i, 1)
                  }}
                >
                  <ArrowDown aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  aria-label={`Borrar ${c.nombre}`}
                  disabled={mutaciones.ocupado}
                  onClick={() => {
                    setAperturas((n) => n + 1)
                    setABorrar(c)
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formulario && (
        <FormularioCancha
          key={formulario.clave}
          cancha={formulario.cancha}
          ocupado={mutaciones.ocupado}
          cerrar={() => {
            setFormulario(null)
          }}
          guardar={(datos) => {
            const editando = formulario.cancha
            const alTerminar = {
              onSuccess: () => {
                toast.success(editando ? 'Cancha guardada' : 'Cancha creada', { duration: 3000 })
                setFormulario(null)
              },
            }
            if (editando) mutaciones.editar.mutate({ id: editando.id, datos }, alTerminar)
            else mutaciones.crear.mutate({ datos, orden: canchas.length }, alTerminar)
          }}
        />
      )}

      <AlertDialog
        open={aCerrar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setACerrar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{`¿Cerrar ${aCerrar?.nombre ?? ''}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {`No se le programarán partidos nuevos. ${plural(aCerrar?.pendientes ?? 0, 'El partido pendiente sigue', 'Los partidos pendientes siguen')} en esta cancha hasta que reprogrames los horarios.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (aCerrar) {
                  const cancha = aCerrar
                  mutaciones.editar.mutate(
                    { id: cancha.id, datos: { activa: false } },
                    { onSuccess: () => toast.success(`${cancha.nombre} cerrada`, { duration: 3000 }) },
                  )
                }
              }}
            >
              Cerrar cancha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {aBorrar && (
        <ConfirmarBorrado
          key={`borrar-${String(aperturas)}`}
          abierto
          cambiar={(abierto) => {
            if (!abierto) setABorrar(null)
          }}
          titulo="Borrar cancha"
          nombre={aBorrar.nombre}
          consecuencias={
            aBorrar.total > 0 ? [`${plural(aBorrar.total, 'partido quedará', 'partidos quedarán')} sin cancha asignada`] : []
          }
          borrar={() => {
            const cancha = aBorrar
            mutaciones.borrar.mutate(cancha.id, { onSuccess: () => toast.success(`${cancha.nombre} borrada`, { duration: 3000 }) })
          }}
        />
      )}
    </div>
  )
}

function FormularioCancha({
  cancha,
  ocupado,
  cerrar,
  guardar,
}: {
  cancha: CanchaConfig | null
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: DatosCancha) => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState(cancha?.nombre ?? '')
  const [tipo, setTipo] = useState<'F11' | 'F6'>(cancha?.tipo === 'F6' ? 'F6' : 'F11')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Escribe el nombre de la cancha.')
      document.getElementById(`${id}-nombre`)?.focus()
      return
    }
    setError(null)
    guardar({ nombre: nombre.trim(), tipo })
  }

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto) cerrar()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{cancha ? 'Editar cancha' : 'Nueva cancha'}</SheetTitle>
          <SheetDescription>F11 para fútbol de 11, F6 para fútbol de 6 (femenino).</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-nombre`}>Nombre</Label>
            <Input
              id={`${id}-nombre`}
              value={nombre}
              placeholder="Cancha 4"
              aria-invalid={error !== null}
              aria-describedby={`${id}-error`}
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Tipo</legend>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(['F11', 'F6'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tipo === t}
                  onClick={() => {
                    setTipo(t)
                  }}
                  className={
                    tipo === t
                      ? 'min-h-11 rounded-lg bg-primary font-semibold text-primary-foreground focus-visible:outline-3 focus-visible:outline-ring'
                      : 'min-h-11 rounded-lg font-semibold text-muted-foreground hover:bg-surface focus-visible:outline-3 focus-visible:outline-ring'
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <ErrorFormulario id={`${id}-error`}>{error}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {cancha ? 'Guardar cambios' : 'Crear cancha'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
