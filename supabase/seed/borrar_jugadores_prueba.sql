-- Borra los jugadores generados por supabase/seed/jugadores_prueba.sql.
--
-- Alcance: SOLO el torneo "Intercolonias Chita 2026 (PRUEBA)" (filtrado por nombre) y SOLO los
-- jugadores cuyo nombre coincide exactamente con el patron generado:
--   nombre = 'Jugador ' || numero || ' ' || <nombre del equipo>
-- Jugadores reales o editados a mano (otro nombre) no se tocan.
--
-- Efecto sobre los goles/tarjetas de esos jugadores:
--   La FK eventos.jugador_id es ON DELETE SET NULL. Los eventos NO se borran: quedan con
--   jugador_id = null (gol "sin jugador"). Por eso el marcador de los partidos y la tabla de
--   posiciones NO cambian; esos goles simplemente desaparecen de la vista `goleadores`.
--   Si tambien se quisiera anular esos goles, habria que borrar antes los eventos (no se hace aqui).
--
-- Accion destructiva: ejecutar solo con confirmacion.

-- Guarda: aborta si no hay exactamente un torneo con ese nombre (el nombre no es unico en la tabla).
-- Ejecutar el archivo completo: si la guarda falla, no se ejecuta nada de lo que sigue.
do $$
begin
  if (select count(*) from public.torneos where nombre = 'Intercolonias Chita 2026 (PRUEBA)') <> 1 then
    raise exception 'Se esperaba exactamente un torneo "Intercolonias Chita 2026 (PRUEBA)"';
  end if;
end $$;

delete from public.jugadores j
using public.equipos e
join public.categorias c on c.id = e.categoria_id
join public.torneos t on t.id = c.torneo_id
where j.equipo_id = e.id
  and t.nombre = 'Intercolonias Chita 2026 (PRUEBA)'
  and j.numero between 1 and 20
  and j.nombre = 'Jugador ' || j.numero || ' ' || e.nombre;
