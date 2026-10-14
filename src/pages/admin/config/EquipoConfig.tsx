import { ArrowLeft, ImageUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { type SubmitEvent, useId, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorFormulario } from '@/components/CampoClave'
import { ErrorDatos, NoEncontrado } from '@/components/EstadosPagina'
import { ConfirmarBorrado } from '@/components/admin/ConfirmarBorrado'
import { FormularioEquipo } from '@/components/admin/FormularioEquipo'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type DatosJugador,
  type JugadorConfig,
  useEquipoConfig,
  useImpactoEquipo,
  useMutacionesEquipos,
} from '@/hooks/useConfigEquipos'

const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`
const textoJugador = (j: { numero: number | null; nombre: string }) =>
  `${j.numero !== null ? `#${String(j.numero)} ` : ''}${j.nombre}`

interface ErrorJugador {
  campo: 'numero' | 'nombre'
  mensaje: string
}

/** Nombre obligatorio; dorsal opcional, de 0 a 99 y sin repetir en el plantel. */
function validarJugador(numero: string, nombre: string, otros: JugadorConfig[]): ErrorJugador | null {
  const dorsal = numero === '' ? null : Number(numero)
  if (dorsal !== null && (!Number.isInteger(dorsal) || dorsal < 0 || dorsal > 99)) {
    return { campo: 'numero', mensaje: 'El dorsal va de 0 a 99.' }
  }
  if (dorsal !== null && otros.some((j) => j.numero === dorsal)) {
    return { campo: 'numero', mensaje: `Ya hay un jugador con el #${String(dorsal)}.` }
  }
  if (!nombre.trim()) return { campo: 'nombre', mensaje: 'Escribe el nombre del jugador.' }
  return null
}

/** Un equipo: escudo, datos y plantel con alta rápida (§4.2 super admin 4). */
export default function EquipoConfig() {
  const id = Number(useParams().id)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const equipoQ = useEquipoConfig(id)
  const mut = useMutacionesEquipos()
  const [editar, setEditar] = useState(0)
  const [quitarEscudo, setQuitarEscudo] = useState(false)
  const [borrarEquipo, setBorrarEquipo] = useState(0)
  const [jugadorEditado, setJugadorEditado] = useState<{ jugador: JugadorConfig; clave: number } | null>(null)
  const [jugadorABorrar, setJugadorABorrar] = useState<JugadorConfig | null>(null)
  const impacto = useImpactoEquipo(borrarEquipo > 0 ? id : undefined).data
  const archivo = useRef<HTMLInputElement>(null)
  const volver = { pathname: '/admin/equipos', search: params.get('cat') ? `?cat=${params.get('cat') ?? ''}` : '' }

  const enlaceVolver = (
    <Link
      to={volver}
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-md font-semibold text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeft aria-hidden className="size-5" />
      Equipos
    </Link>
  )

  if (!Number.isInteger(id) || id <= 0) return <NoEncontrado que="Equipo" volver={enlaceVolver} />
  if (equipoQ.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando equipo">
        <Skeleton className="h-11 w-32" />
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    )
  }
  if (equipoQ.isError) {
    return <ErrorDatos reintentar={() => void equipoQ.refetch()} reintentando={equipoQ.isRefetching} />
  }
  const equipo = equipoQ.data
  if (!equipo) return <NoEncontrado que="Equipo" volver={enlaceVolver} />

  return (
    <div className="flex flex-col gap-6">
      <title>{`${equipo.nombre} · Configuración · Intercolonias Chita`}</title>
      {enlaceVolver}

      <section aria-labelledby="titulo-equipo" className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <Escudo nombre={equipo.nombre} path={equipo.escudo_path} tamano="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 id="titulo-equipo" className="text-3xl leading-tight break-words sm:text-4xl">
              {equipo.nombre}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[equipo.categoria.nombre, equipo.grupo ? `Grupo ${equipo.grupo.nombre}` : 'Sin grupo'].join(' · ')}
            </p>
            {equipo.representante && <p className="text-sm">{`Representante: ${equipo.representante}`}</p>}
          </div>
        </div>
        <input
          ref={archivo}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const elegido = e.target.files?.[0]
            e.target.value = ''
            if (!elegido) return
            mut.subirEscudo.mutate(
              { equipo, archivo: elegido },
              { onSuccess: () => toast.success('Escudo actualizado', { duration: 3000 }) },
            )
          }}
        />
        <div className={equipo.escudo_path ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
          <Button variant="outline" disabled={mut.subirEscudo.isPending} onClick={() => archivo.current?.click()}>
            {mut.subirEscudo.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <ImageUp aria-hidden />}
            {equipo.escudo_path ? 'Cambiar escudo' : 'Subir escudo'}
          </Button>
          {equipo.escudo_path && (
            <Button
              variant="outline"
              disabled={mut.quitarEscudo.isPending}
              onClick={() => {
                setQuitarEscudo(true)
              }}
            >
              <X aria-hidden />
              Quitar escudo
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditar((n) => n + 1)
            }}
          >
            <Pencil aria-hidden />
            Editar datos
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-destructive hover:bg-destructive hover:text-destructive-foreground"
            aria-label={`Borrar ${equipo.nombre}`}
            onClick={() => {
              setBorrarEquipo((n) => n + 1)
            }}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </section>

      <Plantel
        jugadores={equipo.jugadores}
        agregar={(datos, alTerminar) => {
          mut.crearJugador.mutate({ equipoId: equipo.id, datos }, { onSuccess: alTerminar })
        }}
        agregando={mut.crearJugador.isPending}
        editar={(jugador) => {
          setJugadorEditado({ jugador, clave: Date.now() })
        }}
        borrar={setJugadorABorrar}
      />

      {editar > 0 && (
        <FormularioEquipo
          key={editar}
          equipo={equipo}
          ocupado={mut.editarEquipo.isPending}
          cerrar={() => {
            setEditar(0)
          }}
          guardar={(datos) => {
            mut.editarEquipo.mutate(
              { id: equipo.id, datos },
              {
                onSuccess: () => {
                  toast.success('Equipo guardado', { duration: 3000 })
                  setEditar(0)
                },
              },
            )
          }}
        />
      )}

      {jugadorEditado && (
        <FormularioJugador
          key={jugadorEditado.clave}
          jugador={jugadorEditado.jugador}
          otros={equipo.jugadores.filter((j) => j.id !== jugadorEditado.jugador.id)}
          ocupado={mut.editarJugador.isPending}
          cerrar={() => {
            setJugadorEditado(null)
          }}
          guardar={(datos) => {
            mut.editarJugador.mutate(
              { id: jugadorEditado.jugador.id, datos },
              {
                onSuccess: () => {
                  toast.success('Jugador guardado', { duration: 3000 })
                  setJugadorEditado(null)
                },
              },
            )
          }}
        />
      )}

      <AlertDialog open={quitarEscudo} onOpenChange={setQuitarEscudo}>
        <AlertDialogContent>
          <AlertDialogTitle>¿Quitar el escudo?</AlertDialogTitle>
          <AlertDialogDescription>Se mostrarán las iniciales del equipo en su lugar.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive-hover"
              onClick={() => {
                mut.quitarEscudo.mutate(equipo, { onSuccess: () => toast.success('Escudo quitado', { duration: 3000 }) })
              }}
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={jugadorABorrar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setJugadorABorrar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{`¿Borrar a ${jugadorABorrar ? textoJugador(jugadorABorrar) : ''}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            Si hizo goles, quedan en el marcador pero sin jugador (salen de la tabla de goleadores).
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive-hover"
              onClick={() => {
                if (jugadorABorrar) {
                  mut.borrarJugador.mutate(jugadorABorrar.id, {
                    onSuccess: () => toast.success('Jugador borrado', { duration: 3000 }),
                  })
                }
              }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {borrarEquipo > 0 && (
        <ConfirmarBorrado
          key={`borrar-${String(borrarEquipo)}`}
          abierto
          cambiar={(abierto) => {
            if (!abierto) setBorrarEquipo(0)
          }}
          titulo="Borrar equipo"
          nombre={equipo.nombre}
          consecuencias={[
            equipo.jugadores.length > 0 ? plural(equipo.jugadores.length, 'jugador', 'jugadores') : null,
            impacto ? null : 'Calculando partidos y goles afectados…',
            impacto && impacto.partidosJugados > 0
              ? `${plural(impacto.partidosJugados, 'partido jugado queda', 'partidos jugados quedan')} sin este equipo`
              : null,
            impacto && impacto.goles > 0
              ? `${plural(impacto.goles, 'gol a su favor', 'goles a su favor')} (los resultados y la tabla cambian)`
              : null,
          ].filter((linea): linea is string => linea !== null)}
          borrar={() => {
            mut.borrarEquipo.mutate(equipo, {
              onSuccess: () => {
                toast.success(`${equipo.nombre} borrado`, { duration: 3000 })
                void navigate(volver)
              },
            })
          }}
        />
      )}
    </div>
  )
}

/** Plantel con alta rápida: dorsal + nombre + Enter, y queda listo para el siguiente. */
function Plantel({
  jugadores,
  agregar,
  agregando,
  editar,
  borrar,
}: {
  jugadores: JugadorConfig[]
  agregar: (datos: DatosJugador, alTerminar: () => void) => void
  agregando: boolean
  editar: (jugador: JugadorConfig) => void
  borrar: (jugador: JugadorConfig) => void
}) {
  const id = useId()
  const [numero, setNumero] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<ErrorJugador | null>(null)
  const campoNumero = useRef<HTMLInputElement>(null)

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const problema = validarJugador(numero, nombre, jugadores)
    setError(problema)
    if (problema) {
      document.getElementById(`${id}-${problema.campo}`)?.focus()
      return
    }
    agregar({ nombre: nombre.trim(), numero: numero === '' ? null : Number(numero) }, () => {
      setNumero('')
      setNombre('')
      campoNumero.current?.focus()
    })
  }

  return (
    <section aria-labelledby="titulo-plantel" className="flex flex-col gap-3">
      <h2 id="titulo-plantel" className="text-3xl">
        {`Plantel (${String(jugadores.length)})`}
      </h2>
      <form className="flex flex-col gap-2 rounded-lg border bg-surface-warm p-3" onSubmit={enviar} noValidate>
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-numero`}>Dorsal</Label>
            <Input
              ref={campoNumero}
              id={`${id}-numero`}
              inputMode="numeric"
              value={numero}
              aria-invalid={error?.campo === 'numero'}
              aria-describedby={error?.campo === 'numero' ? `${id}-error` : undefined}
              onChange={(e) => {
                setNumero(e.target.value.replace(/\D/g, '').slice(0, 2))
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-nombre`}>Nombre</Label>
            <Input
              id={`${id}-nombre`}
              placeholder="Nombre y apellido"
              value={nombre}
              aria-invalid={error?.campo === 'nombre'}
              aria-describedby={error?.campo === 'nombre' ? `${id}-error` : undefined}
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
        </div>
        <ErrorFormulario id={`${id}-error`}>{error?.mensaje ?? null}</ErrorFormulario>
        <Button type="submit" disabled={agregando}>
          {agregando ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          Agregar jugador
        </Button>
      </form>
      {jugadores.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">Aún no hay jugadores.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {jugadores.map((j) => (
            <li key={j.id} className="flex min-h-14 items-center gap-2 px-3 py-1">
              <span className="w-10 shrink-0 text-right font-display text-2xl leading-none tabular-nums text-primary">
                {j.numero ?? '–'}
              </span>
              <span className="min-w-0 flex-1 truncate">{j.nombre}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Editar a ${textoJugador(j)}`}
                onClick={() => {
                  editar(j)
                }}
              >
                <Pencil aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                aria-label={`Borrar a ${textoJugador(j)}`}
                onClick={() => {
                  borrar(j)
                }}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FormularioJugador({
  jugador,
  otros,
  ocupado,
  cerrar,
  guardar,
}: {
  jugador: JugadorConfig
  /** El resto del plantel, para no repetir dorsal. */
  otros: JugadorConfig[]
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: DatosJugador) => void
}) {
  const id = useId()
  const [numero, setNumero] = useState(jugador.numero !== null ? String(jugador.numero) : '')
  const [nombre, setNombre] = useState(jugador.nombre)
  const [error, setError] = useState<ErrorJugador | null>(null)

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const problema = validarJugador(numero, nombre, otros)
    setError(problema)
    if (problema) {
      document.getElementById(`${id}-${problema.campo}`)?.focus()
      return
    }
    guardar({ nombre: nombre.trim(), numero: numero === '' ? null : Number(numero) })
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
          <SheetTitle>Editar jugador</SheetTitle>
          <SheetDescription>El dorsal es opcional, de 0 a 99.</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="grid grid-cols-[5rem_1fr] gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-numero`}>Dorsal</Label>
              <Input
                id={`${id}-numero`}
                inputMode="numeric"
                value={numero}
                aria-invalid={error?.campo === 'numero'}
                aria-describedby={error?.campo === 'numero' ? `${id}-error` : undefined}
                onChange={(e) => {
                  setNumero(e.target.value.replace(/D/g, '').slice(0, 2))
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-nombre`}>Nombre</Label>
              <Input
                id={`${id}-nombre`}
                value={nombre}
                aria-invalid={error?.campo === 'nombre'}
                aria-describedby={error?.campo === 'nombre' ? `${id}-error` : undefined}
                onChange={(e) => {
                  setNombre(e.target.value)
                }}
              />
            </div>
          </div>
          <ErrorFormulario id={`${id}-error`}>{error?.mensaje ?? null}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {ocupado && <Loader2 aria-hidden className="animate-spin" />}
            Guardar
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
