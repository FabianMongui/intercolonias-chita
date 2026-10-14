import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'

const CLAVES = ['grupos-config', 'fixture-config', 'equipos-config', 'equipo-config', 'categorias-config', 'equipos', 'equipo', 'posiciones']

/** Grupos y equipos de una categoría, y si ya hay partidos de grupos (entonces no se cambian). */
async function obtenerBombos(categoriaId: number) {
  const [grupos, equipos, partidos] = await Promise.all([
    supabase.from('grupos').select('id, nombre').eq('categoria_id', categoriaId).order('nombre'),
    supabase.from('equipos').select('id, nombre, escudo_path, grupo_id').eq('categoria_id', categoriaId).order('nombre'),
    supabase
      .from('partidos')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', categoriaId)
      .eq('fase', 'grupos'),
  ])
  if (grupos.error) throw grupos.error
  if (equipos.error) throw equipos.error
  if (partidos.error) throw partidos.error
  return { grupos: grupos.data, equipos: equipos.data, partidosDeGrupos: partidos.count ?? 0 }
}

export type Bombos = Awaited<ReturnType<typeof obtenerBombos>>
export type EquipoBombo = Bombos['equipos'][number]

export function useBombos(categoriaId: number | undefined) {
  return useQuery({
    queryKey: ['grupos-config', categoriaId],
    queryFn: () => obtenerBombos(categoriaId ?? 0),
    enabled: categoriaId !== undefined,
  })
}

/** Primera letra libre: A, B, C… (null si ya están las 26). */
export function siguienteLetra(usadas: string[]): string | null {
  for (let i = 0; i < 26; i++) {
    const letra = String.fromCharCode(65 + i)
    if (!usadas.includes(letra)) return letra
  }
  return null
}

export function useMutacionesGrupos() {
  const crearGrupo = useMutacionConfig(async ({ categoriaId, nombre }: { categoriaId: number; nombre: string }) => {
    const { error } = await supabase.from('grupos').insert({ categoria_id: categoriaId, nombre })
    if (error) throw error
  }, CLAVES)

  /** Sus equipos vuelven a "Sin grupo" (equipos.grupo_id es on delete set null). */
  const borrarGrupo = useMutacionConfig(async (id: number) => {
    const { data, error } = await supabase.from('grupos').delete().eq('id', id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo borrar el grupo.')
  }, CLAVES)

  const moverEquipo = useMutacionConfig(async ({ equipoId, grupoId }: { equipoId: number; grupoId: number | null }) => {
    const { data, error } = await supabase.from('equipos').update({ grupo_id: grupoId }).eq('id', equipoId).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo mover el equipo.')
  }, CLAVES)

  /** Reparte al azar los equipos sin grupo, equilibrando tamaños (RPC). Devuelve cuántos asignó. */
  const sortear = useMutacionConfig(async (categoriaId: number) => {
    const { data, error } = await supabase.rpc('sortear_grupos', { p_categoria: categoriaId })
    if (error) throw error
    return data
  }, CLAVES)

  return { crearGrupo, borrarGrupo, moverEquipo, sortear }
}
