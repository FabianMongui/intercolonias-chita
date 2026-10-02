import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Un solo reintento rápido: en la cancha es mejor mostrar el error pronto y dejar reintentar.
      retry: 1,
      retryDelay: 1_500,
      refetchOnWindowFocus: true,
    },
  },
})
