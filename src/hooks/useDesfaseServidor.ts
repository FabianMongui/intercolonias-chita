import { useQuery } from '@tanstack/react-query'
import { obtenerDesfaseServidor } from '@/lib/time'

/**
 * Desfase servidor − celular en ms. Se vuelve a medir cada 10 min y al volver a la pestaña,
 * por si el celular ajusta su reloj mientras la página sigue abierta.
 */
export function useDesfaseServidor() {
  return useQuery({
    queryKey: ['desfase-servidor'],
    queryFn: obtenerDesfaseServidor,
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}
