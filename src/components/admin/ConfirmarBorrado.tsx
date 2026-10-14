import { useId, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Confirmación fuerte para borrar (regla 6): explica qué se pierde y exige escribir el nombre.
 * Montarla con `key` distinta en cada apertura para que el campo empiece vacío.
 */
export function ConfirmarBorrado({
  abierto,
  cambiar,
  titulo,
  nombre,
  consecuencias,
  borrar,
}: {
  abierto: boolean
  cambiar: (abierto: boolean) => void
  titulo: string
  /** Texto que hay que escribir para confirmar. */
  nombre: string
  /** Qué se borra junto con esto (una línea por cosa). */
  consecuencias: string[]
  borrar: () => void
}) {
  const id = useId()
  const [escrito, setEscrito] = useState('')
  const coincide = escrito.trim().toLowerCase() === nombre.trim().toLowerCase()

  return (
    <AlertDialog open={abierto} onOpenChange={cambiar}>
      <AlertDialogContent>
        <AlertDialogTitle>{titulo}</AlertDialogTitle>
        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        {consecuencias.length > 0 && (
          <ul className="list-disc pl-5 text-sm font-semibold text-destructive">
            {consecuencias.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor={id}>{`Escribe “${nombre}” para confirmar`}</Label>
          <Input
            id={id}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={escrito}
            onChange={(e) => {
              setEscrito(e.target.value)
            }}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!coincide}
            className="bg-destructive text-destructive-foreground hover:bg-destructive-hover"
            onClick={borrar}
          >
            Borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
