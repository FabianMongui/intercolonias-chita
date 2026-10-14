import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { useOutletContext } from 'react-router'
import { toast } from 'sonner'
import { ErrorFormulario } from '@/components/CampoClave'
import { ErrorDatos } from '@/components/EstadosPagina'
import { ConfirmarBorrado } from '@/components/admin/ConfirmarBorrado'
import { SelectorTipoCancha, type TipoCancha } from '@/components/admin/SelectorTipoCancha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { type CanchaConfig, useCanchasConfig } from '@/hooks/useConfigCanchas'
import {
  type CategoriaConfig,
  type DatosCategoria,
  useCategoriasConfig,
  useMutacionesCategorias,
} from '@/hooks/useConfigCategorias'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

/** "1 equipo" / "3 equipos"; null si es 0 (no se lista). */
const contar = (n: number, uno: string, varios: string) => (n === 0 ? null : `${String(n)} ${n === 1 ? uno : varios}`)

/** Categorías del torneo en edición (§4.2 super admin 3): tiempos, tipo de cancha, cancha fija, orden. */
export default function Categorias() {
  const { torneo } = useOutletContext<ContextoConfig>()
  const categoriasQ = useCategoriasConfig(torneo?.id)
  const canchas = useCanchasConfig(torneo?.id).data ?? []
  const mutaciones = useMutacionesCategorias(torneo?.id)
  const [formulario, setFormulario] = useState<{ categoria: CategoriaConfig | null; clave: number } | null>(null)
  const [aBorrar, setABorrar] = useState<CategoriaConfig | null>(null)
  const [aperturas, setAperturas] = useState(0)
  const categorias = categoriasQ.data ?? []

  if (!torneo) {
    return <p className="text-muted-foreground">Primero crea un torneo en la sección Torneo.</p>
  }

  const abrirFormulario = (categoria: CategoriaConfig | null) => {
    setAperturas((n) => n + 1)
    setFormulario({ categoria, clave: aperturas + 1 })
  }

  const mover = (indice: number, delta: -1 | 1) => {
    const ids = categorias.map((c) => c.id)
    const a = ids[indice]
    const b = ids[indice + delta]
    if (a === undefined || b === undefined) return
    ids[indice] = b
    ids[indice + delta] = a
    mutaciones.reordenar.mutate(ids)
  }

  const nombreCancha = (id: number | null) => canchas.find((c) => c.id === id)?.nombre

  return (
    <div className="flex flex-col gap-6">
      <title>Categorías · Intercolonias Chita</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Categorías</h1>
        <Button
          onClick={() => {
            abrirFormulario(null)
          }}
        >
          <Plus aria-hidden />
          Nueva categoría
        </Button>
      </div>

      {categoriasQ.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando categorías">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : categoriasQ.isError ? (
        <ErrorDatos
          nivel="h2"
          reintentar={() => void categoriasQ.refetch()}
          reintentando={categoriasQ.isRefetching}
        />
      ) : categorias.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Este torneo aún no tiene categorías. Agrega la primera (por ejemplo Única, Veteranos, Femenino).
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {categorias.map((c, i) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="truncate text-2xl leading-tight">{c.nombre}</h2>
                <p className="text-sm">
                  {`${c.tipo_cancha} · 2 × ${String(c.minutos_por_tiempo)} min · descanso ${String(c.minutos_descanso)} min`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[
                    c.cancha_fija_id !== null ? `Siempre en ${nombreCancha(c.cancha_fija_id) ?? 'su cancha fija'}` : null,
                    contar(c.equipos, 'equipo', 'equipos') ?? 'sin equipos',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
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
                  disabled={i === categorias.length - 1 || mutaciones.ocupado}
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
        <FormularioCategoria
          key={formulario.clave}
          categoria={formulario.categoria}
          canchas={canchas}
          ocupado={mutaciones.ocupado}
          cerrar={() => {
            setFormulario(null)
          }}
          guardar={(datos) => {
            const editando = formulario.categoria
            const alTerminar = {
              onSuccess: () => {
                toast.success(editando ? 'Categoría guardada' : 'Categoría creada', { duration: 3000 })
                setFormulario(null)
              },
            }
            if (editando) mutaciones.editar.mutate({ id: editando.id, datos }, alTerminar)
            else mutaciones.crear.mutate({ datos, orden: categorias.length }, alTerminar)
          }}
        />
      )}

      {aBorrar && (
        <ConfirmarBorrado
          key={`borrar-${String(aperturas)}`}
          abierto
          cambiar={(abierto) => {
            if (!abierto) setABorrar(null)
          }}
          titulo="Borrar categoría"
          nombre={aBorrar.nombre}
          consecuencias={[
            contar(aBorrar.equipos, 'equipo con sus jugadores', 'equipos con sus jugadores'),
            contar(aBorrar.grupos, 'grupo', 'grupos'),
            contar(aBorrar.partidos, 'partido con sus goles', 'partidos con sus goles'),
          ].filter((linea): linea is string => linea !== null)}
          borrar={() => {
            const categoria = aBorrar
            mutaciones.borrar.mutate(categoria.id, {
              onSuccess: () => toast.success(`${categoria.nombre} borrada`, { duration: 3000 }),
            })
          }}
        />
      )}
    </div>
  )
}

function FormularioCategoria({
  categoria,
  canchas,
  ocupado,
  cerrar,
  guardar,
}: {
  categoria: CategoriaConfig | null
  canchas: CanchaConfig[]
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: DatosCategoria) => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [tipo, setTipo] = useState<TipoCancha>(categoria?.tipo_cancha === 'F6' ? 'F6' : 'F11')
  // Si la cancha fija guardada ya no es del tipo de la categoría (p. ej. la cambiaron en Canchas), se empieza sin ella.
  const [canchaFija, setCanchaFija] = useState(() => {
    const fija = canchas.find((c) => c.id === categoria?.cancha_fija_id)
    return fija && fija.tipo === categoria?.tipo_cancha ? String(fija.id) : ''
  })
  const [tiempo, setTiempo] = useState(String(categoria?.minutos_por_tiempo ?? 45))
  const [descanso, setDescanso] = useState(String(categoria?.minutos_descanso ?? 10))
  const [error, setError] = useState<{ mensaje: string; campo: string } | null>(null)
  const campo = (sufijo: string) => `${id}-${sufijo}`
  const marca = (sufijo: string) =>
    error?.campo === sufijo ? { 'aria-invalid': true, 'aria-describedby': campo('error') } : {}
  const delTipo = canchas.filter((c) => c.tipo === tipo)

  const cambiarTipo = (nuevo: TipoCancha) => {
    setTipo(nuevo)
    // La cancha fija tiene que ser del mismo tipo: si deja de serlo, se quita.
    if (!canchas.some((c) => String(c.id) === canchaFija && c.tipo === nuevo)) setCanchaFija('')
  }

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const min = Number(tiempo)
    const des = Number(descanso)
    const problema: { mensaje: string; campo: string } | null = !nombre.trim()
      ? { mensaje: 'Escribe el nombre de la categoría.', campo: 'nombre' }
      : tiempo.trim() === '' || !Number.isInteger(min) || min <= 0
        ? { mensaje: 'Los minutos por tiempo deben ser un número mayor que 0.', campo: 'tiempo' }
        : descanso.trim() === '' || !Number.isInteger(des) || des < 0
          ? { mensaje: 'Los minutos de descanso deben ser 0 o más.', campo: 'descanso' }
          : null
    setError(problema)
    if (problema) {
      document.getElementById(campo(problema.campo))?.focus()
      return
    }
    guardar({
      nombre: nombre.trim(),
      tipo_cancha: tipo,
      cancha_fija_id: canchaFija === '' ? null : Number(canchaFija),
      minutos_por_tiempo: min,
      minutos_descanso: des,
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
          <SheetTitle>{categoria ? 'Editar categoría' : 'Nueva categoría'}</SheetTitle>
          <SheetDescription>Los tiempos se usan para el reloj y para programar los horarios.</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor={campo('nombre')}>Nombre</Label>
            <Input
              id={campo('nombre')}
              value={nombre}
              placeholder="Veteranos"
              {...marca('nombre')}
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
          <SelectorTipoCancha valor={tipo} cambiar={cambiarTipo} etiqueta="Tipo de cancha" />
          <div className="flex flex-col gap-2">
            <Label htmlFor={campo('fija')}>Cancha fija (opcional)</Label>
            <select
              id={campo('fija')}
              value={canchaFija}
              onChange={(e) => {
                setCanchaFija(e.target.value)
              }}
              className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="">{`Cualquier cancha ${tipo}`}</option>
              {delTipo.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.nombre}${c.activa ? '' : ' · cerrada'}`}
                </option>
              ))}
            </select>
            {delTipo.length === 0 && (
              <p className="text-sm text-muted-foreground">{`Este torneo no tiene canchas ${tipo} todavía.`}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={campo('tiempo')}>Minutos por tiempo</Label>
              <Input
                id={campo('tiempo')}
                type="number"
                inputMode="numeric"
                min={1}
                value={tiempo}
                {...marca('tiempo')}
                onChange={(e) => {
                  setTiempo(e.target.value)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={campo('descanso')}>Minutos de descanso</Label>
              <Input
                id={campo('descanso')}
                type="number"
                inputMode="numeric"
                min={0}
                value={descanso}
                {...marca('descanso')}
                onChange={(e) => {
                  setDescanso(e.target.value)
                }}
              />
            </div>
          </div>
          <ErrorFormulario id={campo('error')}>{error?.mensaje ?? null}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {categoria ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
