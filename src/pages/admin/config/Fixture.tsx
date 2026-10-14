import { CalendarPlus, Loader2, Lock, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { toast } from 'sonner'
import { ErrorDatos } from '@/components/EstadosPagina'
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
import { Skeleton } from '@/components/ui/skeleton'
import { type CategoriaFixture, useFixture, useMutacionesFixture } from '@/hooks/useConfigFixture'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

/** Avisos antes de generar: equipos que quedarían sin partidos. */
function avisos(c: CategoriaFixture): string[] {
  return [
    c.sinGrupo > 0 ? `${plural(c.sinGrupo, 'equipo sin grupo no tendrá', 'equipos sin grupo no tendrán')} partidos` : null,
    ...c.grupos
      .filter((g) => g.equipos < 2)
      .map((g) => `El grupo ${g.nombre} tiene ${plural(g.equipos, 'equipo', 'equipos')}: no se le crean partidos`),
  ].filter((a): a is string => a !== null)
}

/** Fixture (§4.2 super admin 6): generar o borrar los partidos de cada categoría. */
export default function Fixture() {
  const { torneo } = useOutletContext<ContextoConfig>()
  const fixtureQ = useFixture(torneo?.id)
  const mut = useMutacionesFixture()
  const [aGenerar, setAGenerar] = useState<CategoriaFixture | null>(null)
  const [aBorrar, setABorrar] = useState<{ categoria: CategoriaFixture; clave: number } | null>(null)

  if (!torneo) return <p className="text-muted-foreground">Primero crea un torneo en la sección Torneo.</p>
  const ocupado = mut.generar.isPending || mut.borrar.isPending

  const tarjeta = (c: CategoriaFixture) => {
    const listos = c.grupos.filter((g) => g.equipos >= 2).length
    const lineas = avisos(c)
    return (
      <li key={c.id}>
        <section aria-labelledby={`fixture-${String(c.id)}`} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <h2 id={`fixture-${String(c.id)}`} className="text-2xl">
              {c.nombre}
            </h2>
            <p className="text-sm text-muted-foreground">
              {[plural(c.grupos.length, 'grupo', 'grupos'), plural(c.equipos, 'equipo', 'equipos')].join(' · ')}
            </p>
          </div>

          {c.partidos > 0 ? (
            <p className="font-semibold">
              {`${plural(c.partidos, 'partido', 'partidos')}: ${String(c.deGrupos)} de grupos${c.partidos > c.deGrupos ? ` y ${String(c.partidos - c.deGrupos)} de eliminatorias` : ''}`}
              {c.iniciados > 0 && (
                <span className="block text-sm font-normal text-muted-foreground">
                  {`${plural(c.iniciados, 'ya empezó o se jugó', 'ya empezaron o se jugaron')}.`}
                </span>
              )}
            </p>
          ) : (
            <p className="text-muted-foreground">Sin partidos.</p>
          )}

          {c.partidos === 0 && lineas.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {lineas.map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
                  {l}
                </li>
              ))}
            </ul>
          )}

          {c.partidos === 0 ? (
            listos === 0 ? (
              <p className="text-sm">
                {'Primero arma los grupos (al menos uno con 2 equipos) en '}
                <Link
                  to={{ pathname: '/admin/grupos', search: `?cat=${String(c.id)}` }}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Grupos
                </Link>
                .
              </p>
            ) : (
              <Button
                disabled={ocupado}
                onClick={() => {
                  setAGenerar(c)
                }}
              >
                {mut.generar.isPending && mut.generar.variables === c.id ? (
                  <Loader2 aria-hidden className="animate-spin" />
                ) : (
                  <CalendarPlus aria-hidden />
                )}
                Generar partidos
              </Button>
            )
          ) : c.iniciados > 0 ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
              La categoría ya empezó: su fixture no se puede borrar ni regenerar. Los cambios se hacen en la agenda.
            </p>
          ) : (
            <Button
              variant="outline"
              disabled={ocupado}
              className="text-destructive"
              onClick={() => {
                setABorrar({ categoria: c, clave: Date.now() })
              }}
            >
              <Trash2 aria-hidden />
              Borrar partidos para regenerar
            </Button>
          )}
        </section>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <title>Fixture · Intercolonias Chita</title>
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Fixture</h1>
        <p className="text-muted-foreground">
          Crea los partidos de cada categoría con sus grupos. Los horarios se asignan después.
        </p>
      </div>

      {fixtureQ.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando fixture">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : fixtureQ.isError ? (
        <ErrorDatos nivel="h2" reintentar={() => void fixtureQ.refetch()} reintentando={fixtureQ.isRefetching} />
      ) : fixtureQ.data.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Primero crea las categorías, sus equipos y sus grupos.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">{fixtureQ.data.map(tarjeta)}</ul>
      )}

      <AlertDialog
        open={aGenerar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setAGenerar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{`¿Generar los partidos de ${aGenerar?.nombre ?? ''}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {aGenerar?.grupos.filter((g) => g.equipos > 0).length === 2
              ? 'Todos contra todos en cada grupo, más semifinales, tercer puesto y final. Después de generarlos, los grupos quedan cerrados.'
              : 'Todos contra todos en cada grupo. Las eliminatorias solo se crean solas con 2 grupos; si las necesitas, agrégalas a mano en la agenda. Después de generarlos, los grupos quedan cerrados.'}
          </AlertDialogDescription>
          {aGenerar && avisos(aGenerar).length > 0 && (
            <ul className="list-disc pl-5 text-sm font-semibold">
              {avisos(aGenerar).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!aGenerar) return
                const { id, nombre } = aGenerar
                mut.generar.mutate(id, {
                  onSuccess: (n) =>
                    toast.success(`${nombre}: ${plural(n, 'partido creado', 'partidos creados')}. Falta programar los horarios.`, {
                      duration: 4000,
                    }),
                })
              }}
            >
              Generar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {aBorrar && (
        <ConfirmarBorrado
          key={aBorrar.clave}
          abierto
          cambiar={(abierto) => {
            if (!abierto) setABorrar(null)
          }}
          titulo={`Borrar los partidos de ${aBorrar.categoria.nombre}`}
          nombre={aBorrar.categoria.nombre}
          consecuencias={[
            `${plural(aBorrar.categoria.partidos, 'partido', 'partidos')} con sus horarios y ediciones a mano`,
            'Los grupos se vuelven a poder cambiar',
          ]}
          borrar={() => {
            const { id, nombre } = aBorrar.categoria
            mut.borrar.mutate(id, {
              onSuccess: (n) => toast.success(`${nombre}: ${plural(n, 'partido borrado', 'partidos borrados')}`, { duration: 3000 }),
            })
          }}
        />
      )}
    </div>
  )
}
