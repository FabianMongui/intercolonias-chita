import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'

const CLAVES = ['fixture-config', 'grupos-config', 'categorias-config', 'partidos', 'posiciones', 'torneo-activo']

/** Por categoría: grupos, equipos y partidos, para generar o borrar el fixture. */
async function obtenerFixture(torneoId: number) {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, grupos(id, nombre), equipos(id, grupo_id), partidos(id, estado, fase)')
    .eq('torneo_id', torneoId)
    .order('orden')
    .order('id')
  if (error) throw error
  return data.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    grupos: c.grupos.map((g) => ({ ...g, equipos: c.equipos.filter((e) => e.grupo_id === g.id).length })),
    equipos: c.equipos.length,
    sinGrupo: c.equipos.filter((e) => e.grupo_id === null).length,
    partidos: c.partidos.length,
    deGrupos: c.partidos.filter((p) => p.fase === 'grupos').length,
    iniciados: c.partidos.filter((p) => p.estado !== 'programado').length,
  }))
}

export type CategoriaFixture = Awaited<ReturnType<typeof obtenerFixture>>[number]

export function useFixture(torneoId: number | undefined) {
  return useQuery({
    queryKey: ['fixture-config', torneoId],
    queryFn: () => obtenerFixture(torneoId ?? 0),
    enabled: torneoId !== undefined,
  })
}

export function useMutacionesFixture() {
  /** Todos contra todos por grupo y, con 2 grupos, semis, 3er puesto y final (RPC). */
  const generar = useMutacionConfig(async (categoriaId: number) => {
    const { data, error } = await supabase.rpc('generar_partidos_categoria', { p_categoria: categoriaId })
    if (error) throw error
    return data
  }, CLAVES)

  /** Solo si ninguno ha empezado (lo valida la base). */
  const borrar = useMutacionConfig(async (categoriaId: number) => {
    const { data, error } = await supabase.rpc('borrar_partidos_categoria', { p_categoria: categoriaId })
    if (error) throw error
    return data
  }, CLAVES)

  return { generar, borrar }
}
