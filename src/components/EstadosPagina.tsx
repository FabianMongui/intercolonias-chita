import { RefreshCw, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type Nivel = 'h1' | 'h2' | 'h3'

/**
 * Error al cargar datos, con botón para reintentar. Por defecto ocupa la página entera (h1 y
 * título de pestaña); dentro de una sección, el nivel siguiente al de su título.
 */
export function ErrorDatos({
  reintentar,
  reintentando,
  mensaje = 'No pudimos cargar la información',
  nivel = 'h1',
}: {
  reintentar: () => void
  reintentando: boolean
  mensaje?: string
  nivel?: Nivel
}) {
  const Titulo = nivel
  return (
    <section className="flex flex-col items-start gap-4">
      {nivel === 'h1' && <title>{`${mensaje} · Intercolonias Chita`}</title>}
      <Titulo className={nivel === 'h1' ? 'text-4xl' : nivel === 'h2' ? 'text-3xl' : 'text-xl'}>{mensaje}</Titulo>
      <p role="alert" className="text-muted-foreground">
        Revisa tu conexión e intenta de nuevo.
      </p>
      <Button onClick={reintentar} disabled={reintentando}>
        <RefreshCw aria-hidden />
        {reintentando ? 'Reintentando…' : 'Reintentar'}
      </Button>
    </section>
  )
}

export function SinTorneo() {
  return (
    <section className="flex flex-col items-start gap-3">
      <title>Sin torneo activo · Intercolonias Chita</title>
      <Trophy aria-hidden className="size-10 text-gold-foreground" />
      <h1 className="text-4xl">No hay un torneo activo</h1>
      <p className="text-muted-foreground">Cuando se publique el próximo torneo aparecerá aquí.</p>
    </section>
  )
}

/** Página para un equipo o partido que no existe. */
export function NoEncontrado({ que, volver }: { que: string; volver: ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-4">
      <title>{`${que} no encontrado · Intercolonias Chita`}</title>
      <h1 className="text-4xl">{`${que} no encontrado`}</h1>
      {volver}
    </section>
  )
}

/** Mensaje corto para secciones sin datos. */
export function Vacio({ children }: { children: string }) {
  return <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">{children}</p>
}
