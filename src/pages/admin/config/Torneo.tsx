import { CalendarDays, Clock, Pencil, Plus, Settings2, Star, Trash2 } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { useOutletContext } from 'react-router'
import { toast } from 'sonner'
import { ErrorFormulario } from '@/components/CampoClave'
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
import { type DatosTorneo, useConteoTorneo, useMutacionesTorneo } from '@/hooks/useConfigTorneo'
import { useTorneos } from '@/hooks/useTorneos'
import { formatearRangoFechas } from '@/lib/time'
import type { ContextoConfig, Torneo as FilaTorneo } from '@/pages/admin/config/ConfigLayout'

const TIPOS = ['intercolonias', 'intersectores', 'interbarrios']

/** "1 cancha" / "3 canchas"; null si es 0 (no se lista). */
const contar = (n: number, uno: string, varios: string) =>
  n === 0 ? null : `${String(n)} ${n === 1 ? uno : varios}`

/** Columna `time` ('08:00:00') → '08:00'. */
const horaCorta = (hora: string) => hora.slice(0, 5)

/** Torneos (§4.2 super admin 1): crear/editar, marcar activo y borrar con confirmación fuerte. */
export default function Torneo() {
  const { torneo: enEdicion, elegirTorneo } = useOutletContext<ContextoConfig>()
  const torneos = useTorneos().data ?? []
  const mutaciones = useMutacionesTorneo()
  const [formulario, setFormulario] = useState<{ torneo: FilaTorneo | null; clave: number } | null>(null)
  const [aActivar, setAActivar] = useState<FilaTorneo | null>(null)
  const [aBorrar, setABorrar] = useState<FilaTorneo | null>(null)
  const [aperturas, setAperturas] = useState(0)
  const activo = torneos.find((t) => t.activo)
  const conteo = useConteoTorneo(aBorrar?.id).data

  const abrirFormulario = (torneo: FilaTorneo | null) => {
    setAperturas((n) => n + 1)
    setFormulario({ torneo, clave: aperturas + 1 })
  }

  return (
    <div className="flex flex-col gap-6">
      <title>Torneos · Intercolonias Chita</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Torneos</h1>
        <Button
          onClick={() => {
            abrirFormulario(null)
          }}
        >
          <Plus aria-hidden />
          Nuevo torneo
        </Button>
      </div>

      {torneos.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Aún no hay torneos. Crea el primero.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {torneos.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="text-2xl leading-tight break-words">{t.nombre}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{t.tipo}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.activo && (
                    <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                      Activo
                    </span>
                  )}
                  {t.id === enEdicion?.id && (
                    <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                      En edición
                    </span>
                  )}
                </div>
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                <li className="flex items-center gap-2">
                  <CalendarDays aria-hidden className="size-4 shrink-0 text-primary" />
                  {formatearRangoFechas(t.fecha_inicio, t.fecha_fin)}
                </li>
                <li className="flex items-center gap-2">
                  <Clock aria-hidden className="size-4 shrink-0 text-primary" />
                  {`Jornada ${horaCorta(t.hora_inicio_jornada)} a ${horaCorta(t.hora_fin_jornada)} · ${String(t.minutos_entre_partidos)} min entre partidos`}
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    abrirFormulario(t)
                  }}
                >
                  <Pencil aria-hidden />
                  Editar datos
                </Button>
                {t.id !== enEdicion?.id && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      elegirTorneo(t.id)
                    }}
                  >
                    <Settings2 aria-hidden />
                    Trabajar en este
                  </Button>
                )}
                {!t.activo && (
                  <Button
                    variant="outline"
                    disabled={mutaciones.ocupado}
                    onClick={() => {
                      setAActivar(t)
                    }}
                  >
                    <Star aria-hidden />
                    Marcar como activo
                  </Button>
                )}
                {t.activo ? (
                  <p className="basis-full text-sm text-muted-foreground">
                    Para borrar el torneo activo, primero activa otro.
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={mutaciones.ocupado}
                    onClick={() => {
                      setAperturas((n) => n + 1)
                      setABorrar(t)
                    }}
                  >
                    <Trash2 aria-hidden />
                    Borrar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {formulario && (
        <FormularioTorneo
          key={formulario.clave}
          torneo={formulario.torneo}
          ocupado={mutaciones.ocupado}
          cerrar={() => {
            setFormulario(null)
          }}
          guardar={(datos) => {
            const editando = formulario.torneo
            if (editando) {
              mutaciones.editar.mutate(
                { id: editando.id, datos },
                {
                  onSuccess: () => {
                    toast.success('Torneo guardado')
                    setFormulario(null)
                  },
                },
              )
            } else {
              mutaciones.crear.mutate(datos, {
                onSuccess: (id) => {
                  toast.success('Torneo creado (inactivo). Ahora puedes configurarlo.')
                  elegirTorneo(id)
                  setFormulario(null)
                },
              })
            }
          }}
        />
      )}

      <AlertDialog
        open={aActivar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setAActivar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Marcar como activo</AlertDialogTitle>
          <AlertDialogDescription>
            {`El sitio público pasará a mostrar “${aActivar?.nombre ?? ''}”.`}
            {activo && ` “${activo.nombre}” dejará de estar activo.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (aActivar) {
                  mutaciones.activar.mutate(aActivar.id, {
                    onSuccess: () => toast.success('Torneo activo actualizado'),
                  })
                }
              }}
            >
              Activar
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
          titulo="Borrar torneo"
          nombre={aBorrar.nombre}
          consecuencias={
            conteo
              ? [
                  contar(conteo.canchas, 'cancha', 'canchas'),
                  contar(conteo.categorias, 'categoría', 'categorías'),
                  contar(conteo.equipos, 'equipo con sus jugadores', 'equipos con sus jugadores'),
                  contar(conteo.partidos, 'partido con sus goles', 'partidos con sus goles'),
                ].filter((linea): linea is string => linea !== null)
              : ['Todo lo del torneo: canchas, categorías, equipos, jugadores, partidos y goles']
          }
          borrar={() => {
            mutaciones.borrar.mutate(aBorrar.id, { onSuccess: () => toast.success('Torneo borrado') })
          }}
        />
      )}
    </div>
  )
}

function FormularioTorneo({
  torneo,
  ocupado,
  cerrar,
  guardar,
}: {
  torneo: FilaTorneo | null
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: DatosTorneo) => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState(torneo?.nombre ?? '')
  const [tipo, setTipo] = useState(torneo?.tipo ?? 'intercolonias')
  const [inicio, setInicio] = useState(torneo?.fecha_inicio ?? '')
  const [fin, setFin] = useState(torneo?.fecha_fin ?? '')
  const [horaInicio, setHoraInicio] = useState(torneo ? horaCorta(torneo.hora_inicio_jornada) : '08:00')
  const [horaFin, setHoraFin] = useState(torneo ? horaCorta(torneo.hora_fin_jornada) : '18:00')
  const [minutos, setMinutos] = useState(String(torneo?.minutos_entre_partidos ?? 10))
  const [error, setError] = useState<string | null>(null)
  const [campoConError, setCampoConError] = useState<string | null>(null)
  const campo = (sufijo: string) => `${id}-${sufijo}`
  /** aria-invalid y descripción del error solo en el campo que falló. */
  const marca = (sufijo: string) =>
    campoConError === sufijo ? { 'aria-invalid': true, 'aria-describedby': campo('error') } : {}

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const min = Number(minutos)
    const [problema, campoMal]: [string | null, string | null] = !nombre.trim()
      ? ['Escribe el nombre del torneo.', 'nombre']
      : minutos.trim() === ''
        ? ['Escribe los minutos entre partidos.', 'min']
        : !inicio
        ? ['Elige el primer día.', 'inicio']
        : !fin
          ? ['Elige el último día.', 'fin']
          : fin < inicio
            ? ['El último día no puede ser antes del primero.', 'fin']
            : !horaInicio || !horaFin || horaFin <= horaInicio
              ? ['La jornada debe terminar después de empezar.', 'hf']
              : !Number.isInteger(min) || min < 0
                ? ['Los minutos entre partidos deben ser 0 o más.', 'min']
                : [null, null]
    setCampoConError(campoMal)
    if (problema) {
      setError(problema)
      if (campoMal) document.getElementById(campo(campoMal))?.focus()
      return
    }
    setError(null)
    guardar({
      nombre: nombre.trim(),
      tipo,
      fecha_inicio: inicio,
      fecha_fin: fin,
      hora_inicio_jornada: horaInicio,
      hora_fin_jornada: horaFin,
      minutos_entre_partidos: min,
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
          <SheetTitle>{torneo ? 'Editar torneo' : 'Nuevo torneo'}</SheetTitle>
          <SheetDescription>
            {torneo ? 'Los cambios se ven al instante en el sitio si es el activo.' : 'Se crea inactivo; lo activas cuando esté listo.'}
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor={campo('nombre')}>Nombre</Label>
            <Input
              id={campo('nombre')}
              value={nombre}
              placeholder="Intercolonias Chita 2027"
              {...marca('nombre')}
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={campo('tipo')}>Tipo</Label>
            <select
              id={campo('tipo')}
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value)
              }}
              className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base font-semibold capitalize text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {(TIPOS.includes(tipo) ? TIPOS : [tipo, ...TIPOS]).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={campo('inicio')}>Primer día</Label>
              <Input
                id={campo('inicio')}
                {...marca('inicio')}
                type="date"
                value={inicio}
                onChange={(e) => {
                  setInicio(e.target.value)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={campo('fin')}>Último día</Label>
              <Input
                id={campo('fin')}
                {...marca('fin')}
                type="date"
                min={inicio || undefined}
                value={fin}
                onChange={(e) => {
                  setFin(e.target.value)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={campo('hi')}>Jornada desde</Label>
              <Input
                id={campo('hi')}
                {...marca('hi')}
                type="time"
                step={300}
                value={horaInicio}
                onChange={(e) => {
                  setHoraInicio(e.target.value)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={campo('hf')}>Jornada hasta</Label>
              <Input
                id={campo('hf')}
                {...marca('hf')}
                type="time"
                step={300}
                value={horaFin}
                onChange={(e) => {
                  setHoraFin(e.target.value)
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={campo('min')}>Minutos entre partidos</Label>
            <Input
              id={campo('min')}
              {...marca('min')}
              type="number"
              inputMode="numeric"
              min={0}
              value={minutos}
              onChange={(e) => {
                setMinutos(e.target.value)
              }}
            />
          </div>
          <ErrorFormulario id={campo('error')}>{error}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {torneo ? 'Guardar cambios' : 'Crear torneo'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
