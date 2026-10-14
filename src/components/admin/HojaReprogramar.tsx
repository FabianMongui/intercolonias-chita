import { type SubmitEvent, useId, useState } from 'react'
import { ErrorFormulario } from '@/components/CampoClave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Accion } from '@/hooks/useAccionesPartido'
import { formatearDiaCorto, formatearHora, isoDesdeBogota, partesBogota } from '@/lib/time'

interface Cancha {
  id: number
  nombre: string
  tipo: string
  activa: boolean
}

/**
 * Corregir hora y/o cancha de un partido pendiente (§4.2). Solo arma el pedido y lo describe;
 * la validación (cancha activa, tipo, cancha fija) y el recálculo de horas los hace la base.
 */
export function HojaReprogramar({
  abierta,
  cerrar,
  horaProgramada,
  canchaId,
  canchas,
  fechaMin,
  fechaMax,
  proponer,
}: {
  abierta: boolean
  cerrar: () => void
  horaProgramada: string | null
  canchaId: number | null
  canchas: Cancha[]
  fechaMin: string | undefined
  fechaMax: string | undefined
  /** Pide confirmación con el resumen del cambio (regla 6). */
  proponer: (accion: Accion, descripcion: string) => void
}) {
  const id = useId()
  const actual = horaProgramada ? partesBogota(horaProgramada) : { fecha: fechaMin ?? '', hora: '' }
  const [fecha, setFecha] = useState(actual.fecha)
  const [hora, setHora] = useState(actual.hora)
  const [cancha, setCancha] = useState(canchaId !== null ? String(canchaId) : '')
  const [error, setError] = useState<string | null>(null)

  const nombreCancha = (valor: number | null) => canchas.find((c) => c.id === valor)?.nombre ?? 'sin cancha'
  const describir = (iso: string | null, idCancha: number | null) =>
    iso ? `${formatearDiaCorto(iso)} · ${formatearHora(iso)} · ${nombreCancha(idCancha)}` : `sin hora · ${nombreCancha(idCancha)}`

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fecha || !hora) {
      setError('Elige el día y la hora.')
      return
    }
    const nuevaHora = isoDesdeBogota(fecha, hora)
    const cambiaHora = fecha !== actual.fecha || hora !== actual.hora
    const nuevaCancha = cancha === '' ? null : Number(cancha)
    const cambiaCancha = nuevaCancha !== null && nuevaCancha !== canchaId
    if (!cambiaHora && !cambiaCancha) {
      setError('No cambiaste la hora ni la cancha.')
      return
    }
    setError(null)
    proponer(
      {
        tipo: 'reprogramar',
        ...(cambiaHora && { hora: nuevaHora }),
        ...(cambiaCancha && { canchaId: nuevaCancha }),
      },
      `De ${describir(horaProgramada, canchaId)} a ${describir(cambiaHora ? nuevaHora : horaProgramada, cambiaCancha ? nuevaCancha : canchaId)}. Se recalculan las horas estimadas de los demás partidos.`,
    )
  }

  return (
    <Sheet
      open={abierta}
      onOpenChange={(abrir) => {
        if (!abrir) cerrar()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Corregir hora o cancha</SheetTitle>
          <SheetDescription>Hora de Bogotá. Solo para partidos que no han empezado.</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-fecha`}>Día</Label>
              <Input
                id={`${id}-fecha`}
                type="date"
                min={fechaMin}
                max={fechaMax}
                value={fecha}
                aria-describedby={`${id}-error`}
                onChange={(e) => {
                  setFecha(e.target.value)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-hora`}>Hora</Label>
              <Input
                id={`${id}-hora`}
                type="time"
                step={300}
                value={hora}
                aria-describedby={`${id}-error`}
                onChange={(e) => {
                  setHora(e.target.value)
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-cancha`}>Cancha</Label>
            <select
              id={`${id}-cancha`}
              value={cancha}
              onChange={(e) => {
                setCancha(e.target.value)
              }}
              className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {canchaId === null && <option value="">Sin cancha</option>}
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.nombre} (${c.tipo})${c.activa ? '' : ' · cerrada'}`}
                </option>
              ))}
            </select>
          </div>
          <ErrorFormulario id={`${id}-error`}>{error}</ErrorFormulario>
          <Button type="submit" size="lg">
            Revisar cambio
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
