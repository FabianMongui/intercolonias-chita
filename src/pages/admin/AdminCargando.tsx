import { Skeleton } from '@/components/ui/skeleton'

/** Esqueleto del panel (liviano: lo usan el router, el login y el layout). */
export function AdminCargando() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      {/* Misma franja que el encabezado real: la página no salta al cargar. */}
      <div className="h-[60px] bg-brand" />
      <div className="mx-auto flex max-w-screen-lg flex-col gap-3 px-4 pt-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
