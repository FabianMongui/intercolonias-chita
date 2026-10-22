import { ImageUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { type SubmitEvent, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ErrorFormulario } from '@/components/CampoClave'
import { ErrorDatos } from '@/components/EstadosPagina'
import { ConfirmarBorrado } from '@/components/admin/ConfirmarBorrado'
import { Escudo } from '@/components/partido/Escudo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { type ClubConfig, useClubes, useMutacionesClubes } from '@/hooks/useConfigClubes'

const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

/**
 * Clubes (colonias): existen de un torneo a otro. Cada equipo se enlaza a su club, usa su escudo y
 * suma sus títulos al historial. No dependen del torneo en edición.
 */
export default function Clubes() {
  const clubesQ = useClubes()
  const mut = useMutacionesClubes()
  const [formulario, setFormulario] = useState<{ club: ClubConfig | null; clave: number } | null>(null)
  const [aBorrar, setABorrar] = useState<{ club: ClubConfig; clave: number } | null>(null)
  const [escudoDe, setEscudoDe] = useState<ClubConfig | null>(null)
  const archivo = useRef<HTMLInputElement>(null)

  const contenido = () => {
    if (clubesQ.isPending) {
      return (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando clubes">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )
    }
    if (clubesQ.isError) {
      return <ErrorDatos nivel="h2" reintentar={() => void clubesQ.refetch()} reintentando={clubesQ.isRefetching} />
    }
    if (clubesQ.data.length === 0) {
      return (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Aún no hay clubes. Crea uno por cada colonia (por ejemplo, Colonia Chitana).
        </p>
      )
    }
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {clubesQ.data.map((c) => {
          const subiendo = mut.subirEscudo.isPending && mut.subirEscudo.variables.club.id === c.id
          return (
            <li key={c.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <Escudo nombre={c.nombre} path={c.escudo_path} tamano="lg" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="text-2xl break-words">{c.nombre}</h2>
                  <p className="text-sm text-muted-foreground">
                    {c.equipos > 0 ? plural(c.equipos, 'equipo enlazado', 'equipos enlazados') : 'Sin equipos enlazados'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={mut.subirEscudo.isPending}
                  onClick={() => {
                    setEscudoDe(c)
                    archivo.current?.click()
                  }}
                >
                  {subiendo ? <Loader2 aria-hidden className="animate-spin" /> : <ImageUp aria-hidden />}
                  {c.escudo_path ? 'Cambiar escudo' : 'Subir escudo'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Cambiar el nombre de ${c.nombre}`}
                  onClick={() => {
                    setFormulario({ club: c, clave: Date.now() })
                  }}
                >
                  <Pencil aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  aria-label={`Borrar ${c.nombre}`}
                  onClick={() => {
                    setABorrar({ club: c, clave: Date.now() })
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <title>Clubes · Intercolonias Chita</title>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl">Clubes</h1>
          <Button
            onClick={() => {
              setFormulario({ club: null, clave: Date.now() })
            }}
          >
            <Plus aria-hidden />
            Nuevo club
          </Button>
        </div>
        <p className="text-muted-foreground">
          Las colonias, iguales en todos los torneos. Cada equipo se enlaza a su club desde su ficha.
        </p>
      </div>
      {contenido()}

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
          if (!elegido || !escudoDe) return
          mut.subirEscudo.mutate(
            { club: escudoDe, archivo: elegido },
            { onSuccess: () => toast.success(`Escudo de ${escudoDe.nombre} actualizado`, { duration: 3000 }) },
          )
        }}
      />

      {formulario && (
        <FormularioClub
          key={formulario.clave}
          club={formulario.club}
          ocupado={mut.crear.isPending || mut.renombrar.isPending}
          cerrar={() => {
            setFormulario(null)
          }}
          guardar={(nombre) => {
            const cerrar = () => {
              setFormulario(null)
            }
            if (formulario.club) {
              mut.renombrar.mutate(
                { id: formulario.club.id, nombre },
                {
                  onSuccess: () => {
                    toast.success('Club guardado', { duration: 3000 })
                    cerrar()
                  },
                },
              )
            } else {
              mut.crear.mutate(nombre, {
                onSuccess: () => {
                  toast.success(`${nombre} creado. Súbele el escudo.`, { duration: 3000 })
                  cerrar()
                },
              })
            }
          }}
        />
      )}

      {aBorrar && (
        <ConfirmarBorrado
          key={aBorrar.clave}
          abierto
          cambiar={(abierto) => {
            if (!abierto) setABorrar(null)
          }}
          titulo="Borrar club"
          nombre={aBorrar.club.nombre}
          consecuencias={[
            ...(aBorrar.club.equipos > 0
              ? [`${plural(aBorrar.club.equipos, 'equipo queda', 'equipos quedan')} sin club (y sin el escudo del club)`]
              : []),
            'Si tiene títulos en el historial no se podrá borrar',
          ]}
          borrar={() => {
            const { club } = aBorrar
            mut.borrar.mutate(club, { onSuccess: () => toast.success(`${club.nombre} borrado`, { duration: 3000 }) })
          }}
        />
      )}
    </div>
  )
}

function FormularioClub({
  club,
  ocupado,
  cerrar,
  guardar,
}: {
  club: ClubConfig | null
  ocupado: boolean
  cerrar: () => void
  guardar: (nombre: string) => void
}) {
  const id = useId()
  const [nombre, setNombre] = useState(club?.nombre ?? '')
  const [error, setError] = useState<string | null>(null)
  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Escribe el nombre del club.')
      document.getElementById(`${id}-nombre`)?.focus()
      return
    }
    setError(null)
    guardar(nombre.trim())
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
          <SheetTitle>{club ? 'Cambiar nombre' : 'Nuevo club'}</SheetTitle>
          <SheetDescription>El escudo se sube después, desde la lista.</SheetDescription>
        </SheetHeader>
        <form className="flex flex-col gap-4 px-4 pb-4" onSubmit={enviar} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-nombre`}>Nombre</Label>
            <Input
              id={`${id}-nombre`}
              value={nombre}
              placeholder="Colonia Chitana"
              aria-invalid={error !== null}
              aria-describedby={`${id}-error`}
              onChange={(e) => {
                setNombre(e.target.value)
              }}
            />
          </div>
          <ErrorFormulario id={`${id}-error`}>{error}</ErrorFormulario>
          <Button type="submit" size="lg" disabled={ocupado}>
            {ocupado && <Loader2 aria-hidden className="animate-spin" />}
            {club ? 'Guardar' : 'Crear club'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
