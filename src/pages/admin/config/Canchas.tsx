import { useOutletContext } from 'react-router'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

// Fase 3, paso 4: se completa en ese paso.
export default function Canchas() {
  const { torneo } = useOutletContext<ContextoConfig>()
  return (
    <section className="flex flex-col gap-2">
      <title>Canchas · Intercolonias Chita</title>
      <h1 className="text-4xl">Canchas</h1>
      <p className="text-muted-foreground">{torneo ? torneo.nombre : 'Aún no hay torneos.'} · Esta sección llega en el paso 4.</p>
    </section>
  )
}
