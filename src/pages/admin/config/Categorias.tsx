import { useOutletContext } from 'react-router'
import type { ContextoConfig } from '@/pages/admin/config/ConfigLayout'

// Fase 3, paso 5: se completa en ese paso.
export default function Categorias() {
  const { torneo } = useOutletContext<ContextoConfig>()
  return (
    <section className="flex flex-col gap-2">
      <title>Categorías · Intercolonias Chita</title>
      <h1 className="text-4xl">Categorías</h1>
      <p className="text-muted-foreground">{torneo ? torneo.nombre : 'Aún no hay torneos.'} · Esta sección llega en el paso 5.</p>
    </section>
  )
}
