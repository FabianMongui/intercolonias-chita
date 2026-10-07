/** Agrupa conservando el orden en que aparece cada clave (para listas ya ordenadas). */
export function agrupar<T>(items: T[], clave: (item: T) => string): [string, T[]][] {
  const grupos = new Map<string, T[]>()
  for (const item of items) {
    const k = clave(item)
    const lista = grupos.get(k)
    if (lista) lista.push(item)
    else grupos.set(k, [item])
  }
  return [...grupos.entries()]
}
