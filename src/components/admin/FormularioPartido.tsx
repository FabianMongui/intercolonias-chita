import { type SubmitEvent, useId, useState } from 'react'
import { ErrorFormulario } from '@/components/CampoClave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CambiosPartido, CanchaAgenda, CategoriaAgenda, NuevoPartido, PartidoAgenda } from '@/hooks/useAgenda'
import { nombreFase } from '@/lib/fases'
import { isoDesdeBogota, partesBogota } from '@/lib/time'

const FASES = ['grupos', 'semifinal', 'tercer_puesto', 'final']
const claseSelect =
  'min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive'

/**
 * Hoja para editar un partido pendiente (hora, cancha y equipos) o agregar uno a mano.
 * Solo arma los datos: la base valida grupo, equipos, cancha activa, tipo y cancha fija (editar_partido / crear_partido) y las
 * advertencias de la agenda avisan de cruces o fechas fuera del torneo.
 */
export function FormularioPartido({
  partido,
  categorias,
  canchas,
  fechaInicio,
  ocupado,
  cerrar,
  guardarCambios,
  crear,
  borrar,
}: {
  /** null = partido nuevo. */
  partido: PartidoAgenda | null
  categorias: CategoriaAgenda[]
  canchas: CanchaAgenda[]
  fechaInicio: string
  ocupado: boolean
  cerrar: () => void
  guardarCambios: (cambios: CambiosPartido) => void
  crear: (nuevo: NuevoPartido) => void
  borrar: () => void
}) {
  const id = useId()
  const actual = partido?.hora_programada ? partesBogota(partido.hora_programada) : { fecha: '', hora: '' }
  const [categoriaId, setCategoriaId] = useState(String(partido?.categoria_id ?? categorias[0]?.id ?? ''))
  const [fase, setFase] = useState(partido?.fase ?? 'grupos')
  const [grupoId, setGrupoId] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [local, setLocal] = useState(partido?.equipo_local_id != null ? String(partido.equipo_local_id) : '')
  const [visitante, setVisitante] = useState(
    partido?.equipo_visitante_id != null ? String(partido.equipo_visitante_id) : '',
  )
  const [fecha, setFecha] = useState(actual.fecha || (partido ? '' : fechaInicio))
  const [hora, setHora] = useState(actual.hora)
  const [cancha, setCancha] = useState(partido?.cancha_id != null ? String(partido.cancha_id) : '')
  const [error, setError] = useState<{ campo: string; mensaje: string } | null>(null)

  const categoria = categorias.find((c) => c.id === Number(categoriaId))
  const grupoDelPartido = partido ? (partido.grupo_id ?? undefined) : Number(grupoId) || undefined
  // En fase de grupos solo se ofrecen los equipos del grupo; en eliminatorias, todos los de la categoría.
  const equipos = (categoria?.equipos ?? []).filter(
    (e) => fase !== 'grupos' || grupoDelPartido === undefined || e.grupo_id === grupoDelPartido,
  )
  // La cancha actual se muestra aunque ya no sea válida, para no confundirla con "Sin cancha".
  const valida = (c: CanchaAgenda) =>
    c.tipo === categoria?.tipo_cancha && (categoria.cancha_fija_id === null || categoria.cancha_fija_id === c.id)
  const canchasValidas = canchas.filter((c) => valida(c) || c.id === partido?.cancha_id)

  const fallar = (campo: string, mensaje: string) => {
    setError({ campo, mensaje })
    document.getElementById(`${id}-${campo}`)?.focus()
  }

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!categoria) return
    if (local !== '' && local === visitante) {
      fallar('visitante', 'Un equipo no puede jugar contra sí mismo.')
      return
    }
    if (fase === 'grupos' && (local === '' || visitante === '')) {
      fallar(local === '' ? 'local' : 'visitante', 'En fase de grupos elige los dos equipos.')
      return
    }
    if (partido?.hora_programada && (fecha === '' || hora === '')) {
      fallar(fecha === '' ? 'fecha' : 'hora', 'Este partido ya tiene horario: cámbialo, no se puede dejar vacío.')
      return
    }
    if ((fecha === '') !== (hora === '')) {
      fallar(fecha === '' ? 'fecha' : 'hora', 'Pon el día y la hora, o deja los dos vacíos.')
      return
    }
    if (!partido && fase === 'grupos' && !grupoId) {
      fallar('grupo', 'Elige el grupo.')
      return
    }
    setError(null)
    const iso = fecha && hora ? isoDesdeBogota(fecha, hora) : null
    const idLocal = local === '' ? null : Number(local)
    const idVisitante = visitante === '' ? null : Number(visitante)
    const idCancha = cancha === '' ? null : Number(cancha)

    if (!partido) {
      crear({
        categoria_id: categoria.id,
        fase,
        grupo_id: fase === 'grupos' ? Number(grupoId) : null,
        etiqueta: fase === 'grupos' ? null : etiqueta.trim() || null,
        equipo_local_id: idLocal,
        equipo_visitante_id: idVisitante,
        cancha_id: idCancha,
        hora_programada: iso,
      })
      return
    }
    const cambios: CambiosPartido = {}
    if (iso && (fecha !== actual.fecha || hora !== actual.hora)) cambios.hora = iso
    if (idCancha !== null && idCancha !== partido.cancha_id) cambios.canchaId = idCancha
    if (idLocal !== partido.equipo_local_id || idVisitante !== partido.equipo_visitante_id) {
      cambios.equipos = { local: idLocal, visitante: idVisitante }
    }
    if (Object.keys(cambios).length === 0) {
      cerrar()
      return
    }
    guardarCambios(cambios)
  }

  const invalido = (campo: string) => ({
    'aria-invalid': error?.campo === campo,
    'aria-describedby': error?.campo === campo ? `${id}-error` : undefined,
  })
  const opcionesEquipo = (
    <>
      <option value="">{fase === 'grupos' ? 'Elige un equipo' : 'Por definir'}</option>
      {equipos.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nombre}
        </option>
      ))}
    </>
  )

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto) cerrar()
      }}
    >
      <SheetContent className="max-h-[90dvh]">
        <SheetHeader>
          <SheetTitle>{partido ? 'Editar partido' : 'Agregar partido'}</SheetTitle>
          <SheetDescription>
            {partido
              ? `${categoria?.nombre ?? ''} · ${partido.grupo ? `Grupo ${partido.grupo.nombre}` : (partido.etiqueta ?? nombreFase(partido.fase))}`
              : 'Para un fixture armado a mano o una eliminatoria que no se creó sola.'}
          </SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          {!partido && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-categoria`}>Categoría</Label>
                <select
                  id={`${id}-categoria`}
                  className={claseSelect}
                  value={categoriaId}
                  onChange={(e) => {
                    setCategoriaId(e.target.value)
                    setGrupoId('')
                    setLocal('')
                    setVisitante('')
                    setCancha('')
                  }}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-fase`}>Fase</Label>
                <select
                  id={`${id}-fase`}
                  className={claseSelect}
                  value={fase}
                  onChange={(e) => {
                    setFase(e.target.value)
                    setLocal('')
                    setVisitante('')
                  }}
                >
                  {FASES.map((f) => (
                    <option key={f} value={f}>
                      {nombreFase(f)}
                    </option>
                  ))}
                </select>
              </div>
              {fase === 'grupos' ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${id}-grupo`}>Grupo</Label>
                  <select
                    id={`${id}-grupo`}
                    className={claseSelect}
                    value={grupoId}
                    {...invalido('grupo')}
                    onChange={(e) => {
                      setGrupoId(e.target.value)
                      setLocal('')
                      setVisitante('')
                    }}
                  >
                    <option value="">
                      {categoria?.grupos.length ? 'Elige el grupo' : 'Esta categoría no tiene grupos'}
                    </option>
                    {categoria?.grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {`Grupo ${g.nombre}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${id}-etiqueta`}>Nombre (opcional)</Label>
                  <Input
                    id={`${id}-etiqueta`}
                    value={etiqueta}
                    placeholder={fase === 'semifinal' ? 'Semifinal 1' : nombreFase(fase)}
                    onChange={(e) => {
                      setEtiqueta(e.target.value)
                    }}
                  />
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-local`}>Local</Label>
              <select
                id={`${id}-local`}
                className={claseSelect}
                value={local}
                {...invalido('local')}
                onChange={(e) => {
                  setLocal(e.target.value)
                }}
              >
                {opcionesEquipo}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-visitante`}>Visitante</Label>
              <select
                id={`${id}-visitante`}
                className={claseSelect}
                value={visitante}
                {...invalido('visitante')}
                onChange={(e) => {
                  setVisitante(e.target.value)
                }}
              >
                {opcionesEquipo}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-fecha`}>Día</Label>
              <Input
                id={`${id}-fecha`}
                type="date"
                value={fecha}
                {...invalido('fecha')}
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
                value={hora}
                {...invalido('hora')}
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
              className={claseSelect}
              value={cancha}
              onChange={(e) => {
                setCancha(e.target.value)
              }}
            >
              <option value="" disabled={partido?.cancha_id != null}>
                Sin cancha
              </option>
              {canchasValidas.map((c) => (
                <option key={c.id} value={c.id} disabled={!c.activa || !valida(c)}>
                  {!c.activa ? `${c.nombre} (cerrada)` : valida(c) ? c.nombre : `${c.nombre} (no válida)`}
                </option>
              ))}
            </select>
          </div>

          <ErrorFormulario id={`${id}-error`}>{error?.mensaje ?? null}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {partido ? 'Guardar cambios' : 'Agregar partido'}
          </Button>
          {partido && (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 border-t pt-2 text-destructive"
              disabled={ocupado}
              onClick={borrar}
            >
              Borrar este partido
            </Button>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
