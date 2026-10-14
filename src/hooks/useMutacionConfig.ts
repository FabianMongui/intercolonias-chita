import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mensajeError } from '@/lib/errores'

/**
 * Mutación de configuración (super admin): al terminar refresca las consultas indicadas
 * (por prefijo de queryKey), salga bien o mal, y muestra los errores de la base en un aviso.
 */
export function useMutacionConfig<V, R = void>(fn: (variables: V) => Promise<R>, claves: string[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    // 'all': también las pantallas que no están abiertas, para que al volver no se vean datos viejos.
    // También si falla: una operación a medias (p. ej. reordenar) no debe dejar la pantalla vieja.
    onSettled: () => {
      for (const clave of claves) void queryClient.invalidateQueries({ queryKey: [clave], refetchType: 'all' })
    },
    onError: (error) => {
      toast.error(mensajeError(error))
    },
  })
}
