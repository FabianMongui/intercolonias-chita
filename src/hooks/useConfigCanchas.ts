import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'

const CLAVES = ['canchas-config', 'torneo-activo', 'partidos', 'categorias-config']

async function obtenerCanchas(torneoId: number) {
  const { data, error } = await supabase
    .from('canchas')
    .select('id, nombre, tipo, activa, orden, partidos(estado), categorias(nombre)')
    .eq('torneo_id', torneoId)
    .order('orden')
    .order('id')
  if (error) throw error
  // Partidos que todavía se juegan en cada cancha (para avisar antes de cerrarla o borrarla).
  return data.map(({ partidos, categorias, ...c }) => ({
    ...c,
    /** Categorías que la tienen como cancha fija. */
    fijaDe: categorias.map((cat) => cat.nombre),
    pendientes: partidos.filter((p) => p.estado !== 'finalizado').length,
    total: partidos.length,
  }))
}

export type CanchaConfig = Awaited<ReturnType<typeof obtenerCanchas>>[number]

export function useCanchasConfig(torneoId: number | undefined) {
  return useQuery({
    queryKey: ['canchas-config', torneoId],
    queryFn: () => obtenerCanchas(torneoId ?? 0),
    enabled: torneoId !== undefined,
  })
}

export interface DatosCancha {
  nombre: string
  tipo: 'F11' | 'F6'
}

export function useMutacionesCanchas(torneoId: number | undefined) {
  const crear = useMutacionConfig(async ({ datos, orden }: { datos: DatosCancha; orden: number }) => {
    if (torneoId === undefined) throw new Error('Primero elige un torneo.')
    const { error } = await supabase.from('canchas').insert({ ...datos, orden, torneo_id: torneoId })
    if (error) throw error
  }, CLAVES)
  const editar = useMutacionConfig(async ({ id, datos }: { id: number; datos: Partial<DatosCancha> & { activa?: boolean } }) => {
    const { error } = await supabase.from('canchas').update(datos).eq('id', id)
    if (error) throw error
  }, CLAVES)
  /** Guarda el nuevo orden (posición en la lista = `orden`). */
  const reordenar = useMutacionConfig(async (ids: number[]) => {
    const resultados = await Promise.all(ids.map((id, orden) => supabase.from('canchas').update({ orden }).eq('id', id)))
    const fallo = resultados.find((r) => r.error)
    if (fallo?.error) throw fallo.error
  }, CLAVES)
  const borrar = useMutacionConfig(async (id: number) => {
    const { data, error } = await supabase.from('canchas').delete().eq('id', id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo borrar la cancha (no existe o no tienes permiso).')
  }, CLAVES)
  return {
    crear,
    editar,
    reordenar,
    borrar,
    ocupado: crear.isPending || editar.isPending || reordenar.isPending || borrar.isPending,
  }
}
