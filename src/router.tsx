import { createBrowserRouter } from 'react-router'
import { ErrorRaiz, ErrorRuta } from '@/components/layout/ErrorRuta'
import { Layout, LayoutCargando } from '@/components/layout/Layout'
import { AdminCargando } from '@/pages/admin/AdminCargando'

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
        ],
      },
    ],
  },
  // Panel de administración: layout propio (sin la navegación pública), todo en diferido.
  {
    path: '/admin/login',
    errorElement: <ErrorRaiz />,
    hydrateFallbackElement: <AdminCargando />,
    lazy: async () => ({ Component: (await import('@/pages/admin/Login')).default }),
  },
  {
    path: '/admin',
    errorElement: <ErrorRaiz />,
    hydrateFallbackElement: <AdminCargando />,
    lazy: async () => ({ Component: (await import('@/pages/admin/AdminLayout')).default }),
    children: [
      {
        errorElement: <ErrorRuta />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/admin/ControlPartidos')).default }),
          },
          {
            path: 'partido/:id',
            lazy: async () => ({ Component: (await import('@/pages/admin/ControlPartido')).default }),
          },
          {
            // Configuración del torneo: solo super admin (el layout lo verifica).
            lazy: async () => ({ Component: (await import('@/pages/admin/config/ConfigLayout')).default }),
            children: [
              {
                path: 'torneo',
                lazy: async () => ({ Component: (await import('@/pages/admin/config/Torneo')).default }),
              },
              {
                path: 'canchas',
                lazy: async () => ({ Component: (await import('@/pages/admin/config/Canchas')).default }),
              },
              {
                path: 'categorias',
                lazy: async () => ({ Component: (await import('@/pages/admin/config/Categorias')).default }),
              },
              {
                path: 'equipos',
                lazy: async () => ({ Component: (await import('@/pages/admin/config/Equipos')).default }),
              },
              {
                path: 'equipos/:id',
                lazy: async () => ({ Component: (await import('@/pages/admin/config/EquipoConfig')).default }),
              },
            ],
          },
          {
            path: 'cuenta',
            lazy: async () => ({ Component: (await import('@/pages/admin/Cuenta')).default }),
          },
        ],
      },
    ],
  },
])
