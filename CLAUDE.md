# Intercolonias Chita — v2

Web para torneos de fútbol de fin de semana (intercolonias, intersectores, interbarrios):
resultados en vivo, tablas, llaves, goleadores, y panel de administración desde el celular.

**Lee primero `docs/ESPECIFICACION.md`.** Es la fuente de verdad del proyecto.

## Estado
- **Fase 0 cerrada** (PR #1): el prototipo de CRA se reemplazó por la v2 (Vite + TS) y está publicada en
  `inter-colonias.web.app`. Del prototipo viejo solo quedan los logos en `public/assets/`.
- La **base de datos ya está construida y probada** en Supabase (proyecto `database-colonias`,
  ref `kewjmzqiuggpdodnzbvp`): tablas, RLS, vistas, funciones RPC, Realtime y Storage. No rediseñarla;
  extenderla solo con migraciones nuevas si hace falta.

## Stack
**Últimas versiones estables** al crear el proyecto (verificar con `npm view <paquete> version`, nada de copiar versiones del package.json viejo): Vite + React + TypeScript + Tailwind CSS · supabase-js v2 · TanStack Query · React Router ·
shadcn/ui · lucide-react · @dnd-kit (solo arrastre en escritorio) · Firebase Hosting (`inter-colonias.web.app`).

## Reglas
1. **Nada de lógica de negocio en el frontend.** Posiciones, goleadores, marcador, llaves, fixture, horarios
   y reloj del servidor salen de la base (vistas y RPC). El frontend solo muestra y llama funciones.
2. **Nunca** usar la `service_role`/secret key en el frontend. Solo URL + publishable key (`sb_publishable_…`) vía `.env`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; esta última guarda la publishable key, el nombre se mantiene por
   compatibilidad). Las keys legacy (anon/service_role JWT) están desactivadas.
3. Cambios a la base **solo con migraciones** (MCP de Supabase o `supabase/migrations/`), y correr los
   advisors de seguridad después de cada cambio.
4. Horas: se guardan en `timestamptz`; se muestran **siempre** en `America/Bogota` (no depender del reloj del celular).
5. UI en **español**, mobile-first, táctil (mín. 44×44 px). Colores del **escudo de Chita** (verde/amarillo, ver ESPECIFICACION §5.1), animación mínima (§5.3). 21st.dev solo como base, re-estilizado. Usar la skill **ui-ux-pro-max** para diseño
   (está en `ui-ux-pro-max.tar.gz`); sin emojis como íconos.
6. Acciones destructivas (borrar fixture, reprogramar, anular gol) siempre con confirmación.
7. Commits pequeños por fase; no subir `.env` ni `ui-ux-pro-max.tar.gz`.

## Ramas y publicación
- `main` = **producción**. Protegida con ruleset (PR obligatorio + check `build_and_preview`). Cada merge a `main`
  publica en producción, `inter-colonias.web.app` (workflow `firebase-hosting-merge.yml`). Nunca push directo.
- Cada fase en su rama desde `main` (`fase-1`, `fase-2`, …): commits pequeños, `revisor` antes de cada commit,
  `qa-movil` al cerrar la fase, y **un PR a `main` por fase**. El PR genera un preview (comentario del bot) que el
  dueño revisa en el celular antes del merge. Si una fase se alarga, se puede partir en PRs que dejen el sitio usable.
- Arreglos urgentes en producción: rama `hotfix/<tema>` desde `main` → PR corto.
- Al empezar una fase nueva, crear la rama desde `main` actualizado; borrar la rama de la fase anterior tras el merge.

## Rollback en Firebase Hosting
Si un deploy rompe producción:
1. **Rápido (consola):** Firebase Console → proyecto `inter-colonias` → Hosting → historial de versiones del sitio
   → en la versión buena, menú ⋮ → **Revertir** (en inglés: Release history → Rollback). Sirve al instante la versión anterior; no requiere build.
2. **Alternativa (CLI):** si el preview del último PR bueno que se mergeó sigue vivo (los canales expiran a los 7 días),
   `firebase hosting:channel:list` y luego `firebase hosting:clone inter-colonias:<canal> inter-colonias:live`.
3. **Siempre después:** revertir también en git (`git revert -m 1 <merge>` en una rama `hotfix/…` → PR a `main`).
   Si no, el próximo merge vuelve a publicar el código roto. (`-m 1` es para merge commits; con squash, sin `-m`.)
   Para volver a integrar lo revertido ya corregido, primero hay que revertir el revert.
Un rollback de Hosting no deshace migraciones de Supabase: los cambios de base se corrigen con una migración nueva.

## Agentes del proyecto (`.claude/agents/`)
Delegar en ellos cuando aplique:
- `supabase-db` → cualquier cambio o consulta de base de datos, migraciones, RLS, tipos.
- `disenador-ui` → crear o revisar pantallas/componentes contra §5 de la especificación.
- `qa-movil` → probar flujos en el navegador a 375 px al cerrar cada fase.
- `revisor` → revisión del diff antes de cada commit.
