import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { ErrorFormulario } from '@/components/CampoClave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CARPETA_CLUBES, sugerirClub, useClubes } from '@/hooks/useConfigClubes'
import type { DatosEquipo } from '@/hooks/useConfigEquipos'

/** Hoja inferior para crear o editar un equipo (nombre, club y representante). */
export function FormularioEquipo({
  equipo,
  ocupado,
  cerrar,
  guardar,
}: {
  equipo: { nombre: string; representante: string | null; club_id: number | null; escudo_path: string | null } | null
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: DatosEquipo) => void
}) {
  const id = useId()
  const clubesQ = useClubes()
  const clubes = clubesQ.data ?? []
  const [nombre, setNombre] = useState(equipo?.nombre ?? '')
  const [representante, setRepresentante] = useState(equipo?.representante ?? '')
  // Al crear, mientras no se elija a mano, el club se sugiere por el nombre ("Chita 2 FC" → Colonia Chitana).
  // Al editar se respeta lo guardado (también "Sin club").
  const [clubElegido, setClubElegido] = useState<string | null>(equipo ? String(equipo.club_id ?? '') : null)
  const sugerido = sugerirClub(nombre, clubes)
  const club = clubElegido ?? (sugerido ? String(sugerido.id) : '')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Escribe el nombre del equipo.')
      document.getElementById(`${id}-nombre`)?.focus()
      return
    }
    setError(null)
    const clubId = club === '' ? null : Number(club)
    const datos: DatosEquipo = { nombre: nombre.trim(), representante: representante.trim() || null, club_id: clubId }
    // Un equipo sin escudo propio muestra el de su club; si tenía uno propio, se respeta.
    const usaEscudoDeClub = !equipo?.escudo_path || equipo.escudo_path.startsWith(CARPETA_CLUBES)
    if (usaEscudoDeClub) {
      const escudoClub = clubes.find((c) => c.id === clubId)?.escudo_path ?? null
      if (escudoClub !== (equipo?.escudo_path ?? null)) datos.escudo_path = escudoClub
    }
    guardar(datos)
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
            <Label htmlFor={`${id}-club`}>Club</Label>
            <select
              id={`${id}-club`}
              value={club}
              aria-describedby={`${id}-club-ayuda`}
              onChange={(e) => {
                setClubElegido(e.target.value)
              }}
              className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="">Sin club</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <p id={`${id}-club-ayuda`} className="text-sm text-muted-foreground">
              {clubElegido === null && sugerido
                ? 'Sugerido por el nombre. El equipo usa su escudo y suma sus títulos al historial.'
                : 'La colonia a la que pertenece: usa su escudo y suma sus títulos al historial.'}
            </p>
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
          <Button type="submit" size="lg" disabled={ocupado || clubesQ.isPending}>
            {ocupado && <Loader2 aria-hidden className="animate-spin" />}
            {equipo ? 'Guardar cambios' : 'Crear equipo'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
