import { useOutletContext } from 'react-router'
import type { Perfil } from '@/hooks/usePerfil'

// Paso 3 de la Fase 2: lista de partidos por cancha. Por ahora solo confirma el acceso.
export default function ControlPartidos() {
  const perfil = useOutletContext<Perfil>()
  return (
    <section className="flex flex-col gap-2">
      <title>Control de partidos · Intercolonias Chita</title>
      <h1 className="text-4xl">Control de partidos</h1>
      <p className="text-muted-foreground">
        Hola, {perfil.nombre ?? 'admin'}. La lista de partidos por cancha llega en el siguiente paso.
      </p>
    </section>
  )
}
