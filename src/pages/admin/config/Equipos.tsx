import { useOutletContext } from 'react-router'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

// Fase 3, paso 6: se completa en ese paso.
export default function Equipos() {
  const { torneo } = useOutletContext<ContextoConfig>()
  return (
    <section className="flex flex-col gap-2">
      <title>Equipos y jugadores · Intercolonias Chita</title>
      <h1 className="text-4xl">Equipos y jugadores</h1>
      <p className="text-muted-foreground">{torneo ? torneo.nombre : 'Aún no hay torneos.'} · Esta sección llega en el paso 6.</p>
    </section>
  )
}
