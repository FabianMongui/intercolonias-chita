/** Textos de presentación para la fase de un partido (no decide nada: solo traduce columnas). */

const NOMBRE_FASE: Record<string, string> = {
  grupos: 'Fase de grupos',
  semifinal: 'Semifinal',
  tercer_puesto: 'Tercer puesto',
  final: 'Final',
}

export function nombreFase(fase: string): string {
  return NOMBRE_FASE[fase] ?? fase
}

/** "Grupo A", "Grupo A · Fecha 2", "Semifinal 1" (etiqueta) o el nombre de la fase. */
export function textoFasePartido(p: {
  fase: string
  etiqueta: string | null
  grupo: { nombre: string } | null
}): string {
  if (p.fase === 'grupos' && p.grupo) {
    const grupo = `Grupo ${p.grupo.nombre}`
    return p.etiqueta ? `${grupo} · ${p.etiqueta}` : grupo
  }
  return p.etiqueta ?? nombreFase(p.fase)
}
