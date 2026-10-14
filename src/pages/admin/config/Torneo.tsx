import { useOutletContext } from 'react-router'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

// Fase 3, paso 3: se completa en ese paso.
export default function Torneo() {
  const { torneo } = useOutletContext<ContextoConfig>()
  return (
    <section className="flex flex-col gap-2">
      <title>Torneo · Intercolonias Chita</title>
      <h1 className="text-4xl">Torneo</h1>
      <p className="text-muted-foreground">{torneo ? torneo.nombre : 'Aún no hay torneos.'} · Esta sección llega en el paso 3.</p>
    </section>
  )
}
