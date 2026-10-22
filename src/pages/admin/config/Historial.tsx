import { Eye, EyeOff, Loader2, Pencil, Plus, Star, Trash2, Trophy } from 'lucide-react'
import { type SubmitEvent, useId, useState } from 'react'
import { toast } from 'sonner'
import { ErrorFormulario } from '@/components/CampoClave'
import { ErrorDatos } from '@/components/EstadosPagina'
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
import { Switch } from '@/components/ui/switch'
import { useClubes } from '@/hooks/useConfigClubes'
import {
  type DatosCampeon,
  type RegistroCampeon,
  useAjustes,
  useHistorialConfig,
  useMutacionesHistorial,
} from '@/hooks/useConfigHistorial'

const TIPOS = ['intercolonias', 'intersectores', 'interbarrios']
const CATEGORIAS = ['Única', 'Veteranos', 'Femenino']
const claseSelect =
  'min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive'
const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

/**
 * Historial de campeones (panel): visibilidad para el público, ranking, títulos que salen de las finales
 * de la app (torneos que cuentan para el historial) y los campeones de años anteriores cargados a mano.
 */
export default function Historial() {
  const ajustesQ = useAjustes()
  const historialQ = useHistorialConfig()
  const mut = useMutacionesHistorial()
  const [formulario, setFormulario] = useState<{ registro: RegistroCampeon | null; clave: number } | null>(null)
  const [aBorrar, setABorrar] = useState<RegistroCampeon | null>(null)
  const [mostrar, setMostrar] = useState(false)
  const publico = ajustesQ.data?.historial_publico ?? false

  const contenido = () => {
    if (historialQ.isPending) {
      return (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando historial">
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
        </div>
      )
    }
    if (historialQ.isError) {
      return <ErrorDatos nivel="h2" reintentar={() => void historialQ.refetch()} reintentando={historialQ.isRefetching} />
    }
    const { ranking, desdeApp, registros } = historialQ.data
    return (
      <>
        <section aria-labelledby="titulo-ranking" className="flex flex-col gap-2">
          <h2 id="titulo-ranking" className="text-2xl">
            Títulos por club
          </h2>
          {ranking.length === 0 ? (
            <p className="text-muted-foreground">Todavía no hay títulos.</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border bg-card">
              {ranking.map((r) => (
                <li key={r.club_id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                  <Escudo nombre={r.nombre ?? ''} path={r.escudo_path} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{r.nombre}</span>
                  <span className="flex items-center gap-0.5 text-gold-foreground" aria-hidden>
                    {Array.from({ length: Math.min(r.titulos ?? 0, 5) }, (_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </span>
                  <span className="w-6 text-right font-display text-2xl tabular-nums">{r.titulos}</span>
                  <span className="sr-only">{plural(r.titulos ?? 0, 'título', 'títulos')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-registros" className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="titulo-registros" className="text-2xl">
              Años anteriores (cargados a mano)
            </h2>
            <Button
              onClick={() => {
                setFormulario({ registro: null, clave: Date.now() })
              }}
            >
              <Plus aria-hidden />
              Agregar campeón
            </Button>
          </div>
          {registros.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
              Agrega los campeones de torneos anteriores a la app, desde las hojas o registros que tengan.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {registros.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <span className="w-14 shrink-0 font-display text-2xl tabular-nums">{r.anio}</span>
                  <Escudo nombre={r.campeon.nombre} path={r.campeon.escudo_path} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{r.campeon.nombre}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {[r.categoria, r.tipo_torneo !== 'intercolonias' ? r.tipo_torneo : null, r.marcador_final, r.nota]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${String(r.anio)} ${r.categoria}`}
                    onClick={() => {
                      setFormulario({ registro: r, clave: Date.now() })
                    }}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    aria-label={`Borrar ${String(r.anio)} ${r.categoria}`}
                    onClick={() => {
                      setABorrar(r)
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-app" className="flex flex-col gap-2">
          <h2 id="titulo-app" className="text-2xl">
            Torneos jugados en la app
          </h2>
          {desdeApp.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aparecen solos cuando se juega la final de un torneo que cuenta para el historial (se marca en Torneo).
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {desdeApp.map((p) => (
                <li
                  key={`${String(p.torneo_id)}-${p.categoria ?? ''}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <span className="w-14 shrink-0 font-display text-2xl tabular-nums">{p.anio}</span>
                  <Trophy aria-hidden className="size-5 shrink-0 text-gold-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{p.campeon_nombre}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {[p.categoria, p.marcador_final, p.subcampeon_nombre ? `vs ${p.subcampeon_nombre}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <title>Historial · Intercolonias Chita</title>
      <h1 className="text-4xl">Historial</h1>

      <div className="flex items-start justify-between gap-3 rounded-lg border bg-surface-warm p-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-semibold">
            {publico ? <Eye aria-hidden className="size-5" /> : <EyeOff aria-hidden className="size-5" />}
            {publico ? 'El público ve el Historial' : 'Oculto para el público'}
          </span>
          <p className="text-sm text-muted-foreground">
            {publico
              ? 'Aparece la pestaña Historial en el sitio con el ranking y los campeones.'
              : 'Solo tú lo ves aquí. Actívalo cuando los datos estén completos.'}
          </p>
        </div>
        <Switch
          checked={publico}
          disabled={ajustesQ.isPending || ajustesQ.isError || mut.visibilidad.isPending}
          aria-label="Mostrar el Historial al público"
          onCheckedChange={(activar) => {
            if (activar) setMostrar(true)
            else mut.visibilidad.mutate(false, { onSuccess: () => toast.success('Historial oculto', { duration: 3000 }) })
          }}
        />
      </div>

      {ajustesQ.isError && (
        <ErrorDatos nivel="h2" reintentar={() => void ajustesQ.refetch()} reintentando={ajustesQ.isRefetching} />
      )}

      {contenido()}

      {formulario && (
        <FormularioCampeon
          key={formulario.clave}
          registro={formulario.registro}
          ocupado={mut.guardar.isPending}
          cerrar={() => {
            setFormulario(null)
          }}
          guardar={(datos) => {
            mut.guardar.mutate(
              { id: formulario.registro?.id ?? null, datos },
              {
                onSuccess: () => {
                  toast.success('Campeón guardado', { duration: 3000 })
                  setFormulario(null)
                },
              },
            )
          }}
        />
      )}

      <AlertDialog open={mostrar} onOpenChange={setMostrar}>
        <AlertDialogContent>
          <AlertDialogTitle>¿Mostrar el Historial al público?</AlertDialogTitle>
          <AlertDialogDescription>
            Cualquiera que entre al sitio verá la pestaña Historial con el ranking de títulos y los campeones. Revisa
            que los datos sean los reales.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                mut.visibilidad.mutate(true, { onSuccess: () => toast.success('Historial visible', { duration: 3000 }) })
              }}
            >
              Mostrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={aBorrar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setABorrar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{`¿Borrar el campeón de ${String(aBorrar?.anio ?? '')}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {aBorrar ? `${aBorrar.campeon.nombre} (${aBorrar.categoria}) pierde ese título en el historial.` : ''}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive-hover"
              onClick={() => {
                if (aBorrar) mut.borrar.mutate(aBorrar.id, { onSuccess: () => toast.success('Registro borrado', { duration: 3000 }) })
              }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FormularioCampeon({
  registro,
  ocupado,
  cerrar,
  guardar,
}: {
  registro: RegistroCampeon | null
  ocupado: boolean
  cerrar: () => void
  guardar: (datos: DatosCampeon) => void
}) {
  const id = useId()
  const clubesQ = useClubes()
  const clubes = clubesQ.data ?? []
  const [anio, setAnio] = useState(String(registro?.anio ?? ''))
  const [tipo, setTipo] = useState(registro?.tipo_torneo ?? 'intercolonias')
  const [categoria, setCategoria] = useState(registro?.categoria ?? 'Única')
  const [campeon, setCampeon] = useState(String(registro?.campeon_club_id ?? ''))
  const [subcampeon, setSubcampeon] = useState(String(registro?.subcampeon_club_id ?? ''))
  const [marcador, setMarcador] = useState(registro?.marcador_final ?? '')
  const [nota, setNota] = useState(registro?.nota ?? '')
  const [error, setError] = useState<{ campo: string; mensaje: string } | null>(null)

  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const numeroAnio = Number(anio)
    const problema = !Number.isInteger(numeroAnio) || numeroAnio < 1990 || numeroAnio > 2100
      ? { campo: 'anio', mensaje: 'Escribe un año entre 1990 y 2100.' }
      : !categoria.trim()
        ? { campo: 'categoria', mensaje: 'Escribe la categoría.' }
        : campeon === ''
          ? { campo: 'campeon', mensaje: 'Elige el club campeón.' }
          : subcampeon !== '' && subcampeon === campeon
            ? { campo: 'subcampeon', mensaje: 'El subcampeón no puede ser el mismo campeón.' }
            : null
    setError(problema)
    if (problema) {
      document.getElementById(`${id}-${problema.campo}`)?.focus()
      return
    }
    guardar({
      anio: numeroAnio,
      tipo_torneo: tipo,
      categoria: categoria.trim(),
      campeon_club_id: Number(campeon),
      subcampeon_club_id: subcampeon === '' ? null : Number(subcampeon),
      marcador_final: marcador.trim() || null,
      nota: nota.trim() || null,
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
      <SheetContent className="max-h-[90dvh]">
        <SheetHeader>
          <SheetTitle>{registro ? 'Editar campeón' : 'Agregar campeón'}</SheetTitle>
          <SheetDescription>De un torneo anterior a la app. Los clubes se crean en la sección Clubes.</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 overflow-y-auto px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-anio`}>Año</Label>
              <Input
                id={`${id}-anio`}
                inputMode="numeric"
                value={anio}
                placeholder="2019"
                {...invalido('anio')}
                onChange={(e) => {
                  setAnio(e.target.value.replace(/\D/g, '').slice(0, 4))
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-tipo`}>Torneo</Label>
              <select
                id={`${id}-tipo`}
                className={claseSelect}
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value)
                }}
              >
                {[...new Set([...TIPOS, tipo])].map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-categoria`}>Categoría</Label>
            <Input
              id={`${id}-categoria`}
              list={`${id}-categorias`}
              value={categoria}
              {...invalido('categoria')}
              onChange={(e) => {
                setCategoria(e.target.value)
              }}
            />
            <datalist id={`${id}-categorias`}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="text-sm text-muted-foreground">Escríbela igual que en los torneos de la app (por ejemplo, Única).</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-campeon`}>Campeón</Label>
            <select
              id={`${id}-campeon`}
              className={claseSelect}
              value={campeon}
              {...invalido('campeon')}
              onChange={(e) => {
                setCampeon(e.target.value)
              }}
            >
              <option value="">{clubesQ.isPending ? 'Cargando clubes…' : 'Elige el club'}</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-subcampeon`}>Subcampeón (opcional)</Label>
            <select
              id={`${id}-subcampeon`}
              className={claseSelect}
              value={subcampeon}
              {...invalido('subcampeon')}
              onChange={(e) => {
                setSubcampeon(e.target.value)
              }}
            >
              <option value="">No se sabe</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-marcador`}>Final (opcional)</Label>
              <Input
                id={`${id}-marcador`}
                value={marcador}
                placeholder="2-1"
                onChange={(e) => {
                  setMarcador(e.target.value)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-nota`}>Nota (opcional)</Label>
              <Input
                id={`${id}-nota`}
                value={nota}
                placeholder="Por penales"
                onChange={(e) => {
                  setNota(e.target.value)
                }}
              />
            </div>
          </div>
          <ErrorFormulario id={`${id}-error`}>{error?.mensaje ?? null}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {ocupado && <Loader2 aria-hidden className="animate-spin" />}
            {registro ? 'Guardar cambios' : 'Agregar campeón'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
