import { Pencil } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { useOutletContext } from 'react-router'
import { toast } from 'sonner'
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
import { type DatosUsuario, type UsuarioConfig, useMutacionesUsuarios, useUsuarios } from '@/hooks/useConfigUsuarios'
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
  const { editar } = useMutacionesUsuarios()
  const [editando, setEditando] = useState<{ usuario: UsuarioConfig; clave: number } | null>(null)
  /** Lo que le cierra el acceso a alguien (desactivar, quitar super admin) pide confirmación (regla 6). */
  const [confirmar, setConfirmar] = useState<{ titulo: string; texto: string; accion: () => void } | null>(null)
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
        <h1 className="text-4xl">Usuarios</h1>
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
              Sí, continuar
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
