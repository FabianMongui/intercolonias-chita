import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, LogOut, UserRound } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { ErrorDatos } from '@/components/EstadosPagina'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { NOMBRE_ROL, type Perfil, usePerfil } from '@/hooks/usePerfil'
import { useSesion } from '@/hooks/useSesion'
import { useTiempoReal } from '@/hooks/useTiempoReal'
import { supabase } from '@/lib/supabase'
import { AdminCargando } from '@/pages/admin/AdminCargando'

// Ícono con texto debajo en móvil y al lado desde sm: al sol el ícono solo no se entiende.
const ENLACE_ENCABEZADO =
  'inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-md px-2 text-xs font-semibold hover:bg-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-foreground sm:flex-row sm:gap-1.5 sm:text-sm'

/** Cierra la sesión y limpia lo que dependía de ella. */
function useCerrarSesion() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [cerrando, setCerrando] = useState(false)
  const cerrar = async () => {
    setCerrando(true)
    await supabase.auth.signOut()
    queryClient.removeQueries({ queryKey: ['perfil'] })
    setCerrando(false)
    void navigate('/admin/login', { replace: true })
  }
  return { cerrar, cerrando }
}

function Encabezado({ perfil }: { perfil?: Perfil }) {
  const { cerrar, cerrando } = useCerrarSesion()
  return (
    <header className="bg-brand text-brand-foreground">
      <div className="mx-auto flex max-w-screen-lg items-center justify-between gap-2 px-4 py-2">
        <Link
          to="/admin"
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-foreground"
        >
          <img src="/assets/Chita.png" alt="" width={40} height={40} className="size-10 shrink-0 object-contain" />
          <span className="flex min-w-0 flex-col">
            <span className="font-display text-2xl leading-none">Panel</span>
            {perfil && <span className="truncate text-sm">{NOMBRE_ROL[perfil.rol] ?? perfil.rol}</span>}
          </span>
        </Link>
        <nav aria-label="Cuenta" className="flex shrink-0 items-center">
          <Link to="/" className={ENLACE_ENCABEZADO}>
            <ExternalLink aria-hidden className="size-5" />
            <span>Ver sitio</span>
          </Link>
          {perfil && (
            <Link to="/admin/cuenta" className={ENLACE_ENCABEZADO}>
              <UserRound aria-hidden className="size-5" />
              <span>Mi cuenta</span>
            </Link>
          )}
          <button
            type="button"
            className={ENLACE_ENCABEZADO}
            disabled={cerrando}
            onClick={() => {
              void cerrar()
            }}
          >
            <LogOut aria-hidden className="size-5" />
            <span>Salir</span>
          </button>
        </nav>
      </div>
    </header>
  )
}

function Marco({ perfil, children }: { perfil?: Perfil; children: ReactNode }) {
  return (
    <>
      <Encabezado perfil={perfil} />
      <main className="mx-auto max-w-screen-lg px-4 pt-6 pb-10">{children}</main>
      <Toaster />
    </>
  )
}

/** Ruta protegida del panel: exige sesión y perfil activo (§4.2). */
export default function AdminLayout() {
  // Los admins también ven los cambios de otras canchas al instante.
  useTiempoReal()
  const { cargando, sesion } = useSesion()
  const location = useLocation()
  const perfilQ = usePerfil(sesion?.user.id)

  if (cargando) return <AdminCargando />
  if (!sesion) {
    const volver = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/admin/login?volver=${volver}`} replace />
  }
  if (perfilQ.isPending) return <AdminCargando />
  if (perfilQ.isError) {
    return (
      <Marco>
        <ErrorDatos reintentar={() => void perfilQ.refetch()} reintentando={perfilQ.isRefetching} />
      </Marco>
    )
  }
  const perfil = perfilQ.data
  if (!perfil?.activo) {
    return (
      <Marco>
        <section className="flex flex-col items-start gap-3">
          <title>Cuenta inactiva · Intercolonias Chita</title>
          <h1 className="text-4xl">Tu cuenta aún no está activa</h1>
          <p className="text-muted-foreground">
            Pídele al super admin del torneo que la active. Cuando lo haga, toca “Revisar de nuevo”.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void perfilQ.refetch()} disabled={perfilQ.isRefetching}>
              {perfilQ.isRefetching ? 'Revisando…' : 'Revisar de nuevo'}
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Ir al sitio público</Link>
            </Button>
          </div>
        </section>
      </Marco>
    )
  }

  return (
    <Marco perfil={perfil}>
      <Outlet context={perfil} />
    </Marco>
  )
}
