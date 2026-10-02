import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'

// Placeholder de la Fase 0: solo comprueba tokens, tipografía y componentes base.
export default function App() {
  return (
    <>
      <header className="bg-brand text-brand-foreground">
        <div className="mx-auto max-w-screen-sm px-4 py-3">
          <h1 className="text-4xl">Intercolonias Chita</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-screen-sm flex-col gap-4 p-4">
        <p className="text-muted-foreground">Base de diseño lista. Las pantallas llegan en la Fase 1.</p>
        <p className="marcador text-6xl">
          2 - 1
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              toast.success('Todo listo')
            }}
          >
            Probar aviso
          </Button>
          <Button variant="accent">Acento</Button>
          <Button variant="outline">Secundario</Button>
        </div>
        <Skeleton className="h-16 w-full" />
      </main>
      <Toaster />
    </>
  )
}
