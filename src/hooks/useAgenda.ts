import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'

const CLAVES = ['agenda-config', 'fixture-config', 'canchas-config', 'partidos', 'posiciones', 'torneo-activo']

/** Todo lo que muestra y edita la agenda del torneo en edición, más sus advertencias (§4.2 super admin 6). */
async function obtenerAgenda(torneoId: number) {
  const [categorias, canchas, partidos, advertencias] = await Promise.all([
    supabase
      .from('categorias')
      .select('id, nombre, tipo_cancha, cancha_fija_id, grupos(id, nombre), equipos(id, nombre, grupo_id)')
      .eq('torneo_id', torneoId)
      .order('orden')
      .order('id'),
    supabase.from('canchas').select('id, nombre, tipo, activa').eq('torneo_id', torneoId).order('orden').order('id'),
    supabase
      .from('partidos')
      .select(
        `id, categoria_id, grupo_id, fase, ronda, etiqueta, estado, hora_programada, hora_estimada, cancha_id,
         equipo_local_id, equipo_visitante_id, ref_local, ref_visitante, goles_local, goles_visitante,
         grupo:grupos(nombre), categoria:categorias!inner(torneo_id),
         local:equipos!partidos_equipo_local_id_fkey(nombre),
         visitante:equipos!partidos_equipo_visitante_id_fkey(nombre)`,
      )
      .eq('categoria.torneo_id', torneoId)
      .order('hora_programada', { nullsFirst: true })
      .order('id'),
    supabase.rpc('advertencias_torneo', { p_torneo: torneoId }),
  ])
  if (categorias.error) throw categorias.error
  if (canchas.error) throw canchas.error
  if (partidos.error) throw partidos.error
  if (advertencias.error) throw advertencias.error
  return {
    categorias: categorias.data,
    canchas: canchas.data,
    partidos: partidos.data,
    advertencias: advertencias.data,
  }
}

export type Agenda = Awaited<ReturnType<typeof obtenerAgenda>>
export type PartidoAgenda = Agenda['partidos'][number]
export type CategoriaAgenda = Agenda['categorias'][number]
export type CanchaAgenda = Agenda['canchas'][number]

export function useAgenda(torneoId: number | undefined) {
  return useQuery({
    queryKey: ['agenda-config', torneoId],
    queryFn: () => obtenerAgenda(torneoId ?? 0),
    enabled: torneoId !== undefined,
  })
}

export interface CambiosPartido {
  /** Solo lo que cambió. */
  hora?: string
  canchaId?: number
  equipos?: { local: number | null; visitante: number | null }
}

export interface NuevoPartido {
  categoria_id: number
  fase: string
  grupo_id: number | null
  etiqueta: string | null
  equipo_local_id: number | null
  equipo_visitante_id: number | null
  cancha_id: number | null
  hora_programada: string | null
}

export function useMutacionesAgenda() {
  /** Hora, cancha y equipos en una sola operación: la base valida todo y recalcula horas estimadas (migración 18). */
  const editar = useMutacionConfig(async ({ id, cambios }: { id: number; cambios: CambiosPartido }) => {
    // Los argumentos sin valor quedan en null en la base (por ejemplo, equipo por definir).
    const { error } = await supabase.rpc('editar_partido', {
      p_id: id,
      ...(cambios.hora != null && { p_hora: cambios.hora }),
      ...(cambios.canchaId != null && { p_cancha: cambios.canchaId }),
      ...(cambios.equipos && {
        p_cambiar_equipos: true,
        ...(cambios.equipos.local != null && { p_local: cambios.equipos.local }),
        ...(cambios.equipos.visitante != null && { p_visitante: cambios.equipos.visitante }),
      }),
    })
    if (error) throw error
  }, CLAVES)

  /** La base valida grupo, equipos y cancha (migración 18). */
  const crear = useMutacionConfig(async (nuevo: NuevoPartido) => {
    const { error } = await supabase.rpc('crear_partido', {
      p_categoria: nuevo.categoria_id,
      p_fase: nuevo.fase,
      ...(nuevo.grupo_id != null && { p_grupo: nuevo.grupo_id }),
      ...(nuevo.etiqueta != null && { p_etiqueta: nuevo.etiqueta }),
      ...(nuevo.equipo_local_id != null && { p_local: nuevo.equipo_local_id }),
      ...(nuevo.equipo_visitante_id != null && { p_visitante: nuevo.equipo_visitante_id }),
      ...(nuevo.cancha_id != null && { p_cancha: nuevo.cancha_id }),
      ...(nuevo.hora_programada != null && { p_hora: nuevo.hora_programada }),
    })
    if (error) throw error
  }, CLAVES)

  const borrar = useMutacionConfig(async (id: number) => {
    const { data, error } = await supabase.from('partidos').delete().eq('id', id).eq('estado', 'programado').select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('Solo se puede borrar un partido que no ha iniciado.')
  }, CLAVES)

  return { editar, crear, borrar }
}
