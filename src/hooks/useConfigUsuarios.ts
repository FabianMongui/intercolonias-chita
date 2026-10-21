import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'

const CLAVES = ['usuarios-config', 'perfil']

/** Perfiles de todos los usuarios del panel (RLS: solo el super admin los ve todos). */
async function obtenerUsuarios() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo, cancha_id, cancha:canchas(nombre)')
    .order('rol', { ascending: false })
    .order('nombre')
  if (error) throw error
  return data
}

export type UsuarioConfig = Awaited<ReturnType<typeof obtenerUsuarios>>[number]

export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios-config'], queryFn: obtenerUsuarios })
}

export interface DatosUsuario {
  nombre: string | null
  rol: 'admin' | 'super_admin'
  activo: boolean
  cancha_id: number | null
}

export function useMutacionesUsuarios() {
  const editar = useMutacionConfig(async ({ id, datos }: { id: string; datos: Partial<DatosUsuario> }) => {
    const { data, error } = await supabase.from('perfiles').update(datos).eq('id', id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo guardar el usuario.')
  }, CLAVES)
  return { editar }
}
