import { ArrowLeft, Loader2, Minus, Plus, Search, Trash2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorDatos, NoEncontrado } from '@/components/EstadosPagina'
import { Escudo } from '@/components/partido/Escudo'
import { IndicadorEnVivo } from '@/components/partido/IndicadorEnVivo'
import { Marcador } from '@/components/partido/Marcador'
import { Reloj } from '@/components/partido/Reloj'
import { TextoHora } from '@/components/partido/TextoHora'
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { type Accion, useAccionesPartido, useJugadoresPartido } from '@/hooks/useAccionesPartido'
import { type PartidoDetalle, usePartido } from '@/hooks/usePartido'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import { textoFasePartido } from '@/lib/fases'
import { textoReferencia } from '@/lib/referencias'
import { cn } from '@/lib/utils'

type Lado = 'local' | 'visitante'

interface Confirmacion {
  titulo: string
  descripcion: string
  boton: string
  accion: Accion
  peligro?: boolean
}

/** Pantalla de control del admin de cancha (§4.2): se usa de pie, al sol y con una mano. */
export default function ControlPartido() {
  const id = Number(useParams().id)
  const { search } = useLocation()
  const partidoQ = usePartido(id)
  const { etiquetaPartido, desfaseMs } = usePartidosTorneo()
  const { ejecutar, pendiente } = useAccionesPartido(id)
  const p = partidoQ.data
  const jugadoresQ = useJugadoresPartido(p?.equipo_local_id ?? null, p?.equipo_visitante_id ?? null)
  const [hojaGol, setHojaGol] = useState<Lado | null>(null)
  // Cada apertura monta la hoja de nuevo (sin autogol ni dorsal de la vez anterior).
  const [aperturasHoja, setAperturasHoja] = useState(0)
  // Lado de la última hoja abierta: el título no cambia durante la animación de cierre.
  const [ladoHoja, setLadoHoja] = useState<Lado>('local')
  const [aperturasPenales, setAperturasPenales] = useState(0)
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)
  const [penalesAbierto, setPenalesAbierto] = useState(false)

  const volver = (
    <Link
      to={{ pathname: '/admin', search }}
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-md font-semibold text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeft aria-hidden className="size-5" />
      Control de partidos
    </Link>
  )

  if (!Number.isInteger(id) || id <= 0) return <NoEncontrado que="Partido" volver={volver} />
  if (partidoQ.isPending) return <ControlCargando />
  if (partidoQ.isError) {
    return <ErrorDatos reintentar={() => void partidoQ.refetch()} reintentando={partidoQ.isRefetching} />
  }
  if (!p) return <NoEncontrado que="Partido" volver={volver} />

  const nombre = (lado: Lado) =>
    lado === 'local'
      ? (p.local?.nombre ?? textoReferencia(p.ref_local, etiquetaPartido))
      : (p.visitante?.nombre ?? textoReferencia(p.ref_visitante, etiquetaPartido))
  const ocupado = pendiente !== undefined
  const enVivo = p.estado === 'en_vivo'
  const goles = p.eventos.filter((e) => e.tipo === 'gol')
  const ultimoGol = [...goles].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
  const esEliminatoria = p.fase !== 'grupos'
  const empatado = p.goles_local === p.goles_visitante

  const pedirFinalizar = () => {
    if (esEliminatoria && empatado) {
      setAperturasPenales((n) => n + 1)
      setPenalesAbierto(true)
      return
    }
    setConfirmacion({
      titulo: 'Finalizar partido',
      descripcion: `Resultado final: ${nombre('local')} ${String(p.goles_local)} - ${String(p.goles_visitante)} ${nombre('visitante')}. Ya no se podrán registrar goles.`,
      boton: 'Finalizar',
      accion: { tipo: 'finalizar' },
    })
  }

  const describirGol = (e: PartidoDetalle['eventos'][number], conMinuto = true) => {
    const quien = e.jugador ? `${e.jugador.numero != null ? `#${String(e.jugador.numero)} ` : ''}${e.jugador.nombre}` : 'Sin jugador'
    const minuto = conMinuto && e.minuto != null ? ` (${String(e.minuto)}')` : ''
    return `${quien}${e.autogol ? ' (autogol)' : ''}${minuto}`
  }

  return (
    <div className="flex flex-col gap-6">
      <title>{`Control: ${nombre('local')} vs ${nombre('visitante')} · Intercolonias Chita`}</title>
      {volver}

      <section aria-labelledby="titulo-control" className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold text-muted-foreground">
          {[p.categoria.nombre, textoFasePartido(p), p.cancha?.nombre].filter(Boolean).join(' · ')}
        </p>
        <h1 id="titulo-control" className="sr-only">
          {`Control de ${nombre('local')} contra ${nombre('visitante')}`}
        </h1>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <Equipo nombre={nombre('local')} escudo={p.local?.escudo_path ?? null} definido={p.local !== null} />
          <div className="flex flex-col items-center pt-2">
            {p.estado === 'programado' ? (
              <span className="font-display text-5xl text-muted-foreground">vs</span>
            ) : (
              <Marcador
                golesLocal={p.goles_local}
                golesVisitante={p.goles_visitante}
                penalesLocal={p.penales_local}
                penalesVisitante={p.penales_visitante}
                tamano="lg"
              />
            )}
          </div>
          <Equipo nombre={nombre('visitante')} escudo={p.visitante?.escudo_path ?? null} definido={p.visitante !== null} />
        </div>
        <div className="flex min-h-14 flex-col items-center justify-center gap-1">
          {enVivo && (
            <>
              <IndicadorEnVivo />
              {desfaseMs !== undefined && (
                <Reloj partido={p} minutosPorTiempo={p.categoria.minutos_por_tiempo} desfaseMs={desfaseMs} className="font-display text-5xl" />
              )}
            </>
          )}
          {p.estado === 'programado' && (
            <span className="text-lg">
              <TextoHora partido={p} />
            </span>
          )}
          {p.estado === 'finalizado' && <span className="font-display text-3xl text-muted-foreground">Final</span>}
        </div>
        <p role="status" className="sr-only">
          {p.estado === 'programado' ? '' : `${nombre('local')} ${String(p.goles_local)}, ${nombre('visitante')} ${String(p.goles_visitante)}`}
        </p>
      </section>

      <section aria-label="Acciones" className="flex flex-col gap-3">
        {p.estado === 'programado' &&
          (p.local && p.visitante ? (
            <BotonAccion
              cargando={pendiente?.tipo === 'iniciar'}
              disabled={ocupado}
              onClick={() => {
                setConfirmacion({
                  titulo: 'Iniciar partido',
                  descripcion: `Empieza a correr el reloj de ${nombre('local')} vs ${nombre('visitante')} y se ajustan las horas de los siguientes partidos de la cancha.`,
                  boton: 'Iniciar',
                  accion: { tipo: 'iniciar' },
                })
              }}
            >
              Iniciar partido
            </BotonAccion>
          ) : (
            <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
              Este partido no se puede iniciar todavía: faltan equipos por definir.
            </p>
          ))}

        {enVivo && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(['local', 'visitante'] as const).map((lado) => (
                <Button
                  key={lado}
                  variant="accent"
                  disabled={ocupado}
                  className="h-auto min-h-20 flex-col gap-0 px-2 py-2 text-lg"
                  onClick={() => {
                    setAperturasHoja((n) => n + 1)
                    setLadoHoja(lado)
                    setHojaGol(lado)
                  }}
                >
                  <span className="flex items-center gap-1 font-display text-3xl leading-none">
                    <Plus aria-hidden className="size-6" /> Gol
                  </span>
                  <span className="max-w-full truncate text-sm">{nombre(lado)}</span>
                </Button>
              ))}
            </div>
            {p.periodo === '1T' && (
              <BotonAccion
                variante="outline"
                cargando={pendiente?.tipo === 'medio_tiempo'}
                disabled={ocupado}
                onClick={() => {
                  setConfirmacion({
                    titulo: 'Medio tiempo',
                    descripcion: 'Termina el primer tiempo y se pausa el reloj.',
                    boton: 'Medio tiempo',
                    accion: { tipo: 'medio_tiempo' },
                  })
                }}
              >
                Medio tiempo
              </BotonAccion>
            )}
            {p.periodo === 'descanso' && (
              <BotonAccion
                cargando={pendiente?.tipo === 'segundo_tiempo'}
                disabled={ocupado}
                onClick={() => {
                  setConfirmacion({
                    titulo: 'Iniciar 2º tiempo',
                    descripcion: 'Vuelve a correr el reloj desde el minuto siguiente al primer tiempo.',
                    boton: 'Iniciar 2º tiempo',
                    accion: { tipo: 'segundo_tiempo' },
                  })
                }}
              >
                Iniciar 2º tiempo
              </BotonAccion>
            )}
            {p.periodo === '2T' && (
              <BotonAccion cargando={pendiente?.tipo === 'finalizar'} disabled={ocupado} onClick={pedirFinalizar}>
                Finalizar partido
              </BotonAccion>
            )}
          </>
        )}
      </section>

      {p.estado !== 'programado' && (
        <section aria-labelledby="titulo-goles" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-goles" className="text-3xl">
              Goles
            </h2>
            {enVivo && ultimoGol && (
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={ocupado}
                onClick={() => {
                  setConfirmacion({
                    titulo: 'Anular último gol',
                    descripcion: `¿Anular el gol de ${describirGol(ultimoGol)}? El marcador se corrige solo.`,
                    boton: 'Anular gol',
                    accion: { tipo: 'anular', eventoId: ultimoGol.id },
                    peligro: true,
                  })
                }}
              >
                Anular último gol
              </Button>
            )}
          </div>
          {goles.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">Aún no hay goles.</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border bg-card">
              {goles.map((e) => {
                const lado: Lado = e.equipo_id === p.equipo_local_id ? 'local' : 'visitante'
                return (
                  <li key={e.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                    <span className="w-12 shrink-0 font-display text-2xl tabular-nums">
                      {e.minuto != null ? `${String(e.minuto)}'` : '–'}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{nombre(lado)}</span>
                      <span className="truncate text-sm text-muted-foreground">{describirGol(e, false)}</span>
                    </span>
                    {enVivo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={ocupado}
                        aria-label={`Anular gol de ${describirGol(e)}`}
                        onClick={() => {
                          setConfirmacion({
                            titulo: 'Anular gol',
                            descripcion: `¿Anular el gol de ${describirGol(e)} para ${nombre(lado)}? El marcador se corrige solo.`,
                            boton: 'Anular gol',
                            accion: { tipo: 'anular', eventoId: e.id },
                            peligro: true,
                          })
                        }}
                      >
                        {pendiente?.tipo === 'anular' && pendiente.eventoId === e.id ? (
                          <Loader2 aria-hidden className="animate-spin" />
                        ) : (
                          <Trash2 aria-hidden />
                        )}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <HojaGol
        key={`hoja-${String(aperturasHoja)}`}
        abierta={hojaGol !== null}
        cerrar={() => {
          setHojaGol(null)
        }}
        lado={ladoHoja}
        partido={p}
        nombre={nombre}
        jugadores={jugadoresQ.data ?? []}
        cargandoJugadores={jugadoresQ.isLoading}
        ocupado={ocupado}
        registrar={(accion, texto) => {
          ejecutar(accion, () => {
            setHojaGol(null)
            toast.success(texto, { duration: 3000 })
          })
        }}
      />

      <AlertDialog
        open={confirmacion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setConfirmacion(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{confirmacion?.titulo}</AlertDialogTitle>
          <AlertDialogDescription>{confirmacion?.descripcion}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={confirmacion?.peligro ? 'bg-destructive text-destructive-foreground hover:bg-destructive-hover' : undefined}
              onClick={() => {
                if (confirmacion) {
                  const { accion, boton } = confirmacion
                  ejecutar(accion, () => {
                    toast.success(accion.tipo === 'anular' ? 'Gol anulado' : `Listo: ${boton}`, { duration: 3000 })
                  })
                }
              }}
            >
              {confirmacion?.boton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogoPenales
        key={`penales-${String(aperturasPenales)}`}
        abierto={penalesAbierto}
        cambiar={setPenalesAbierto}
        nombreLocal={nombre('local')}
        nombreVisitante={nombre('visitante')}
        finalizar={(local, visitante) => {
          ejecutar({ tipo: 'finalizar', penalesLocal: local, penalesVisitante: visitante })
        }}
      />
    </div>
  )
}

function BotonAccion({
  children,
  cargando,
  variante = 'default',
  ...props
}: {
  children: ReactNode
  cargando: boolean
  variante?: 'default' | 'outline'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button variant={variante} className="h-16 w-full text-xl" {...props}>
      {cargando && <Loader2 aria-hidden className="size-6 animate-spin" />}
      {children}
    </Button>
  )
}

function Equipo({ nombre, escudo, definido }: { nombre: string; escudo: string | null; definido: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {definido ? (
        <Escudo nombre={nombre} path={escudo} tamano="lg" />
      ) : (
        <span aria-hidden className="size-16 shrink-0 rounded-full border-2 border-dashed border-input" />
      )}
      <span className={cn('leading-tight font-semibold [overflow-wrap:anywhere]', !definido && 'text-muted-foreground italic')}>
        {nombre}
      </span>
    </div>
  )
}

interface Jugador {
  id: number
  nombre: string
  numero: number | null
  equipo_id: number
}

/** Hoja inferior para registrar un gol: un toque sobre el jugador lo registra. */
function HojaGol({
  abierta,
  cerrar,
  lado,
  partido,
  nombre,
  jugadores,
  cargandoJugadores,
  ocupado,
  registrar,
}: {
  abierta: boolean
  cerrar: () => void
  lado: Lado
  partido: PartidoDetalle
  nombre: (lado: Lado) => string
  jugadores: Jugador[]
  cargandoJugadores: boolean
  ocupado: boolean
  registrar: (accion: Accion, texto: string) => void
}) {
  const [autogol, setAutogol] = useState(false)
  const [dorsal, setDorsal] = useState('')
  const rival: Lado = lado === 'local' ? 'visitante' : 'local'
  const equipoId = lado === 'local' ? partido.equipo_local_id : partido.equipo_visitante_id
  const equipoJugadores = (autogol ? rival : lado) === 'local' ? partido.equipo_local_id : partido.equipo_visitante_id
  const lista = jugadores
    .filter((j) => j.equipo_id === equipoJugadores)
    .filter((j) => dorsal === '' || String(j.numero ?? '').startsWith(dorsal))

  const gol = (jugador: Jugador | null) => {
    if (equipoId === null) return
    const quien = jugador
      ? `${jugador.numero != null ? `#${String(jugador.numero)} ` : ''}${jugador.nombre}`
      : 'sin jugador'
    registrar(
      { tipo: 'gol', equipoId, jugadorId: jugador?.id ?? null, autogol },
      `Gol de ${nombre(lado)}: ${quien}${autogol ? ' (autogol)' : ''}`,
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
          <SheetTitle>{`Gol de ${nombre(lado)}`}</SheetTitle>
          <SheetDescription>Toca quién lo hizo. El minuto lo pone el servidor.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={autogol ? 'default' : 'outline'}
              aria-pressed={autogol}
              onClick={() => {
                setAutogol((v) => !v)
              }}
            >
              Fue autogol
            </Button>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-10"
                inputMode="numeric"
                placeholder="Dorsal"
                aria-label="Buscar por dorsal"
                value={dorsal}
                onChange={(e) => {
                  setDorsal(e.target.value.replace(/\D/g, ''))
                }}
              />
            </div>
          </div>
          {autogol && (
            <p className="text-sm font-semibold">{`Elige al jugador de ${nombre(rival)} que lo hizo en contra.`}</p>
          )}
        </div>
        <ul className="flex flex-col gap-2 overflow-y-auto px-4 pb-4">
          <li>
            <Button variant="secondary" className="h-12 w-full justify-start text-base" disabled={ocupado} onClick={() => { gol(null) }}>
              Sin jugador
            </Button>
          </li>
          {cargandoJugadores
            ? Array.from({ length: 4 }, (_, i) => (
                <li key={`esqueleto-${String(i)}`}>
                  <Skeleton className="h-12" />
                </li>
              ))
            : lista.map((j) => (
                <li key={j.id}>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start gap-3 text-base"
                    disabled={ocupado}
                    onClick={() => {
                      gol(j)
                    }}
                  >
                    <span className="w-10 text-right font-display text-2xl tabular-nums">{j.numero ?? '–'}</span>
                    <span className="truncate">{j.nombre}</span>
                  </Button>
                </li>
              ))}
          {!cargandoJugadores && lista.length === 0 && (
            <li className="p-2 text-muted-foreground">No hay jugadores con ese dorsal.</li>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  )
}

/** Eliminatoria empatada: exige penales con un ganador (la base lo valida igual, §3.4). */
function DialogoPenales({
  abierto,
  cambiar,
  nombreLocal,
  nombreVisitante,
  finalizar,
}: {
  abierto: boolean
  cambiar: (abierto: boolean) => void
  nombreLocal: string
  nombreVisitante: string
  finalizar: (local: number, visitante: number) => void
}) {
  const [local, setLocal] = useState(0)
  const [visitante, setVisitante] = useState(0)
  return (
    <AlertDialog open={abierto} onOpenChange={cambiar}>
      <AlertDialogContent>
        <AlertDialogTitle>Penales</AlertDialogTitle>
        <AlertDialogDescription>
          El partido terminó empatado. Registra los penales: tiene que haber un ganador.
        </AlertDialogDescription>
        <div className="flex flex-col gap-3">
          <Contador etiqueta={nombreLocal} valor={local} cambiar={setLocal} />
          <Contador etiqueta={nombreVisitante} valor={visitante} cambiar={setVisitante} />
        </div>
        {local === visitante && <p className="text-sm font-semibold text-destructive">Los penales no pueden quedar empatados.</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={local === visitante}
            onClick={() => {
              finalizar(local, visitante)
            }}
          >
            Finalizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Contador({ etiqueta, valor, cambiar }: { etiqueta: string; valor: number; cambiar: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1 truncate font-semibold">{etiqueta}</span>
      <Button
        variant="outline"
        size="icon"
        aria-label={`Restar un penal a ${etiqueta}`}
        disabled={valor === 0}
        onClick={() => {
          cambiar(Math.max(0, valor - 1))
        }}
      >
        <Minus aria-hidden />
      </Button>
      <span className="w-10 text-center font-display text-4xl tabular-nums" aria-live="polite">
        {valor}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label={`Sumar un penal a ${etiqueta}`}
        onClick={() => {
          cambiar(valor + 1)
        }}
      >
        <Plus aria-hidden />
      </Button>
    </div>
  )
}

function ControlCargando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando partido">
      <Skeleton className="h-11 w-48" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}
