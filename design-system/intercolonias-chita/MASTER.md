# Design System Master File — Intercolonias Chita

> **LÓGICA:** al construir una pantalla, revisa primero `design-system/intercolonias-chita/pages/<pantalla>.md`.
> Si existe, sus reglas **sobrescriben** este archivo. Si no, aplica este archivo tal cual.
>
> Fuente de verdad superior: `docs/ESPECIFICACION.md` §5. Implementación: `src/index.css` (tokens) y
> `src/components/ui/` (shadcn re-estilizado).

---

**Proyecto:** Intercolonias Chita
**Generado con:** ui-ux-pro-max `--design-system --persist --motion 3` (2026-10-02), luego ajustado a mano.
**Categoría:** Sports Team/Club — app de torneo de fútbol de barrio, resultados en vivo, mobile-first, uso al aire libre.
**Dial de movimiento:** 3/10 (sutil).

### Qué se cambió respecto a lo que sugirió la skill
| Sugerencia de la skill | Decisión | Motivo |
|---|---|---|
| Paleta roja (`#DC2626` primario, `#FEF2F2` fondo, `#7F1D1D` texto) | Reemplazada por el verde/amarillo del escudo | §5.1: manda el escudo. El rojo queda **solo** para EN VIVO y errores |
| Fuentes por Google Fonts (`@import url(...)`) | Self-host con fontsource, solo subset latino | Rendimiento con datos móviles; sin dependencia de terceros |
| Patrón "Hero-Centric Design" | Descartado | No es una landing: es una app de consulta (§5.4 regla 4) |
| "Animated patterns", scroll-snap, Scroll Reveal con GSAP + ScrollTrigger | Descartado | §5.3 prohíbe fondos animados; no se agregan librerías de animación |
| Botones `transition: all` + `translateY(-1px)` en hover; tarjetas que suben en hover | Solo color/opacidad/transform 150–300 ms; sin "lift" en hover | §5.3 y táctil (no hay hover en celular) |
| Modal con `backdrop-filter: blur` | Overlay opaco sin blur | Costoso en gama media |
| Fondo de tarjetas `#FEF2F2` | Tarjetas blancas sobre fondo gris muy claro | §5.1 |

---

## Paleta del escudo (§5.1) — tokens crudos

Definidos en `@theme` → utilidades `bg-verde`, `text-cafe`, etc. Preferir **siempre** los semánticos de abajo;
los crudos solo para piezas de identidad (escudos, trofeo, llaves).

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `verde` | `#018D36` | Fondos grandes (header), chips activos | blanco 4.3:1 → **solo texto grande** (≥ 24 px o 19 px bold) |
| `verde-oscuro` | `#016B29` | Botones con texto, links, foco | blanco 6.7:1 |
| `verde-claro` | `#3CA93E` | Acentos secundarios, gráficos | — |
| `amarillo` | `#FCC000` | Acento/CTA, campeón, resaltar marcador | `cafe` encima 9.9:1. **Nunca blanco** |
| `dorado` | `#D49F37` | Llaves, final, trofeo, bordes | decorativo |
| `azul` | `#0070AC` | Info, links secundarios | blanco 5.4:1 |
| `cielo` | `#87CBF2` | Fondos suaves / ilustraciones | decorativo |
| `crema` | `#F6E5DB` | Superficies cálidas | `cafe` encima 13.4:1 |
| `cafe` | `#3B130B` | Texto sobre amarillo/crema | — |
| `en-vivo` | `#DC2626` | **Solo** EN VIVO y errores | blanco 4.8:1 |

## Tokens semánticos (contrato shadcn + propios)

| Clase Tailwind | Valor | Notas |
|---|---|---|
| `background` | `#F9FAFB` | gris muy claro |
| `foreground` | `#1F2937` | texto principal |
| `card` / `popover` / `surface` | `#FFFFFF` | texto `#1F2937` |
| `primary` | `verde-oscuro #016B29` | texto `primary-foreground #FFFFFF` (6.7:1) |
| `primary-hover` | verde-oscuro 85% + negro | hover de botón primario (más oscuro, no más claro) |
| `brand` | `verde #018D36` | fondos grandes; `brand-foreground #FFFFFF` solo texto grande |
| `accent` | `amarillo #FCC000` | texto `accent-foreground` = `cafe` |
| `accent-hover` | amarillo 88% + negro | |
| `secondary` / `muted` | `#F3F4F6` | `muted-foreground #4B5563` (6.9:1 sobre muted) |
| `destructive` | `en-vivo #DC2626` | `destructive-foreground #FFFFFF` |
| `live` | `en-vivo #DC2626` | `live-foreground #FFFFFF` — indicador EN VIVO |
| `info` | `azul #0070AC` | `info-foreground #FFFFFF` |
| `surface-warm` | `crema #F6E5DB` | `surface-warm-foreground` = `cafe` |
| `gold` | `dorado #D49F37` | `gold-foreground` = `cafe` |
| `border` | `#E5E7EB` | separadores |
| `input` | `#6B7280` | borde de campos, 4.8:1 (≥ 3:1 no textual) |
| `ring` | `verde-oscuro #016B29` | foco: `outline` 3 px con offset 2 px, sólido |
| `chart-1..5` | verde, amarillo, azul, dorado, verde-claro | |

**Nota sobre `accent`:** en shadcn `accent` se usa como fondo de hover en menús (DropdownMenu, Select,
Command). Aquí `accent` es el amarillo CTA, así que al agregar esos componentes hay que cambiar
`focus:bg-accent` → `focus:bg-muted` en los ítems.

## Tipografía

- **Display:** Bebas Neue (`font-display`, también en `h1–h3`): títulos, marcadores, minutos.
- **Texto:** Source Sans 3 variable (`font-sans`, por defecto en `html`).
- Self-host: `@fontsource/bebas-neue/latin-400.css` + `@font-face` propio con el woff2 latino de
  `@fontsource-variable/source-sans-3`. `font-display: swap`. ~42 KB woff2 en total.
- Cuerpo 16 px, `line-height` 1.5. Nada de texto < 12 px.
- **Marcadores:** utilidad `marcador` (Bebas Neue + `tabular-nums` + `line-height: 1`). Cifras tabulares también
  con `tabular-nums` de Tailwind en tablas de posiciones.

## Espaciado y forma

- Escala de Tailwind (múltiplos de 4 px). Gutter móvil 16 px (`px-4`), separación entre bloques 16–24 px.
- `--radius: 0.5rem` (bloques un poco más cuadrados, estilo block-based).
- Sombras mínimas: preferir bloques de color y bordes a sombras.

## Movimiento (§5.3) — nivel 3/10

- Transiciones 150–300 ms (`--duracion-rapida` 150, `--duracion-base` 200 por defecto, `--duracion-lenta` 300),
  **solo** en color, opacidad y transform.
- Permitidas: `animate-pulso-en-vivo` (opacidad, punto EN VIVO), `animate-pop-marcador` (scale 1→1.18→1 en 300 ms
  al cambiar el número), entrada/salida de hojas inferiores y diálogos (`tw-animate-css`), `animate-pulse` de skeletons.
- Prohibido: parallax, fondos animados, partículas, texto que se escribe solo, scroll-jacking, carruseles
  automáticos, scroll reveal, GSAP/framer-motion decorativos.
- `prefers-reduced-motion: reduce` anula todas las animaciones y transiciones (regla global en `index.css`).

## Componentes (§5.4)

- Base **shadcn/ui** (estilo `radix-nova`, Radix + Tailwind v4, `cn` de shadcn). Instalados: Button, Skeleton,
  Sonner. Próximos según §5.4: Dialog, Sheet, Tabs, Switch, Select, Avatar.
- **Button:** todas las tallas ≥ 44 px (`default`/`sm` h-11, `lg` h-12, `icon` 44×44, `icon-lg` 48×48).
  Variantes: `default` (verde-oscuro), `accent` (amarillo + cafe), `outline` (borde y texto verde-oscuro),
  `secondary`, `ghost`, `destructive` (rojo sólido + blanco), `link`. `type="button"` por defecto.
- **Sonner:** tema claro fijo, arriba al centro, íconos lucide con color semántico.
- **21st.dev** solo como punto de partida (tarjeta de partido, tabla, llaves, navegación inferior, selector de
  categoría): re-estilizar con estos tokens, quitar gradientes/animaciones decorativas, revisar foco/labels/44 px
  a 375 px. Nada de componentes de landing (heros animados, marquees, glow, beams).
- Íconos: **lucide-react**. Sin emojis como íconos.

## Anti-patrones (no usar)

- Hex sueltos en componentes (solo clases de tokens).
- Texto blanco sobre `verde` en tamaño normal; texto blanco sobre `amarillo`.
- Rojo para algo que no sea EN VIVO o error.
- Hover como única forma de descubrir una acción; objetivos táctiles < 44×44 px.
- Quitar el foco visible; labels solo como placeholder.
- `transition: all`, animar width/height, efectos de "lift" en hover.
- Imágenes/escudos sin espacio reservado (CLS < 0.1).

## Checklist de entrega

- [ ] Sin emojis como íconos (lucide-react)
- [ ] Táctil ≥ 44×44 px y 8 px entre objetivos
- [ ] Foco visible (outline `ring`) en todo lo interactivo
- [ ] Contraste según §5.1 (texto ≥ 4.5:1)
- [ ] `prefers-reduced-motion` respetado
- [ ] Estados vacío, carga (skeleton) y error en cada pantalla
- [ ] Sin scroll horizontal; probar 375 / 768 / 1024 / 1440 px
- [ ] CLS < 0.1 (reservar espacio a escudos)
- [ ] Horas en `America/Bogota`
