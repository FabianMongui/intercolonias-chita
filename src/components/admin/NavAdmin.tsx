import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'

const SECCIONES = [
  { ruta: '/admin', texto: 'Partidos' },
  { ruta: '/admin/torneo', texto: 'Torneo' },
  { ruta: '/admin/canchas', texto: 'Canchas' },
  { ruta: '/admin/categorias', texto: 'Categorías' },
  { ruta: '/admin/equipos', texto: 'Equipos' },
]

/** "Partidos" abarca la lista (/admin) y el control de cada partido (/admin/partido/:id). */
function estaActiva(ruta: string, pathname: string): boolean {
  if (ruta === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/partido/')
  return pathname === ruta || pathname.startsWith(`${ruta}/`)
}

/** Secciones del panel del super admin (el admin de cancha solo usa Partidos y no ve este menú). */
export function NavAdmin() {
  const { pathname } = useLocation()
  const lista = useRef<HTMLUListElement>(null)
  // En el celular no caben todas: la pestaña activa se desplaza hasta quedar visible.
  useEffect(() => {
    lista.current?.querySelector('[aria-current=page]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [pathname])
  return (
    <nav aria-label="Secciones del panel" className="border-b bg-surface">
      <ul ref={lista} className="mx-auto flex max-w-screen-lg overflow-x-auto px-2 [scrollbar-width:none]">
        {SECCIONES.map(({ ruta, texto }) => {
          const activa = estaActiva(ruta, pathname)
          return (
            <li key={ruta} className="shrink-0">
              <NavLink
                to={ruta}
                aria-current={activa ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 items-center border-b-4 px-3 font-semibold transition-colors focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ring',
                  activa
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {texto}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
