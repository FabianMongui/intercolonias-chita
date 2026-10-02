import { createBrowserRouter } from 'react-router'
import { ErrorRaiz, ErrorRuta } from '@/components/layout/ErrorRuta'
import { Layout, LayoutCargando } from '@/components/layout/Layout'
import Inicio from '@/pages/publico/Inicio'

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
          { index: true, Component: Inicio },
          {
            path: 'admin',
            lazy: async () => ({ Component: (await import('@/pages/admin/Admin')).default }),
          },
        ],
      },
    ],
  },
])
