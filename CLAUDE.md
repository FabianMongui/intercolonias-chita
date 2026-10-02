# Intercolonias Chita — v2

Web para torneos de fútbol de fin de semana (intercolonias, intersectores, interbarrios):
resultados en vivo, tablas, llaves, goleadores, y panel de administración desde el celular.

**Lee primero `docs/ESPECIFICACION.md`.** Es la fuente de verdad del proyecto.

## Estado
- El código actual (Create React App, `src/`) es un prototipo viejo con datos ficticios. Se **reescribe desde cero**
  en la rama `v2`. Del viejo solo se reutiliza: logos en `public/assets/` y la idea visual general.
- La **base de datos ya está construida y probada** en Supabase (proyecto `database-colonias`,
  ref `kewjmzqiuggpdodnzbvp`): tablas, RLS, vistas, funciones RPC, Realtime y Storage. No rediseñarla;
  extenderla solo con migraciones nuevas si hace falta.

## Stack
**Últimas versiones estables** al crear el proyecto (verificar con `npm view <paquete> version`, nada de copiar versiones del package.json viejo): Vite + React + TypeScript + Tailwind CSS · supabase-js v2 · TanStack Query · React Router ·
shadcn/ui · lucide-react · @dnd-kit (solo arrastre en escritorio) · Firebase Hosting (`inter-colonias.web.app`).

## Reglas
1. **Nada de lógica de negocio en el frontend.** Posiciones, goleadores, marcador, llaves, fixture, horarios
   y reloj del servidor salen de la base (vistas y RPC). El frontend solo muestra y llama funciones.
2. **Nunca** usar la `service_role` key en el frontend. Solo URL + publishable/anon key vía `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Cambios a la base **solo con migraciones** (MCP de Supabase o `supabase/migrations/`), y correr los
   advisors de seguridad después de cada cambio.
4. Horas: se guardan en `timestamptz`; se muestran **siempre** en `America/Bogota` (no depender del reloj del celular).
5. UI en **español**, mobile-first, táctil (mín. 44×44 px). Colores del **escudo de Chita** (verde/amarillo, ver ESPECIFICACION §5.1), animación mínima (§5.3). 21st.dev solo como base, re-estilizado. Usar la skill **ui-ux-pro-max** para diseño
   (está en `ui-ux-pro-max.tar.gz`); sin emojis como íconos.
6. Acciones destructivas (borrar fixture, reprogramar, anular gol) siempre con confirmación.
7. Commits pequeños por fase; no subir `.env` ni `ui-ux-pro-max.tar.gz`.

## Agentes del proyecto (`.claude/agents/`)
Delegar en ellos cuando aplique:
- `supabase-db` → cualquier cambio o consulta de base de datos, migraciones, RLS, tipos.
- `disenador-ui` → crear o revisar pantallas/componentes contra §5 de la especificación.
- `qa-movil` → probar flujos en el navegador a 375 px al cerrar cada fase.
- `revisor` → revisión del diff antes de cada commit.
