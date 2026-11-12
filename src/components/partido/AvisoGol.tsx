import { CircleDot } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Escudo } from '@/components/partido/Escudo'
import { useTorneoActivo } from '@/hooks/useTorneoActivo'
import { escucharAvisos, type GolNuevo } from '@/lib/avisos-gol'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/** Cuánto se ve cada aviso (pedido del dueño). */
const DURACION_MS = 8000

interface Aviso {
  eventoId: number
  partidoId: number
  marcoLocal: boolean
  local: { nombre: string; escudo_path: string | null }
  visitante: { nombre: string; escudo_path: string | null }
  golesLocal: number
  golesVisitante: number
  minuto: number | null
  jugador: string | null
}

/** Datos para el aviso: el marcador ya viene actualizado por el trigger de la base (mismo commit que el gol). */
async function armarAviso(gol: GolNuevo, categorias: number[]): Promise<Aviso | null> {
  const { data: p } = await supabase
    .from('partidos')
    .select(
      `id, categoria_id, equipo_local_id, goles_local, goles_visitante,
       local:equipos!partidos_equipo_local_id_fkey(nombre, escudo_path),
       visitante:equipos!partidos_equipo_visitante_id_fkey(nombre, escudo_path)`,
    )
    .eq('id', gol.partidoId)
    .maybeSingle()
  // Solo partidos del torneo que ve el público.
  if (!p?.local || !p.visitante || !categorias.includes(p.categoria_id)) return null
  let jugador: string | null = null
  if (gol.jugadorId !== null) {
    const { data: j } = await supabase.from('jugadores').select('nombre, numero').eq('id', gol.jugadorId).maybeSingle()
    if (j) jugador = j.numero !== null ? `#${String(j.numero)} ${j.nombre}` : j.nombre
  }
  return {
    eventoId: gol.eventoId,
    partidoId: p.id,
    marcoLocal: gol.equipoId === p.equipo_local_id,
    local: p.local,
    visitante: p.visitante,
    golesLocal: p.goles_local,
    golesVisitante: p.goles_visitante,
    minuto: gol.minuto,
    jugador,
  }
}

/**
 * Aviso compacto de gol en la esquina (versión "A" elegida por el dueño): escudos, marcador y "Gol".
 * Dura 8 s, se toca para ir al partido, los goles seguidos salen en fila y un gol anulado se quita.
 * Solo con la página abierta (no hay notificaciones push).
 */
export function AvisoGol() {
  const categorias = useTorneoActivo().data?.categorias.map((c) => c.id)
  const categoriasRef = useRef<number[]>([])
  // Goles anulados mientras su aviso todavía se estaba armando (carrera entre el DELETE y las consultas).
  const anulados = useRef(new Set<number>())
  const [cola, setCola] = useState<Aviso[]>([])
  // Pausa y tiempo restante van atados al aviso: uno nuevo empieza sin pausa y con sus 8 s.
  const [pausadoEn, setPausadoEn] = useState<number | null>(null)
  const restante = useRef({ eventoId: 0, ms: DURACION_MS })
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const listaCategorias = categorias?.join(',') ?? ''
  useEffect(() => {
    categoriasRef.current = listaCategorias ? listaCategorias.split(',').map(Number) : []
  }, [listaCategorias])

  useEffect(
    () =>
      escucharAvisos((aviso) => {
        if (aviso.tipo === 'anulado') {
          anulados.current.add(aviso.eventoId)
          setCola((c) => c.filter((a) => a.eventoId !== aviso.eventoId))
          return
        }
        void armarAviso(aviso.gol, categoriasRef.current).then((nuevo) => {
          if (!nuevo || anulados.current.has(nuevo.eventoId)) return
          setCola((c) => (c.some((a) => a.eventoId === nuevo.eventoId) ? c : [...c, nuevo]))
        })
      }),
    [],
  )

  const actual = cola[0]
  // Quien ya está viendo ese partido no necesita el aviso.
  const enEsePartido = actual !== undefined && pathname === `/partido/${String(actual.partidoId)}`
  const pausado = pausadoEn !== null && pausadoEn === actual?.eventoId

  // Cuenta el tiempo; con el mouse encima o el foco en la tarjeta se pausa (WCAG 2.2.1).
  useEffect(() => {
    if (!actual || pausado) return
    if (restante.current.eventoId !== actual.eventoId) restante.current = { eventoId: actual.eventoId, ms: DURACION_MS }
    const inicio = Date.now()
    const id = window.setTimeout(
      () => {
        setCola((c) => c.slice(1))
      },
      enEsePartido ? 0 : restante.current.ms,
    )
    return () => {
      window.clearTimeout(id)
      restante.current.ms = Math.max(0, restante.current.ms - (Date.now() - inicio))
    }
  }, [actual, enEsePartido, pausado])

  const visible = actual !== undefined && !enEsePartido
  const quien = actual ? (actual.marcoLocal ? actual.local.nombre : actual.visitante.nombre) : ''
  const resumen = actual
    ? `Gol de ${quien}${actual.jugador ? `, ${actual.jugador}` : ''}${actual.minuto !== null ? `, al minuto ${String(actual.minuto)}` : ''}. ${actual.local.nombre} ${String(actual.golesLocal)}, ${actual.visitante.nombre} ${String(actual.golesVisitante)}.`
    : ''
  const pausar = () => {
    setPausadoEn(actual?.eventoId ?? null)
  }
  const seguir = () => {
    setPausadoEn(null)
  }

  return (
    <div className="pointer-events-none fixed right-3 bottom-24 z-40 md:right-6 md:bottom-6">
      {visible && (
        <button
          key={actual.eventoId}
          type="button"
          aria-label={`${resumen} Ver el partido.`}
          onMouseEnter={pausar}
          onMouseLeave={seguir}
          onFocus={pausar}
          onBlur={seguir}
          onClick={() => {
            setCola((c) => c.slice(1))
            void navigate(`/partido/${String(actual.partidoId)}`)
          }}
          className="pointer-events-auto flex w-32 animate-aviso-gol flex-col overflow-hidden rounded-2xl border bg-card text-center shadow-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:animate-none"
        >
          <span className="flex items-center justify-center gap-1.5 px-2 pt-2.5">
            <Escudo
              nombre={actual.local.nombre}
              path={actual.local.escudo_path}
              className={cn('rounded-full', actual.marcoLocal && 'ring-3 ring-accent')}
            />
            <Escudo
              nombre={actual.visitante.nombre}
              path={actual.visitante.escudo_path}
              className={cn('rounded-full', !actual.marcoLocal && 'ring-3 ring-accent')}
            />
          </span>
          <span className="py-1 font-display text-2xl leading-none tabular-nums">
            <span className={cn(actual.marcoLocal && 'text-primary')}>{actual.golesLocal}</span>
            <span className="text-muted-foreground"> - </span>
            <span className={cn(!actual.marcoLocal && 'text-primary')}>{actual.golesVisitante}</span>
          </span>
          {actual.minuto !== null && (
            <span className="-mt-0.5 pb-1 text-xs text-muted-foreground">{`${String(actual.minuto)}'`}</span>
          )}
          <span className="flex items-center justify-center gap-1 bg-primary py-1.5 text-sm font-semibold text-primary-foreground">
            <CircleDot aria-hidden className="size-4" />
            Gol
          </span>
          <span
            aria-hidden
            className="h-1 w-full origin-left animate-barra-gol bg-accent motion-reduce:animate-none"
            style={{ animationPlayState: pausado ? 'paused' : 'running' }}
          />
        </button>
      )}
      {/* Siempre montada: los lectores de pantalla solo anuncian cambios en una región que ya existía. */}
      <p className="sr-only" aria-live="polite">
        {visible ? resumen : ''}
      </p>
    </div>
  )
}
