import { Star } from 'lucide-react'

/** Estrellas de títulos (decorativas: el número va al lado y en texto para lectores de pantalla). */
export function Estrellas({ titulos, max = 5 }: { titulos: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5 text-gold" aria-hidden>
      {Array.from({ length: Math.min(titulos, max) }, (_, i) => (
        <Star key={i} className="size-4 fill-current" />
      ))}
    </span>
  )
}
