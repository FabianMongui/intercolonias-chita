import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

async function obtenerPerfil(id: string) {
  // RLS: cada usuario solo ve su propio perfil (el super admin ve todos).
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo, cancha_id, cancha:canchas(id, nombre)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export type Perfil = NonNullable<Awaited<ReturnType<typeof obtenerPerfil>>>

/** Perfil del usuario con sesión (rol, si está activo y su cancha sugerida). */
export function usePerfil(userId: string | undefined) {
  return useQuery({
    queryKey: ['perfil', userId],
    queryFn: () => obtenerPerfil(userId ?? ''),
    enabled: userId !== undefined,
  })
}

export const NOMBRE_ROL: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin de cancha',
}
