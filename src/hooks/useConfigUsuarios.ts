import { FunctionsHttpError } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'

const CLAVES = ['usuarios-config', 'usuarios-correos', 'perfil']

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

/**
 * Llama a la Edge Function admin-usuarios, la única que usa la secret key (crear, borrar, contraseñas, correos).
 * La función verifica que quien llama sea super admin; aquí solo se traduce su mensaje de error.
 */
async function invocar<T>(accion: string, datos: Record<string, unknown> = {}): Promise<T> {
  const respuesta = await supabase.functions.invoke<T>('admin-usuarios', { body: { accion, ...datos } })
  const data = respuesta.data
  const error: unknown = respuesta.error
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const cuerpo = (await (error.context as Response).json().catch(() => null)) as { error?: string } | null
      throw new Error(cuerpo?.error ?? 'No se pudo completar la acción.')
    }
    throw new Error('Sin conexión con el servidor. Intenta de nuevo.')
  }
  if (data === null) throw new Error('Respuesta vacía del servidor.')
  return data
}

/** Correo de cada usuario (viven en Auth, no en perfiles). */
export function useCorreos() {
  return useQuery({
    queryKey: ['usuarios-correos'],
    queryFn: async () => (await invocar<{ correos: Record<string, string> }>('correos')).correos,
    retry: 1,
  })
}

export interface DatosUsuario {
  nombre: string | null
  rol: 'admin' | 'super_admin'
  activo: boolean
  cancha_id: number | null
}

export interface NuevoUsuario {
  nombre: string
  correo: string
  rol: 'admin' | 'super_admin'
  cancha_id: number | null
}

export function useMutacionesUsuarios() {
  const editar = useMutacionConfig(async ({ id, datos }: { id: string; datos: Partial<DatosUsuario> }) => {
    const { data, error } = await supabase.from('perfiles').update(datos).eq('id', id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo guardar el usuario.')
  }, CLAVES)

  /** Devuelve la contraseña temporal (se muestra una sola vez). */
  const crear = useMutacionConfig(
    (nuevo: NuevoUsuario) => invocar<{ correo: string; contrasena: string }>('crear', { ...nuevo }),
    CLAVES,
  )

  const restablecer = useMutacionConfig(
    async (id: string) => (await invocar<{ contrasena: string }>('restablecer', { id })).contrasena,
    CLAVES,
  )

  const borrar = useMutacionConfig(async (id: string) => {
    await invocar('borrar', { id })
  }, CLAVES)

  return { editar, crear, restablecer, borrar }
}
