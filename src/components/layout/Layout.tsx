import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { EncabezadoApp } from '@/components/layout/EncabezadoApp'
import { NavInferior } from '@/components/layout/Navegacion'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { useTiempoReal } from '@/hooks/useTiempoReal'

function Marco({ children }: { children: ReactNode }) {
  return (
    <>
      <EncabezadoApp />
      {/* pb extra en móvil para que la barra inferior no tape el contenido */}
      <main className="mx-auto max-w-screen-lg px-4 pt-6 pb-24 md:pb-10">{children}</main>
      <NavInferior />
      <Toaster />
    </>
  )
}

export function Layout() {
  // Un solo canal de Realtime para toda la app pública (§3.7).
  useTiempoReal()
  return (
    <Marco>
      <Outlet />
    </Marco>
  )
}

/** Se ve mientras baja el código de una ruta diferida al abrirla directamente. */
export function LayoutCargando() {
  return (
    <Marco>
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-full" />
      </div>
    </Marco>
  )
}

/** Error que ocurre fuera de las páginas (por ejemplo, una ruta que no existe). */
export function LayoutError({ children }: { children: ReactNode }) {
  return <Marco>{children}</Marco>
}
