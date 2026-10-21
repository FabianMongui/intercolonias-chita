import { Copy, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { useOutletContext } from 'react-router'
import { toast } from 'sonner'
import { ErrorFormulario } from '@/components/CampoClave'
import { ErrorDatos } from '@/components/EstadosPagina'
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
import { useCanchasConfig } from '@/hooks/useConfigCanchas'
import {
  type DatosUsuario,
  type NuevoUsuario,
  type UsuarioConfig,
  useCorreos,
  useMutacionesUsuarios,
  useUsuarios,
} from '@/hooks/useConfigUsuarios'
import { NOMBRE_ROL } from '@/hooks/usePerfil'
import { cn } from '@/lib/utils'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

const ROLES = ['admin', 'super_admin'] as const
const claseSelect =
  'min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Usuarios del panel (§4.2 super admin 7): rol, cancha sugerida y activar/desactivar. */
export default function Usuarios() {
  const { perfil, torneo } = useOutletContext<ContextoConfig>()
  const usuariosQ = useUsuarios()
  const canchas = useCanchasConfig(torneo?.id).data ?? []
  const { editar, crear, restablecer, borrar } = useMutacionesUsuarios()
  const correos = useCorreos().data
  const [nuevo, setNuevo] = useState(0)
  /** Contraseña temporal recién creada: se muestra una sola vez. */
  const [clave, setClave] = useState<{ titulo: string; correo: string; contrasena: string } | null>(null)
  const [editando, setEditando] = useState<{ usuario: UsuarioConfig; clave: number } | null>(null)
  /** Lo que le cierra el acceso a alguien (desactivar, quitar super admin) pide confirmación (regla 6). */
  const [confirmar, setConfirmar] = useState<{ titulo: string; texto: string; boton?: string; accion: () => void } | null>(
    null,
  )
  const guardar = (u: UsuarioConfig, datos: Partial<DatosUsuario>, aviso: string, alTerminar?: () => void) => {
    editar.mutate(
      { id: u.id, datos },
      {
        onSuccess: () => {
          toast.success(aviso, { duration: 3000 })
          alTerminar?.()
        },
      },
    )
  }

  const contenido = () => {
    if (usuariosQ.isPending) {
      return (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando usuarios">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )
    }
    if (usuariosQ.isError) {
      return <ErrorDatos nivel="h2" reintentar={() => void usuariosQ.refetch()} reintentando={usuariosQ.isRefetching} />
    }
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {usuariosQ.data.map((u) => {
          const yo = u.id === perfil.id
          return (
            <li key={u.id} className={cn('flex flex-col gap-3 rounded-lg border bg-card p-4', !u.activo && 'bg-surface')}>
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="text-2xl break-words">
                    {u.nombre ?? 'Sin nombre'}
                    {yo && <span className="ml-2 font-sans text-sm font-semibold text-muted-foreground">(tú)</span>}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {[
                      NOMBRE_ROL[u.rol] ?? u.rol,
                      u.rol === 'admin' ? (u.cancha?.nombre ?? 'Sin cancha sugerida') : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {correos?.[u.id] && <p className="text-sm break-all">{correos[u.id]}</p>}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Editar ${u.nombre ?? 'usuario'}`}
                  onClick={() => {
                    setEditando({ usuario: u, clave: Date.now() })
                  }}
                >
                  <Pencil aria-hidden />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={cn('text-sm font-semibold', u.activo ? 'text-primary' : 'text-muted-foreground')} aria-hidden>
                  {u.activo ? 'Activo' : 'Desactivado: no puede entrar al panel'}
                </span>
                <Switch
                  checked={u.activo}
                  disabled={yo || editar.isPending}
                  aria-label={`Activo: ${u.nombre ?? 'usuario'}`}
                  onCheckedChange={(activo) => {
                    const nombre = u.nombre ?? 'Usuario'
                    if (activo) {
                      guardar(u, { activo }, `${nombre} activado`)
                      return
                    }
                    setConfirmar({
                      titulo: `¿Desactivar a ${nombre}?`,
                      texto: 'No podrá entrar al panel ni controlar partidos hasta que lo vuelvas a activar.',
                      accion: () => {
                        guardar(u, { activo }, `${nombre} desactivado`)
                      },
                    })
                  }}
                />
              </div>
              {!yo && (
                <div className="flex items-center gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    disabled={restablecer.isPending}
                    onClick={() => {
                      const nombre = u.nombre ?? 'este usuario'
                      setConfirmar({
                        titulo: `¿Darle una contraseña nueva a ${nombre}?`,
                        texto: 'La contraseña actual deja de servir. Te mostraremos la nueva una sola vez para que se la pases.',
                        boton: 'Generar contraseña',
                        accion: () => {
                          restablecer.mutate(u.id, {
                            onSuccess: (contrasena) => {
                              setClave({ titulo: `Nueva contraseña de ${nombre}`, correo: correos?.[u.id] ?? '', contrasena })
                            },
                          })
                        },
                      })
                    }}
                  >
                    <KeyRound aria-hidden />
                    Nueva contraseña
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={borrar.isPending}
                    aria-label={`Borrar a ${u.nombre ?? 'usuario'}`}
                    onClick={() => {
                      const nombre = u.nombre ?? 'este usuario'
                      setConfirmar({
                        titulo: `¿Borrar a ${nombre}?`,
                        texto:
                          'Se borra su cuenta y ya no podrá entrar. Los goles que registró se conservan. Esta acción no se puede deshacer.',
                        boton: 'Borrar',
                        accion: () => {
                          borrar.mutate(u.id, { onSuccess: () => toast.success(`${nombre} borrado`, { duration: 3000 }) })
                        },
                      })
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <title>Usuarios · Intercolonias Chita</title>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl">Usuarios</h1>
          <Button
            onClick={() => {
              setNuevo((n) => n + 1)
            }}
          >
            <Plus aria-hidden />
            Nuevo usuario
          </Button>
        </div>
        <p className="text-muted-foreground">
          Quién puede entrar al panel y con qué rol. Un usuario desactivado no puede controlar partidos.
        </p>
      </div>
      {contenido()}
      {editando && (
        <FormularioUsuario
          key={editando.clave}
          usuario={editando.usuario}
          yo={editando.usuario.id === perfil.id}
          canchas={canchas}
          ocupado={editar.isPending}
          cerrar={() => {
            setEditando(null)
          }}
          guardar={(datos) => {
            const u = editando.usuario
            const cerrar = () => {
              setEditando(null)
            }
            if (u.rol === 'super_admin' && datos.rol !== 'super_admin') {
              setConfirmar({
                titulo: `¿Quitarle el rol de super admin a ${u.nombre ?? 'este usuario'}?`,
                texto: 'Ya no podrá configurar el torneo; solo controlar partidos como admin de cancha.',
                accion: () => {
                  guardar(u, datos, 'Usuario guardado', cerrar)
                },
              })
              return
            }
            guardar(u, datos, 'Usuario guardado', cerrar)
          }}
        />
      )}
      {nuevo > 0 && (
        <FormularioNuevoUsuario
          key={nuevo}
          canchas={canchas}
          ocupado={crear.isPending}
          cerrar={() => {
            setNuevo(0)
          }}
          crear={(datos) => {
            crear.mutate(datos, {
              onSuccess: ({ correo, contrasena }) => {
                setNuevo(0)
                setClave({ titulo: `Usuario creado: ${datos.nombre}`, correo, contrasena })
              },
            })
          }}
        />
      )}

      <AlertDialog
        open={clave !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setClave(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{clave?.titulo}</AlertDialogTitle>
          <AlertDialogDescription>
            Pásale estos datos a la persona. La contraseña <strong>no se vuelve a mostrar</strong>; puede cambiarla en
            "Mi cuenta".
          </AlertDialogDescription>
          {clave && (
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-lg border bg-surface-warm p-3">
              {clave.correo && (
                <>
                  <dt className="text-sm font-semibold">Correo</dt>
                  <dd className="break-all">{clave.correo}</dd>
                </>
              )}
              <dt className="text-sm font-semibold">Contraseña</dt>
              <dd className="font-mono text-xl tracking-wider select-all" data-contrasena>
                {clave.contrasena}
              </dd>
            </dl>
          )}
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!clave) return
                const texto = clave.correo ? `Correo: ${clave.correo}\nContraseña: ${clave.contrasena}` : clave.contrasena
                navigator.clipboard.writeText(texto).then(
                  () => toast.success('Copiado', { duration: 2000 }),
                  () => toast.error('No se pudo copiar; anótala a mano.'),
                )
              }}
            >
              <Copy aria-hidden />
              Copiar
            </Button>
            <AlertDialogAction>Ya la anoté</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setConfirmar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{confirmar?.titulo}</AlertDialogTitle>
          <AlertDialogDescription>{confirmar?.texto}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive-hover"
              onClick={() => {
                confirmar?.accion()
              }}
            >
              {confirmar?.boton ?? 'Sí, continuar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FormularioUsuario({
  usuario,
  yo,
  canchas,
  ocupado,
  cerrar,
  guardar,
}: {
  usuario: UsuarioConfig
  yo: boolean
  canchas: { id: number; nombre: string }[]
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: Omit<DatosUsuario, 'activo'>) => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState(usuario.nombre ?? '')
  const [rol, setRol] = useState<DatosUsuario['rol']>(usuario.rol === 'super_admin' ? 'super_admin' : 'admin')
  const [cancha, setCancha] = useState(usuario.cancha_id !== null ? String(usuario.cancha_id) : '')
  // La cancha sugerida puede ser de otro torneo: se conserva como opción para no perderla sin querer.
  const opciones =
    usuario.cancha_id !== null && !canchas.some((c) => c.id === usuario.cancha_id)
      ? [...canchas, { id: usuario.cancha_id, nombre: `${usuario.cancha?.nombre ?? 'Cancha'} (otro torneo)` }]
      : canchas

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    guardar({
      nombre: nombre.trim() || null,
      rol,
      cancha_id: rol === 'admin' && cancha !== '' ? Number(cancha) : null,
    })
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
          <SheetTitle>Editar usuario</SheetTitle>
          <SheetDescription>
            {yo ? 'Es tu cuenta: no puedes quitarte el rol de super admin.' : 'El correo y la contraseña no se cambian aquí.'}
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-nombre`}>Nombre</Label>
            <Input
              id={`${id}-nombre`}
              value={nombre}
              placeholder="Nombre de la persona"
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
          <fieldset className="flex flex-col gap-2" disabled={yo}>
            <legend className="mb-2 text-sm font-semibold">Rol</legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-center font-semibold has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                    rol === r ? 'border-primary bg-primary text-primary-foreground' : 'bg-surface',
                    yo && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-rol`}
                    value={r}
                    checked={rol === r}
                    className="sr-only"
                    onChange={() => {
                      setRol(r)
                    }}
                  />
                  {NOMBRE_ROL[r]}
                </label>
              ))}
            </div>
          </fieldset>
          {rol === 'admin' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-cancha`}>Cancha sugerida</Label>
              <select
                id={`${id}-cancha`}
                className={claseSelect}
                value={cancha}
                onChange={(e) => {
                  setCancha(e.target.value)
                }}
              >
                <option value="">Ninguna (ve todas las canchas)</option>
                {opciones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">Es la cancha que el admin ve primero; puede cambiarla en su panel.</p>
            </div>
          )}
          <Button type="submit" size="lg" disabled={ocupado}>
            Guardar
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function FormularioNuevoUsuario({
  canchas,
  ocupado,
  cerrar,
  crear,
}: {
  canchas: { id: number; nombre: string }[]
  ocupado: boolean
  cerrar: () => void
  crear: (datos: NuevoUsuario) => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [rol, setRol] = useState<NuevoUsuario['rol']>('admin')
  const [cancha, setCancha] = useState('')
  const [error, setError] = useState<{ campo: string; mensaje: string } | null>(null)

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const problema = !nombre.trim()
      ? { campo: 'nombre', mensaje: 'Escribe el nombre de la persona.' }
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
        ? { campo: 'correo', mensaje: 'Escribe un correo válido.' }
        : null
    setError(problema)
    if (problema) {
      document.getElementById(`${id}-${problema.campo}`)?.focus()
      return
    }
    crear({
      nombre: nombre.trim(),
      correo: correo.trim(),
      rol,
      cancha_id: rol === 'admin' && cancha !== '' ? Number(cancha) : null,
    })
  }
  const invalido = (campo: string) => ({
    'aria-invalid': error?.campo === campo,
    'aria-describedby': error?.campo === campo ? `${id}-error` : undefined,
  })

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto) cerrar()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nuevo usuario</SheetTitle>
          <SheetDescription>Queda activo de una vez. Te mostraremos su contraseña temporal para que se la pases.</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-nombre`}>Nombre</Label>
            <Input
              id={`${id}-nombre`}
              value={nombre}
              placeholder="Nombre de la persona"
              {...invalido('nombre')}
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-correo`}>Correo</Label>
            <Input
              id={`${id}-correo`}
              type="email"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              value={correo}
              placeholder="persona@correo.com"
              {...invalido('correo')}
              onChange={(e) => {
                setCorreo(e.target.value)
              }}
            />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Rol</legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-center font-semibold has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                    rol === r ? 'border-primary bg-primary text-primary-foreground' : 'bg-surface',
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-rol`}
                    value={r}
                    checked={rol === r}
                    className="sr-only"
                    onChange={() => {
                      setRol(r)
                    }}
                  />
                  {NOMBRE_ROL[r]}
                </label>
              ))}
            </div>
          </fieldset>
          {rol === 'admin' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-cancha`}>Cancha sugerida</Label>
              <select
                id={`${id}-cancha`}
                className={claseSelect}
                value={cancha}
                onChange={(e) => {
                  setCancha(e.target.value)
                }}
              >
                <option value="">Ninguna (ve todas las canchas)</option>
                {canchas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <ErrorFormulario id={`${id}-error`}>{error?.mensaje ?? null}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            Crear usuario
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
