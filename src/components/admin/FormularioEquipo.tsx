import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { ErrorFormulario } from '@/components/CampoClave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { DatosEquipo } from '@/hooks/useConfigEquipos'

/** Hoja inferior para crear o editar un equipo (nombre y representante). */
export function FormularioEquipo({
  equipo,
  ocupado,
  cerrar,
  guardar,
}: {
  equipo: { nombre: string; representante: string | null } | null
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: DatosEquipo) => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState(equipo?.nombre ?? '')
  const [representante, setRepresentante] = useState(equipo?.representante ?? '')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Escribe el nombre del equipo.')
      document.getElementById(`${id}-nombre`)?.focus()
      return
    }
    setError(null)
    guardar({ nombre: nombre.trim(), representante: representante.trim() || null })
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
          <SheetTitle>{equipo ? 'Editar equipo' : 'Nuevo equipo'}</SheetTitle>
          <SheetDescription>El escudo y los jugadores se agregan en la página del equipo.</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-nombre`}>Nombre</Label>
            <Input
              id={`${id}-nombre`}
              value={nombre}
              placeholder="Chita FC"
              aria-invalid={error !== null}
              aria-describedby={`${id}-error`}
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-rep`}>Representante (opcional)</Label>
            <Input
              id={`${id}-rep`}
              value={representante}
              placeholder="Nombre de quien inscribe al equipo"
              onChange={(e) => {
                setRepresentante(e.target.value)
              }}
            />
          </div>
          <ErrorFormulario id={`${id}-error`}>{error}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {ocupado && <Loader2 aria-hidden className="animate-spin" />}
            {equipo ? 'Guardar cambios' : 'Crear equipo'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
