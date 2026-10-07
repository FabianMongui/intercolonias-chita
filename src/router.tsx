import { createBrowserRouter } from 'react-router'
import { ErrorRaiz, ErrorRuta } from '@/components/layout/ErrorRuta'
import { Layout, LayoutCargando } from '@/components/layout/Layout'

// Cada página se descarga aparte: la primera visita solo baja la que se abre.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    errorElement: <ErrorRaiz />,
    hydrateFallbackElement: <LayoutCargando />,
    children: [
      {
        // Los errores de una página se muestran dentro del Layout, con el encabezado.
        errorElement: <ErrorRuta />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/publico/EnVivo')).default }),
          },
          {
            path: 'partidos',
            lazy: async () => ({ Component: (await import('@/pages/publico/Partidos')).default }),
          },
          {
            path: 'tablas',
            lazy: async () => ({ Component: (await import('@/pages/publico/Tablas')).default }),
          },
          {
            path: 'equipos',
            lazy: async () => ({ Component: (await import('@/pages/publico/Equipos')).default }),
          },
          {
            path: 'equipos/:id',
            lazy: async () => ({ Component: (await import('@/pages/publico/Equipo')).default }),
          },
          {
            path: 'partido/:id',
            lazy: async () => ({ Component: (await import('@/pages/publico/Partido')).default }),
          },
          {
            path: 'admin',
            lazy: async () => ({ Component: (await import('@/pages/admin/Admin')).default }),
          },
        ],
      },
    ],
  },
])
