import { CalendarDays, ListOrdered, type LucideIcon, Radio, Shield } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'

interface Destino {
  ruta: string
  texto: string
  icono: LucideIcon
}

const DESTINOS: Destino[] = [
  { ruta: '/', texto: 'En vivo', icono: Radio },
  { ruta: '/partidos', texto: 'Partidos', icono: CalendarDays },
  { ruta: '/tablas', texto: 'Tablas', icono: ListOrdered },
  { ruta: '/equipos', texto: 'Equipos', icono: Shield },
]

/** Conserva la categoría elegida (`?cat=`) al cambiar de sección. */
function useBusquedaCategoria() {
  const [params] = useSearchParams()
  const cat = params.get('cat')
  return cat ? `?cat=${encodeURIComponent(cat)}` : ''
}

/** Barra inferior en móvil (§4.1). */
export function NavInferior() {
  const search = useBusquedaCategoria()
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-screen-sm grid-cols-4">
        {DESTINOS.map(({ ruta, texto, icono: Icono }) => (
          <li key={ruta}>
            <NavLink
              to={{ pathname: ruta, search }}
              end={ruta === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ring',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icono aria-hidden className={cn('size-6', isActive && 'stroke-[2.5]')} />
                  {texto}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Navegación en la barra superior desde tablet/escritorio. */
export function NavSuperior() {
  const search = useBusquedaCategoria()
  return (
    <nav aria-label="Secciones" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {DESTINOS.map(({ ruta, texto }) => (
          <li key={ruta}>
            <NavLink
              to={{ pathname: ruta, search }}
              end={ruta === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center rounded-md px-3 font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-brand-foreground hover:bg-primary',
                )
              }
            >
              {texto}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
