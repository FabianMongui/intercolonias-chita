import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export type Accion =
  | { tipo: 'iniciar' }
  | { tipo: 'medio_tiempo' }
  | { tipo: 'segundo_tiempo' }
  | { tipo: 'finalizar'; penalesLocal?: number; penalesVisitante?: number }
  | { tipo: 'gol'; equipoId: number; jugadorId: number | null; autogol: boolean }
  | { tipo: 'anular'; eventoId: number }
  | { tipo: 'reprogramar'; hora?: string; canchaId?: number }

/** Los errores de las RPC ya vienen en español (§3.4); se traducen solo los de red. */
function mensajeError(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : ''
  if (/fetch|network/i.test(mensaje)) return 'Sin conexión. Revisa la señal e intenta de nuevo.'
  return mensaje || 'No se pudo completar la acción. Intenta de nuevo.'
}

async function ejecutar(partidoId: number, accion: Accion): Promise<void> {
  switch (accion.tipo) {
    case 'iniciar': {
      const { error } = await supabase.rpc('iniciar_partido', { p_id: partidoId })
      if (error) throw error
      return
    }
    case 'medio_tiempo': {
      const { error } = await supabase.rpc('medio_tiempo', { p_id: partidoId })
      if (error) throw error
      return
    }
    case 'segundo_tiempo': {
      const { error } = await supabase.rpc('iniciar_segundo_tiempo', { p_id: partidoId })
      if (error) throw error
      return
    }
    case 'finalizar': {
      const { error } = await supabase.rpc('finalizar_partido', {
        p_id: partidoId,
        ...(accion.penalesLocal !== undefined && { p_penales_local: accion.penalesLocal }),
        ...(accion.penalesVisitante !== undefined && { p_penales_visitante: accion.penalesVisitante }),
      })
      if (error) throw error
      return
    }
    case 'gol': {
      const { error } = await supabase.rpc('registrar_gol', {
        p_partido: partidoId,
        p_equipo: accion.equipoId,
        ...(accion.jugadorId !== null && { p_jugador: accion.jugadorId }),
        p_autogol: accion.autogol,
      })
      if (error) throw error
      return
    }
    case 'reprogramar': {
      // La base valida cancha activa/tipo/cancha fija y recalcula las horas estimadas (migración 08).
      const { error } = await supabase.rpc('reprogramar_partido', {
        p_id: partidoId,
        ...(accion.hora !== undefined && { p_hora: accion.hora }),
        ...(accion.canchaId !== undefined && { p_cancha: accion.canchaId }),
      })
      if (error) throw error
      return
    }
    case 'anular': {
      // Anular = borrar el evento; el marcador lo recalcula la base (§3.3).
      const { data, error } = await supabase.from('eventos').delete().eq('id', accion.eventoId).select('id')
      if (error) throw error
      if (data.length === 0) throw new Error('No se pudo anular el gol (ya no existe o no tienes permiso).')
      return
    }
  }
}

/**
 * Acciones del admin sobre un partido (§4.2). Una a la vez: mientras una responde, `pendiente`
 * indica cuál, para deshabilitar los botones y evitar dobles toques.
 */
export function useAccionesPartido(partidoId: number) {
  const queryClient = useQueryClient()
  // Seguro contra dobles toques: isPending se refleja en la UI un instante después del primer toque.
  const enCurso = useRef(false)
  const mutacion = useMutation({
    mutationFn: (accion: Accion) => ejecutar(partidoId, accion),
    onSuccess: () => {
      // Safari (iOS) no tiene vibrate aunque los tipos digan que sí.
      if ('vibrate' in navigator) navigator.vibrate(40)
      void queryClient.invalidateQueries({ queryKey: ['partido', partidoId] })
      void queryClient.invalidateQueries({ queryKey: ['partidos'] })
      void queryClient.invalidateQueries({ queryKey: ['posiciones'] })
      void queryClient.invalidateQueries({ queryKey: ['goleadores'] })
    },
    onError: (error) => {
      toast.error(mensajeError(error))
    },
  })
  return {
    /** Ejecuta la acción; `alTerminar` solo corre si salió bien (los errores van al toast). */
    ejecutar: (accion: Accion, alTerminar?: () => void) => {
      if (enCurso.current) return
      enCurso.current = true
      mutacion.mutate(accion, {
        onSuccess: alTerminar,
        onSettled: () => {
          enCurso.current = false
        },
      })
    },
    pendiente: mutacion.isPending ? mutacion.variables : undefined,
  }
}

/** Jugadores de los dos equipos del partido (para elegir quién hizo el gol). */
export function useJugadoresPartido(localId: number | null, visitanteId: number | null) {
  const ids = [localId, visitanteId].filter((id): id is number => id !== null)
  return useQuery({
    queryKey: ['jugadores-partido', ...ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jugadores')
        .select('id, nombre, numero, equipo_id')
        .in('equipo_id', ids)
        .order('numero', { nullsFirst: false })
        .order('nombre')
      if (error) throw error
      return data
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
  })
}
