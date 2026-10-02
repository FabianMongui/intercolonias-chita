import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { EncabezadoApp } from '@/components/layout/EncabezadoApp'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'

function Marco({ children }: { children: ReactNode }) {
  return (
    <>
      <EncabezadoApp />
      <main className="mx-auto max-w-screen-sm px-4 py-6">{children}</main>
      <Toaster />
    </>
  )
}

export function Layout() {
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
