/**
 * Texto para mostrar de un error de Supabase. Los de las RPC ya vienen en español (§3.4);
 * se traducen los de red y los de restricciones de la base más comunes.
 */
export function mensajeError(error: unknown): string {
  const mensaje =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : ''
  if (/fetch|network/i.test(mensaje)) return 'Sin conexión. Revisa la señal e intenta de nuevo.'
  if (/duplicate key|unique/i.test(mensaje)) return 'Ya existe un registro con esos datos.'
  if (/violates check constraint/i.test(mensaje)) return 'Algún dato no es válido. Revisa los campos.'
  if (/row-level security|permission denied/i.test(mensaje)) return 'No tienes permiso para hacer esto.'
  return mensaje || 'No se pudo completar la acción. Intenta de nuevo.'
}
