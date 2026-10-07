import { useQueryClient } from '@tanstack/react-query'
import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type FilaPartido = Database['public']['Tables']['partidos']['Row']
type FilaEvento = Database['public']['Tables']['eventos']['Row']

/**
 * Si el canal no queda listo en este tiempo, se pasa a consultar periódicamente (§3.7). Es menor
 * que el timeout del join con `wait: true` (~15 s) a propósito: el polling se detiene solo cuando
 * el canal termina quedando SUBSCRIBED.
 */
const ESPERA_SUSCRIPCION_MS = 10_000
const INTERVALO_POLLING_MS = 20_000
/** Agrupa ráfagas (al iniciar/finalizar un partido la base recalcula varias horas estimadas). */
const RETARDO_INVALIDACION_MS = 250

/** Cada conexión usa un tópico propio: el canal anterior puede seguir "saliendo" y
 * `supabase.channel()` devolvería ese mismo objeto si el nombre se repite. */
let conexiones = 0

type Clave = 'partidos' | 'partido' | 'posiciones' | 'goleadores'

/** Estado visible en `<html data-tiempo-real>` para diagnóstico y pruebas (no afecta la UI). */
function marcarEstado(estado: 'conectando' | 'conectado' | 'polling' | 'pausado') {
  document.documentElement.dataset.tiempoReal = estado
}

/**
 * Un solo canal de Realtime para la parte pública: escucha `partidos` y `eventos` y refresca
 * las consultas afectadas de TanStack Query. Si el canal no queda `SUBSCRIBED` o se cae, consulta
 * cada 20 s. Con la pestaña oculta se cierra todo (límite de conexiones del plan free).
 *
 * Los cambios no se aplican a mano en la caché: los payloads no traen las relaciones ni las
 * columnas calculadas (`ganador`), así que se vuelve a pedir a la base.
 */
export function useTiempoReal() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let canal: RealtimeChannel | null = null
    let polling: number | undefined
    let esperaSuscripcion: number | undefined
    let pendientes = new Set<Clave>()
    const partidosPendientes = new Set<number>()
    let temporizador: number | undefined

    const invalidar = (claves: Clave[], partidoId?: number) => {
      for (const c of claves) pendientes.add(c)
      if (partidoId !== undefined) partidosPendientes.add(partidoId)
      window.clearTimeout(temporizador)
      temporizador = window.setTimeout(() => {
        const lote = pendientes
        pendientes = new Set()
        // ['partido'] sin id refresca todos los detalles abiertos (p. ej. un gol anulado:
        // el DELETE solo trae el id del evento). Si no, solo los partidos que cambiaron.
        for (const clave of lote) void queryClient.invalidateQueries({ queryKey: [clave] })
        if (!lote.has('partido')) {
          for (const id of partidosPendientes) void queryClient.invalidateQueries({ queryKey: ['partido', id] })
        }
        partidosPendientes.clear()
      }, RETARDO_INVALIDACION_MS)
    }

    const refrescarTodo = () => {
      invalidar(['partidos', 'partido', 'posiciones', 'goleadores'])
    }

    const iniciarPolling = () => {
      marcarEstado('polling')
      if (polling !== undefined) return
      polling = window.setInterval(refrescarTodo, INTERVALO_POLLING_MS)
    }
    const detenerPolling = () => {
      window.clearInterval(polling)
      polling = undefined
    }

    const conectar = () => {
      if (canal) return
      marcarEstado('conectando')
      const nuevo: RealtimeChannel = supabase
        .channel(`publico-${String(++conexiones)}`, { config: { postgres_changes_options: { wait: true } } })
        .on<FilaPartido>('postgres_changes', { event: '*', schema: 'public', table: 'partidos' }, (cambio) => {
          const id = 'id' in cambio.new ? cambio.new.id : 'id' in cambio.old ? cambio.old.id : undefined
          invalidar(['partidos', 'posiciones', 'goleadores'], id)
        })
        .on<FilaEvento>('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, (cambio) => {
          // INSERT/UPDATE traen partido_id; un DELETE solo trae el id del evento. El trigger del
          // marcador también actualiza `partidos` (y ese aviso trae el id), así que invalidar todos los
          // detalles en un DELETE es solo un respaldo barato.
          const partidoId = 'partido_id' in cambio.new ? cambio.new.partido_id : undefined
          if (typeof partidoId === 'number') invalidar(['goleadores'], partidoId)
          else invalidar(['goleadores', 'partido'])
        })
        .subscribe((estado) => {
          // Avisos de un canal ya cerrado por nosotros (pestaña oculta): no reactivar nada.
          if (canal !== nuevo) return
          if (estado === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            window.clearTimeout(esperaSuscripcion)
            detenerPolling()
            marcarEstado('conectado')
            // Lo que pasó mientras no había canal.
            refrescarTodo()
          } else {
            iniciarPolling()
          }
        })
      canal = nuevo
      esperaSuscripcion = window.setTimeout(iniciarPolling, ESPERA_SUSCRIPCION_MS)
    }

    const desconectar = () => {
      marcarEstado('pausado')
      window.clearTimeout(esperaSuscripcion)
      detenerPolling()
      if (canal) {
        // Se suelta la referencia ANTES de cerrar: el aviso CLOSED de este canal (inmediato si el
        // socket no está abierto, o cuando el servidor confirma la salida) no debe reactivar nada.
        const cerrar = canal
        canal = null
        void supabase.removeChannel(cerrar)
      }
    }

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') conectar()
      else desconectar()
    }

    if (document.visibilityState === 'visible') conectar()
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      window.clearTimeout(temporizador)
      desconectar()
    }
  }, [queryClient])
}
