import { ChevronDown, ChevronRight, Plus, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router'
import { toast } from 'sonner'
import { ErrorDatos } from '@/components/EstadosPagina'
import { FormularioPartido } from '@/components/admin/FormularioPartido'
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
import { type PartidoAgenda, useAgenda, useMutacionesAgenda } from '@/hooks/useAgenda'
import { nombreFase } from '@/lib/fases'
import { textoReferencia } from '@/lib/referencias'
import { claveDia, formatearDiaCorto, formatearHora } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

const SIN_HORARIO = 'sin-horario'
const TODOS = 'todos'
const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

/** Texto corto para la tarjeta (el mensaje completo de la base va en la lista de arriba). */
const AVISO_CORTO: Record<string, string> = {
  fuera_de_fecha: 'Fuera de las fechas del torneo',
  fuera_de_jornada: 'Fuera de la jornada',
  equipo_solapado: 'Un equipo juega otro partido a la vez',
  cancha_cerrada: 'Cancha cerrada',
  sin_cancha: 'Sin cancha',
  sin_hora: 'Sin hora',
  cancha_incompatible: 'Cancha no válida para la categoría',
  eliminatoria_antes_de_grupos: 'Antes de que terminen los grupos',
}

/** Agenda del torneo por día y cancha: editar a mano los partidos pendientes y agregar partidos (§4.2 super admin 6). */
export default function Agenda() {
  const { torneo } = useOutletContext<ContextoConfig>()
  const agendaQ = useAgenda(torneo?.id)
  const mut = useMutacionesAgenda()
  const [dia, setDia] = useState(TODOS)
  const [canchaFiltro, setCanchaFiltro] = useState(TODOS)
  const [formulario, setFormulario] = useState<{
    partido: PartidoAgenda | null
    clave: number
  } | null>(null)
  const [aBorrar, setABorrar] = useState<PartidoAgenda | null>(null)

  const datos = agendaQ.data
  const etiquetas = useMemo(() => new Map(datos?.partidos.map((p) => [p.id, p.etiqueta]) ?? []), [datos])
  const avisosPorPartido = useMemo(() => {
    const mapa = new Map<number, string[]>()
    for (const a of datos?.advertencias ?? []) {
      for (const pid of [a.partido_id, a.otro_partido_id]) {
        const texto = AVISO_CORTO[a.tipo] ?? a.mensaje
        if (pid !== null && !mapa.get(pid)?.includes(texto)) mapa.set(pid, [...(mapa.get(pid) ?? []), texto])
      }
    }
    return mapa
  }, [datos])

  if (!torneo) return <p className="text-muted-foreground">Primero crea un torneo en la sección Torneo.</p>
  if (agendaQ.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando agenda">
        <Skeleton className="h-11 w-40" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }
  if (agendaQ.isError) {
    return <ErrorDatos reintentar={() => void agendaQ.refetch()} reintentando={agendaQ.isRefetching} />
  }

  const { categorias, canchas, partidos, advertencias } = agendaQ.data
  // La agenda muestra la hora programada (la que se edita); la estimada (con retrasos) va aparte.
  const hora = (p: PartidoAgenda) => p.hora_programada
  const dias = [
    ...new Map(
      partidos.flatMap((p) => {
        const h = hora(p)
        return h ? [[claveDia(h), formatearDiaCorto(h)] as const] : []
      }),
    ).entries(),
  ]
  const haySinHorario = partidos.some((p) => hora(p) === null)
  const visibles = partidos
    .filter((p) => {
      const h = hora(p)
      if (dia === SIN_HORARIO) return h === null
      return dia === TODOS || (h !== null && claveDia(h) === dia)
    })
    .filter((p) => canchaFiltro === TODOS || p.cancha_id === Number(canchaFiltro))
    .sort((a, b) => (hora(a) ?? '').localeCompare(hora(b) ?? '') || a.id - b.id)

  const nombreEquipo = (equipo: { nombre: string } | null, ref: string | null) =>
    equipo?.nombre ?? textoReferencia(ref, (pid) => etiquetas.get(pid))
  const nombreCategoria = (id: number) => categorias.find((c) => c.id === id)?.nombre ?? ''
  const nombreCancha = (id: number | null) => canchas.find((c) => c.id === id)?.nombre ?? 'Sin cancha'
  const chip = (valor: string, texto: string) => (
    <button
      key={valor}
      type="button"
      aria-pressed={dia === valor}
      onClick={() => {
        setDia(valor)
      }}
      className={cn(
        'min-h-11 shrink-0 rounded-full border px-4 font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
        dia === valor ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
      )}
    >
      {texto}
    </button>
  )

  return (
    <div className="flex flex-col gap-5">
      <title>Agenda · Intercolonias Chita</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Agenda</h1>
        <Button
          disabled={categorias.length === 0}
          onClick={() => {
            setFormulario({ partido: null, clave: Date.now() })
          }}
        >
          <Plus aria-hidden />
          Agregar partido
        </Button>
      </div>

      {advertencias.length > 0 ? (
        <details className="group rounded-lg border border-gold bg-surface-warm p-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold [&::-webkit-details-marker]:hidden">
            <TriangleAlert aria-hidden className="size-5 shrink-0 text-gold-foreground" />
            {`${plural(advertencias.length, 'advertencia', 'advertencias')} en la agenda`}
            <ChevronDown aria-hidden className="ml-auto size-5 shrink-0 group-open:rotate-180" />
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-6 text-sm">
            {advertencias.map((a) => (
              <li key={`${a.tipo}-${String(a.partido_id)}-${String(a.otro_partido_id)}`}>{a.mensaje}</li>
            ))}
          </ul>
        </details>
      ) : (
        partidos.length > 0 && (
          <p className="text-sm text-muted-foreground">Sin advertencias: la agenda está en orden.</p>
        )
      )}

      {partidos.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Aún no hay partidos. Genéralos en Fixture o agrégalos a mano.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div
              role="group"
              aria-label="Día"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
            >
              {chip(TODOS, 'Todos')}
              {dias.map(([clave, texto]) => chip(clave, texto))}
              {haySinHorario && chip(SIN_HORARIO, 'Sin horario')}
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Cancha
              <select
                value={canchaFiltro}
                onChange={(e) => {
                  setCanchaFiltro(e.target.value)
                }}
                className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:max-w-xs"
              >
                <option value={TODOS}>Todas las canchas</option>
                {canchas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.activa ? c.nombre : `${c.nombre} (cerrada)`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visibles.length === 0 ? (
            <p className="text-muted-foreground">No hay partidos con este filtro.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibles.map((p) => {
                const h = hora(p)
                const avisos = avisosPorPartido.get(p.id) ?? []
                const pendiente = p.estado === 'programado'
                const contenido = (
                  <>
                    <span className="flex w-16 shrink-0 flex-col items-center">
                      <span className="font-display text-2xl leading-none tabular-nums">
                        {h ? formatearHora(h) : '--:--'}
                      </span>
                      {dia === TODOS && h && (
                        <span className="text-xs text-muted-foreground">{formatearDiaCorto(h)}</span>
                      )}
                      {pendiente && h && p.hora_estimada && p.hora_estimada !== h && (
                        <span
                          className="text-sm font-semibold text-muted-foreground"
                          aria-label={`Hora estimada ${formatearHora(p.hora_estimada)}`}
                        >
                          {`≈ ${formatearHora(p.hora_estimada)}`}
                        </span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold break-words">
                        {`${nombreEquipo(p.local, p.ref_local)} vs ${nombreEquipo(p.visitante, p.ref_visitante)}`}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {[
                          nombreCategoria(p.categoria_id),
                          p.grupo ? `Grupo ${p.grupo.nombre}` : (p.etiqueta ?? nombreFase(p.fase)),
                          nombreCancha(p.cancha_id),
                        ].join(' · ')}
                      </span>
                      {!pendiente && (
                        <span className="text-sm font-semibold text-primary">
                          {p.estado === 'en_vivo'
                            ? `En juego · ${String(p.goles_local)}-${String(p.goles_visitante)}`
                            : `Final · ${String(p.goles_local)}-${String(p.goles_visitante)}`}
                        </span>
                      )}
                      {avisos.length > 0 && <span className="sr-only">Con advertencia:</span>}
                      {avisos.map((a) => (
                        <span key={a} className="flex items-start gap-1 text-sm">
                          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
                          {a}
                        </span>
                      ))}
                    </span>
                    {pendiente && (
                      <ChevronRight aria-hidden className="size-5 shrink-0 self-center text-muted-foreground" />
                    )}
                  </>
                )
                const clase = cn(
                  'flex min-h-16 w-full items-start gap-3 rounded-lg border bg-card p-3 text-left',
                  avisos.length > 0 && 'border-l-4 border-l-gold',
                )
                return (
                  <li key={p.id}>
                    {pendiente ? (
                      <button
                        type="button"
                        className={cn(
                          clase,
                          'transition-colors hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        )}
                        onClick={() => {
                          setFormulario({ partido: p, clave: Date.now() })
                        }}
                      >
                        {contenido}
                      </button>
                    ) : (
                      <div className={cn(clase, 'bg-surface')}>{contenido}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {formulario && (
        <FormularioPartido
          key={formulario.clave}
          partido={formulario.partido}
          categorias={categorias}
          canchas={canchas}
          fechaInicio={torneo.fecha_inicio}
          ocupado={mut.editar.isPending || mut.crear.isPending}
          cerrar={() => {
            setFormulario(null)
          }}
          guardarCambios={(cambios) => {
            const p = formulario.partido
            if (!p) return
            mut.editar.mutate(
              { id: p.id, cambios },
              {
                onSuccess: () => {
                  toast.success('Partido actualizado', { duration: 3000 })
                  setFormulario(null)
                },
              },
            )
          }}
          crear={(nuevo) => {
            mut.crear.mutate(nuevo, {
              onSuccess: () => {
                toast.success('Partido agregado', { duration: 3000 })
                setFormulario(null)
              },
            })
          }}
          borrar={() => {
            setABorrar(formulario.partido)
            setFormulario(null)
          }}
        />
      )}

      <AlertDialog
        open={aBorrar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setABorrar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>¿Borrar este partido?</AlertDialogTitle>
          <AlertDialogDescription>
            {aBorrar
              ? `${nombreEquipo(aBorrar.local, aBorrar.ref_local)} vs ${nombreEquipo(aBorrar.visitante, aBorrar.ref_visitante)} (${nombreCategoria(aBorrar.categoria_id)}). Esta acción no se puede deshacer.`
              : ''}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive-hover"
              onClick={() => {
                if (aBorrar)
                  mut.borrar.mutate(aBorrar.id, {
                    onSuccess: () => toast.success('Partido borrado', { duration: 3000 }),
                  })
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
