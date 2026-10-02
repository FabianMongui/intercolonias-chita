-- Semilla de jugadores de PRUEBA (no es migracion; ejecutar a mano en el SQL editor o con el MCP).
--
-- Alcance: SOLO el torneo "Intercolonias Chita 2026 (PRUEBA)" (filtrado por nombre, no por id).
-- Crea 20 jugadores por cada equipo de las categorias de ese torneo:
--   numero 1..20, nombre = 'Jugador <numero> <nombre del equipo>' (ej. "Jugador 7 Chita FC"), posicion null.
--
-- Idempotente: si el jugador (equipo_id + numero + nombre) ya existe, no se vuelve a insertar.
-- Para deshacerlo: supabase/seed/borrar_jugadores_prueba.sql

-- Guarda: aborta si no hay exactamente un torneo con ese nombre (el nombre no es unico en la tabla).
-- Ejecutar el archivo completo: si la guarda falla, no se ejecuta nada de lo que sigue.
do $$
begin
  if (select count(*) from public.torneos where nombre = 'Intercolonias Chita 2026 (PRUEBA)') <> 1 then
    raise exception 'Se esperaba exactamente un torneo "Intercolonias Chita 2026 (PRUEBA)"';
  end if;
end $$;

insert into public.jugadores (equipo_id, numero, nombre, posicion)
select e.id, n.numero, 'Jugador ' || n.numero || ' ' || e.nombre, null
from public.equipos e
join public.categorias c on c.id = e.categoria_id
join public.torneos t on t.id = c.torneo_id
cross join generate_series(1, 20) as n(numero)
where t.nombre = 'Intercolonias Chita 2026 (PRUEBA)'
  and not exists (
    select 1
    from public.jugadores j
    where j.equipo_id = e.id
      and j.numero = n.numero
      and j.nombre = 'Jugador ' || n.numero || ' ' || e.nombre
  );
