import { useQuery } from '@tanstack/react-query'
import type { TipoCancha } from '@/components/admin/SelectorTipoCancha'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'

const CLAVES = ['agenda-config', 'categorias-config', 'fixture-config', 'grupos-config', 'torneo-activo', 'partidos']

async function obtenerCategorias(torneoId: number) {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, tipo_cancha, cancha_fija_id, minutos_por_tiempo, minutos_descanso, orden, equipos(id), grupos(id), partidos(id)')
    .eq('torneo_id', torneoId)
    .order('orden')
    .order('id')
  if (error) throw error
  // Conteos solo para mostrar y para la confirmación de borrado.
  return data.map(({ equipos, grupos, partidos, ...c }) => ({
    ...c,
    equipos: equipos.length,
    grupos: grupos.length,
    partidos: partidos.length,
  }))
}

export type CategoriaConfig = Awaited<ReturnType<typeof obtenerCategorias>>[number]

export function useCategoriasConfig(torneoId: number | undefined) {
  return useQuery({
    queryKey: ['categorias-config', torneoId],
    queryFn: () => obtenerCategorias(torneoId ?? 0),
    enabled: torneoId !== undefined,
  })
}

export interface DatosCategoria {
  nombre: string
  tipo_cancha: TipoCancha
  cancha_fija_id: number | null
  minutos_por_tiempo: number
  minutos_descanso: number
}

export function useMutacionesCategorias(torneoId: number | undefined) {
  const crear = useMutacionConfig(async ({ datos, orden }: { datos: DatosCategoria; orden: number }) => {
    if (torneoId === undefined) throw new Error('Primero elige un torneo.')
    const { error } = await supabase.from('categorias').insert({ ...datos, orden, torneo_id: torneoId })
    if (error) throw error
  }, CLAVES)
  const editar = useMutacionConfig(async ({ id, datos }: { id: number; datos: DatosCategoria }) => {
    const { error } = await supabase.from('categorias').update(datos).eq('id', id)
    if (error) throw error
  }, CLAVES)
  const reordenar = useMutacionConfig(async (ids: number[]) => {
    const resultados = await Promise.all(ids.map((id, orden) => supabase.from('categorias').update({ orden }).eq('id', id)))
    const fallo = resultados.find((r) => r.error)
    if (fallo?.error) throw fallo.error
  }, CLAVES)
  const borrar = useMutacionConfig(async (id: number) => {
    const { data, error } = await supabase.from('categorias').delete().eq('id', id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo borrar la categoría (no existe o no tienes permiso).')
  }, CLAVES)
  return {
    crear,
    editar,
    reordenar,
    borrar,
    ocupado: crear.isPending || editar.isPending || reordenar.isPending || borrar.isPending,
  }
}
