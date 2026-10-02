# Especificación — Intercolonias Chita v2

> Documento para Claude Code. Analizado y acordado con el dueño del proyecto (Fabián) el 1-oct-2026.
> La base de datos descrita aquí **ya existe y fue probada** en Supabase.

---

## 1. Qué es

Un torneo de fútbol que se juega en **un fin de semana (2 días)** en un mismo sitio, con varias canchas y categorías.
La app tiene dos caras:

- **Pública** (sin login): ver partidos en vivo con marcador y minuto en tiempo real, próximos partidos (con
  retrasos), resultados, tabla de posiciones por grupo, llaves (semis, 3er puesto, final), goleadores, equipos y jugadores.
- **Administración** (con login, desde el celular): los admins de cancha manejan los partidos en vivo; el super admin
  configura todo (torneo, canchas, categorías, equipos, bombos, fixture y horarios, usuarios).

Debe ser **gratis**: Supabase (plan free) + Firebase Hosting (plan Spark).

## 2. Formato del torneo (valores por defecto, TODO es configurable)

| Concepto | Valor típico | Dónde se configura |
|---|---|---|
| Categorías | Única (F11), Veteranos (F11), Femenino (F6) | `categorias` |
| Equipos por categoría | 6–7 (personalizable, sin límite fijo) | `equipos` |
| Grupos | 2 grupos (A, B) de 3–4 equipos | `grupos` |
| Fase de grupos | Todos contra todos. Gana 3, empata 1, pierde 0. **Sin penales** | automático |
| Desempate en grupos | 1) puntos 2) diferencia de gol 3) goles a favor. (Juego limpio: pendiente, futuro) | vista `posiciones` |
| Eliminatorias | Semis cruzadas (1A vs 2B, 1B vs 2A), 3er puesto y final. **Empate → penales** | automático |
| Tiempos F11 | 2 × 45', descanso 10' | `categorias.minutos_por_tiempo`, `minutos_descanso` |
| Tiempos F6 (femenino) | 2 × 25', descanso 5' | idem |
| Canchas | 2 de F11 + 1 de F6. Se pueden **habilitar/deshabilitar** | `canchas.activa` |
| Femenino | siempre en la cancha F6 | `categorias.cancha_fija_id` |
| F11 | se reparte entre las canchas F11 activas | `categorias.tipo_cancha` |
| Jornada | 08:00–18:00, 10' entre partidos | `torneos` |
| Tarjetas | **No por ahora.** La roja solo saca al jugador de ese partido (no hay suspensiones). La tabla `eventos` ya admite `amarilla`/`roja` para el futuro | — |

**Flexibilidad es requisito central:** en la vida real hay actos de protocolo, equipos que llegan tarde, canchas que
se cierran. Todo horario, cancha, duración, cantidad de equipos y emparejamiento debe poder editarse a mano, y la app
debe ajustar las **horas estimadas** automáticamente según los retrasos reales.

Capacidad verificada con datos de prueba (6 equipos por categoría): cabe justo en 2 días.
Con 7 equipos en F11 (26 partidos) **no cabe** con 45' → la UI debe advertir cuando algún partido quede programado
después de `torneos.fecha_fin` o fuera de jornada, para que el super admin acorte tiempos o alargue la jornada.

## 3. Base de datos (Supabase, ya creada)

Proyecto: `database-colonias` · ref `kewjmzqiuggpdodnzbvp` · región us-east-2 · Postgres 17.
Las migraciones aplicadas están en `supabase_migrations.schema_migrations` (00 a 06). **Primer paso de la Fase 0:**
exportarlas a `supabase/migrations/` (con el MCP de Supabase o `supabase db pull`) y generar tipos TS
(`supabase gen types typescript --project-id kewjmzqiuggpdodnzbvp > src/types/database.ts`).

### 3.1 Tablas (schema `public`)

| Tabla | Campos clave | Notas |
|---|---|---|
| `torneos` | nombre, tipo (`intercolonias`…), fecha_inicio, fecha_fin, hora_inicio_jornada, hora_fin_jornada, minutos_entre_partidos, activo | Solo **uno activo** a la vez (índice único parcial). La app pública muestra el activo |
| `canchas` | torneo_id, nombre, tipo `F11`/`F6`, activa, orden | |
| `categorias` | torneo_id, nombre, tipo_cancha, cancha_fija_id?, minutos_por_tiempo, minutos_descanso, orden | |
| `grupos` | categoria_id, nombre (`A`, `B`… regex `^[A-Z]{1,2}$`) | |
| `equipos` | categoria_id, grupo_id?, nombre, representante, escudo_path | `grupo_id` null = equipo sin asignar (bombo) |
| `jugadores` | equipo_id, nombre, numero (0–99)?, posicion? | |
| `partidos` | categoria_id, fase (`grupos`/`semifinal`/`tercer_puesto`/`final`), grupo_id?, ronda?, etiqueta?, equipo_local_id?, equipo_visitante_id?, ref_local?, ref_visitante?, cancha_id?, hora_programada, hora_estimada, estado (`programado`/`en_vivo`/`finalizado`), periodo (`1T`/`descanso`/`2T`), inicio_real, fin_primer_tiempo, inicio_segundo_tiempo, fin_real, goles_local, goles_visitante, penales_local?, penales_visitante? | Ver 3.3 |
| `eventos` | partido_id, equipo_id, jugador_id?, tipo (`gol`/`amarilla`/`roja`), autogol, minuto, periodo, created_by | `equipo_id` = equipo al que **se le suma** el gol (en autogol, el rival del jugador) |
| `perfiles` | id (= auth.users.id), nombre, rol (`super_admin`/`admin`), cancha_id?, activo | Se crea **automáticamente inactivo** al crear un usuario (trigger). `cancha_id` es solo sugerencia: los admins rotan, no restringe |

### 3.2 Vistas (lectura pública)
- `posiciones`: por equipo → categoria_id, grupo_id, grupo, equipo_id, equipo, escudo_path, pj, pg, pe, pp, gf, gc, dg, puntos, **posicion** (ya ordenada).
- `goleadores`: por jugador → categoria_id, jugador_id, jugador, numero, equipo_id, equipo, escudo_path, goles (sin autogoles).

### 3.3 Reglas automáticas (triggers)
- **Marcador**: `goles_local/visitante` se recalculan solos al insertar/borrar en `eventos`. **El frontend nunca
  escribe los goles directamente**: usa `registrar_gol` y, para anular, borra el evento.
- **Llaves**: los partidos de eliminación se crean con referencias (`ref_local`/`ref_visitante`):
  `"1A"` = 1° del grupo A, `"G:<id>"` = ganador del partido id, `"P:<id>"` = perdedor. Al finalizar un partido,
  se completan solos los equipos cuando el grupo/partido origen terminó. Mostrar en la UI: "1° Grupo A",
  "Ganador Semifinal 1", etc. mientras el equipo es null.
- **Horas estimadas**: al iniciar/finalizar cualquier partido se recalcula `hora_estimada` de los partidos pendientes
  de cada cancha según los retrasos reales. `hora_programada` **no se toca**. Mostrar "Programado 10:00 · aprox 10:25"
  cuando difieran.
- La **hora de finalización** es la del momento en que el admin toca "Finalizar" (`fin_real = now()` del servidor).

### 3.4 Funciones RPC (llamar con `supabase.rpc`)

| Función | Quién | Qué hace |
|---|---|---|
| `ahora()` | todos | Hora del servidor → calcular el desfase del reloj del celular |
| `iniciar_partido(p_id)` | admin | estado `en_vivo`, periodo `1T`, `inicio_real = now()` |
| `medio_tiempo(p_id)` | admin | `1T` → `descanso` (el reloj se pausa) |
| `iniciar_segundo_tiempo(p_id)` | admin | `descanso` → `2T` |
| `finalizar_partido(p_id, p_penales_local?, p_penales_visitante?)` | admin | Finaliza. En eliminatoria empatada **exige** penales con ganador (si no, error con mensaje claro) |
| `registrar_gol(p_partido, p_equipo, p_jugador?, p_autogol?)` | admin | Inserta el gol con minuto calculado en el servidor |
| `generar_partidos_categoria(p_categoria)` | super admin | Crea todos contra todos por grupo + (si hay exactamente 2 grupos) semis, 3er puesto y final. **Falla si la categoría ya tiene partidos**: la UI primero los borra (delete en `partidos`, permitido al super admin) con confirmación, y solo si ninguno ha iniciado |
| `programar_horarios(p_torneo, p_desde?)` | super admin | Asigna cancha y hora a **todos los partidos pendientes** respetando: canchas activas, tipo/cancha fija, jornada, un equipo no juega dos partidos a la vez, eliminatorias después de grupos. Sin `p_desde` arranca al inicio del torneo; con `p_desde = now()` sirve para **reprogramar en pleno torneo**. ⚠️ Sobrescribe ediciones manuales de pendientes → confirmar |
| `ganador(partido)` / `perdedor(partido)` | todos | Columnas calculadas: `select('*, ganador')` |

Errores de RPC vienen con mensajes en español → mostrarlos tal cual en un toast.

### 3.5 Seguridad (RLS, ya aplicada)
- `anon`: solo lectura de todo menos `perfiles`.
- `admin` activo: actualizar `partidos` (horas, cancha, correcciones) y escribir/borrar `eventos`; RPC de partido.
- `super_admin` activo: todo (config, equipos, jugadores, grupos, crear/borrar partidos, perfiles, escudos).
- Registro público **desactivado** en Auth. Los usuarios se crean desde el panel de Supabase
  (Authentication → Users → Add user, "Auto Confirm"); el perfil nace inactivo y el super admin lo activa.

### 3.6 Storage
Bucket **público** `escudos` (máx 1 MB, png/jpeg/webp). Guardar en `equipos.escudo_path` solo la ruta
(ej. `unica/chita-fc.webp`) y armar la URL con `supabase.storage.from('escudos').getPublicUrl(path)`.
Al subir: redimensionar a ~256 px y convertir a webp en el navegador. Si no hay escudo, mostrar iniciales en un círculo.
(El bucket viejo `inter-colonias` es privado y está obsoleto; no usarlo.)

### 3.7 Realtime
`partidos` y `eventos` están en la publicación `supabase_realtime`. La página pública abre **un** canal con
`postgres_changes` sobre ambas tablas y actualiza la caché de TanStack Query (y refresca `posiciones`/`goleadores`
cuando un partido finaliza o cambia un gol). Si el canal no queda `SUBSCRIBED` o se cae, **fallback a polling cada 20 s**.
Límite del plan free ≈ 200 conexiones simultáneas: cerrar el canal cuando la pestaña está oculta (`visibilitychange`).

### 3.8 Reloj del partido (frontend, solo visual)
- Al cargar: `offset = ahora_servidor − Date.now()`.
- `1T`: minuto = ⌊(now − inicio_real)/60000⌋ + 1. `descanso`: "Descanso". `2T`: minutos_por_tiempo + ⌊(now − inicio_segundo_tiempo)/60000⌋ + 1.
- Pasado el tiempo reglamentario mostrar adición: `45+2'`, `90+3'`.
- Actualizar cada segundo solo los relojes visibles.

### 3.9 Datos de prueba actuales
Torneo "Intercolonias Chita 2026 (PRUEBA)" (7–8 nov 2026), 3 canchas, 3 categorías con 6 equipos cada una
(grupos A y B de 3), 30 partidos generados y programados. Usuarios: un usuario super admin y
un usuario admin de prueba (Cancha 1 sugerida); sus credenciales van en `.env` (`TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`), nunca en el repo. Antes del torneo real se crea un torneo nuevo y se marca activo.

## 4. Pantallas

### 4.1 Pública (mobile-first, sin login)
Navegación inferior en móvil (≤ 5 ítems), barra superior en escritorio. Selector de categoría (Única / Veteranos /
Femenino) persistente en la URL (`?cat=`), para que los links se puedan compartir.

1. **En vivo** (`/`): tarjetas de partidos en vivo (indicador rojo "EN VIVO" que pulsa suave, marcador grande, minuto,
   cancha), luego "Próximos" (hora programada + estimada, cancha, "en X min") y "Últimos resultados". Si no hay nada en
   vivo, mostrar el siguiente partido destacado.
2. **Partidos** (`/partidos`): lista por día y por cancha; filtros por categoría y cancha.
3. **Tablas** (`/tablas`): posiciones por grupo (PJ, PG, PE, PP, GF, GC, DG, PTS; en móvil columnas mínimas
   PJ, DG, PTS con detalle desplegable), llaves (semis → final, 3er puesto, campeón) y goleadores.
4. **Equipos** (`/equipos`, `/equipos/:id`): escudo, representante, plantel, partidos del equipo.
5. **Detalle de partido** (`/partido/:id`): marcador, goles con minuto y jugador, penales si hubo, horas reales.

Estados vacíos y de carga (skeletons) en todo; nada de saltos de layout.

### 4.2 Admin (`/admin`, login con correo y contraseña)
Formulario simple (sin Google). Tras login se lee `perfiles`; si `activo = false` → mensaje "Tu cuenta aún no está
activa". Ruta protegida; botón de cerrar sesión; cambiar mi contraseña (`supabase.auth.updateUser`).

**Admin de cancha — "Control de partido"** (pantalla más importante, se usa de pie en la cancha, al sol):
- Filtro por cancha (por defecto `perfiles.cancha_id`, cambiable porque rotan). Lista: en vivo arriba, luego próximos.
- Vista de control: reloj grande, marcador grande, botones enormes: **Iniciar** → **+ Gol [Local]** / **+ Gol [Visitante]**
  (abre hoja inferior para elegir jugador opcional y marcar autogol) → **Medio tiempo** → **Iniciar 2º tiempo** →
  **Finalizar** (si es eliminatoria empatada, diálogo de penales).
- **Anular último gol** (borra el evento, con confirmación). Lista de goles del partido con opción de borrar cada uno.
- Corregir hora/cancha de un partido pendiente.
- Botones deshabilitados con spinner mientras la RPC responde; feedback háptico (`navigator.vibrate`) opcional.
- Alto contraste, texto grande: se usa al aire libre.

**Super admin** (además de lo anterior):
1. **Torneo**: crear/editar (fechas, jornada, minutos entre partidos), marcar activo.
2. **Canchas**: crear, tipo F11/F6, activar/desactivar (switch grande), orden.
3. **Categorías**: minutos por tiempo, descanso, tipo de cancha, cancha fija, orden.
4. **Equipos y jugadores**: CRUD, subir escudo, plantel (agregar jugadores rápido: número + nombre).
5. **Bombos** (asignar grupos), pensado para celular:
   - Crear/quitar grupos (A, B, C…).
   - Equipos sin grupo arriba como chips. **Interacción principal: tocar un equipo y luego tocar el grupo destino**
     (o menú "Mover a…"). En escritorio, además, arrastrar y soltar con @dnd-kit.
   - Botón "Sorteo aleatorio" que reparte equipos sin grupo equilibrando tamaños (con confirmación).
6. **Fixture y horarios**:
   - Por categoría: "Generar partidos" (si ya hay, ofrecer borrar y regenerar solo si ninguno inició).
   - "Programar horarios" del torneo completo, y "Reprogramar pendientes desde ahora" (`p_desde = now()`).
   - Vista tipo agenda por cancha y día; editar a mano hora, cancha y equipos de cualquier partido pendiente.
   - **Advertencias**: partidos después de `fecha_fin` o fuera de jornada, mismo equipo en horarios solapados,
     cancha inactiva con partidos pendientes.
7. **Usuarios**: lista de perfiles (activar/desactivar, rol, cancha sugerida). Crear usuario y restablecer contraseña
   requieren la service key → **Edge Function** `admin-usuarios` que verifica que quien llama es super_admin
   (Fase 5). Mientras tanto se hace desde el panel de Supabase.

## 5. Diseño (skill ui-ux-pro-max + componentes base)

### 5.1 Identidad: colores del escudo de Chita
Los colores salen del **escudo oficial del municipio** (`public/assets/logoChita.jpg`) y del escudo de la Colonia
Chitana (`public/assets/Chita.png`, verde y amarillo). Valores medidos sobre la imagen y contraste verificado (WCAG):

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--verde` | `#018D36` | Primario: encabezados, chips activos, fondos grandes | blanco encima 4.3:1 → solo texto grande (≥ 24px o 19px bold) |
| `--verde-oscuro` | `#016B29` | Botones con texto, links, foco | blanco encima 6.7:1 ✅ |
| `--verde-claro` | `#3CA93E` | Acentos secundarios, gráficos | — |
| `--amarillo` | `#FCC000` | Acento/CTA, campeón, resaltar marcador | **texto oscuro encima** (`--cafe` 9.9:1). Nunca blanco sobre amarillo |
| `--dorado` | `#D49F37` | Detalles (llaves, final, trofeo, bordes) | decorativo |
| `--azul` | `#0070AC` | Secundario institucional (info, links en fondo claro) | blanco encima 5.4:1 ✅ |
| `--cielo` | `#87CBF2` | Fondos suaves / ilustraciones | decorativo |
| `--crema` | `#F6E5DB` | Superficies cálidas (tarjetas destacadas, fondo de secciones) | `--cafe` encima 13.4:1 ✅ |
| `--cafe` | `#3B130B` | Texto sobre amarillo/crema | — |
| `--en-vivo` | `#DC2626` | **Solo** indicador EN VIVO y errores | blanco encima 4.8:1 ✅ |

Fondo general blanco o gris muy claro; texto principal gris oscuro (`#1F2937`). Definir todo como tokens
semánticos en Tailwind (`primary`, `accent`, `live`, `surface`…), nunca hex sueltos en componentes.
Modo oscuro: opcional (fase 5).

### 5.2 Estilo y tipografía (ui-ux-pro-max)
- Estilo *Vibrant & Block-based*: bloques de color, alto contraste, enérgico, pero sobrio.
- **Bebas Neue** (títulos, marcadores, minutos) + **Source Sans 3** (texto). Cifras tabulares en marcadores.
- Íconos lucide-react; **sin emojis** como íconos.
- Correr `ui-ux-pro-max --design-system --persist --output-dir <raíz>` y luego **ajustar el MASTER.md con la paleta
  de 5.1** (la skill sugiere rojo; aquí manda el escudo).

### 5.3 Movimiento — regla de "poca animación"
- Nivel sutil (3/10): transiciones 150–300 ms solo en color/opacidad/transform. Respetar `prefers-reduced-motion`.
- Animaciones permitidas: pulso suave del punto EN VIVO, cambio de marcador (pequeño "pop" del número),
  aparición de hojas inferiores/diálogos, skeletons.
- Prohibido: parallax, fondos animados, partículas, textos que se escriben solos, scroll-jacking, carruseles automáticos.
- **La app se usa en celulares de gama media con datos móviles en la cancha**: rendimiento > efectos.

### 5.4 Componentes: shadcn/ui + 21st.dev (con reglas)
- Base: **shadcn/ui** (Radix + Tailwind, se copia al proyecto, gratis): Button, Dialog, Sheet, Tabs, Toast (sonner),
  Switch, Select, Skeleton, Avatar (escudos).
- **21st.dev** (componentes de la comunidad sobre shadcn y su MCP "Magic") **solo como punto de partida** para piezas
  concretas: tarjeta de partido, tabla de posiciones, llaves/bracket, navegación inferior, selector de categoría.
  Reglas al traer algo de 21st:
  1. Re-estilizarlo con los tokens de 5.1 (quitar sus colores y gradientes).
  2. Quitar o reducir animaciones a lo permitido en 5.3. Si depende de `framer-motion` solo para efectos
     decorativos, reescribir con CSS/Tailwind. No agregar librerías de animación pesadas.
  3. Revisar accesibilidad (foco, labels, 44 px) y que funcione a 375 px.
  4. No usar componentes de "landing" (heros animados, marquees, glow, beams).

### 5.5 Checklist de entrega
Táctil ≥ 44×44 px, foco visible, labels visibles, sin scroll horizontal, probar 375 / 768 / 1024 / 1440 px,
CLS < 0.1 (reservar espacio a escudos), contraste según 5.1.

## 6. Arquitectura del frontend

```
src/
  lib/supabase.ts        cliente único (env vars)
  lib/time.ts            formato America/Bogota, offset servidor, reloj
  lib/realtime.ts        canal único + fallback polling
  types/database.ts      tipos generados
  hooks/                 useTorneoActivo, usePartidos, usePosiciones, useGoleadores, useAuth/usePerfil…
  components/ui/         botones, tarjetas, chips, sheet, dialog, toast, skeleton, escudo
  components/partido/    TarjetaPartido, Marcador, Reloj, ListaGoles
  pages/publico/         EnVivo, Partidos, Tablas, Equipos, Equipo, Partido
  pages/admin/           Login, ControlPartidos, ControlPartido, Torneo, Canchas, Categorias,
                         Equipos, Bombos, Fixture, Usuarios
```
- TanStack Query para datos; claves por torneo/categoría; invalidación desde Realtime.
- Formatear horas con `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })`. Al editar una hora en admin,
  construir el ISO con offset `-05:00`.
- Rutas admin con lazy loading para que la parte pública cargue liviana.

## 7. Despliegue
- Firebase Hosting, proyecto `inter-colonias` → **https://inter-colonias.web.app**. Cambiar `firebase.json`
  `public` a `dist` (Vite) y mantener el rewrite SPA a `/index.html`.
- `.github/workflows/` ya existe (preview en PRs); actualizar a Node LTS + `npm ci && npm run build` y variables
  `VITE_SUPABASE_*` como secrets. Agregar deploy a producción al hacer merge a `main`.
- Supabase free se pausa tras ~7 días sin uso: antes del torneo, entrar unos días antes (queda activo el fin de semana).

## 8. Fases de trabajo

| Fase | Entregable | Hecho cuando… |
|---|---|---|
| 0 | Rama `v2`, limpiar CRA, Vite+TS+Tailwind, tokens de diseño, cliente Supabase, tipos, migraciones exportadas, deploy funcionando | `inter-colonias.web.app` muestra la nueva base y lee el torneo activo |
| 1 | Pública completa (En vivo, Partidos, Tablas, Equipos, Detalle) + Realtime + reloj | Un gol hecho desde el panel de Supabase aparece en < 2 s en otro celular |
| 2 | Login + Control de partido (admin) | El usuario admin de prueba juega un partido completo desde el celular, incluyendo penales en semifinal |
| 3 | Super admin: torneo, canchas, categorías, equipos, jugadores, escudos | Se arma un torneo nuevo sin tocar el panel de Supabase |
| 4 | Bombos + generar fixture + programar/reprogramar + edición manual + advertencias | Simulación completa del fin de semana con retrasos y una cancha deshabilitada |
| 5 | Edge Function de usuarios, pulido, accesibilidad, PWA opcional | Checklist de diseño completo |

## 9. Pendientes por definir (no bloquean)
- Tercer criterio de desempate (juego limpio → requiere tarjetas).
- Tarjetas amarillas/rojas en la UI (la tabla ya lo soporta).
- Fechas, equipos y escudos reales del próximo torneo.
- Formato si una categoría tiene 1 o 3+ grupos (hoy las eliminatorias automáticas solo se generan con 2 grupos;
  en otros casos el super admin crea los partidos de eliminación a mano).
