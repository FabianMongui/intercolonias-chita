-- 11: advertencias del fixture (solo lectura) + integridad de la cancha fija de una categoría.

-- A) advertencias_torneo -------------------------------------------------------------------------
-- Hora de referencia de un partido pendiente = coalesce(hora_estimada, hora_programada), la misma que usa
-- la app para ordenar y mostrar (src/lib/orden.ts). Para un partido en_vivo se usa inicio_real.
-- Duración del partido = 2 * minutos_por_tiempo + minutos_descanso (sin minutos_entre_partidos).
-- Solo partidos no finalizados. 'equipo_solapado' considera programado + en_vivo; el resto, solo programado.
-- Horas en los mensajes: America/Bogota, formato DD/MM HH24:MI.
create or replace function public.advertencias_torneo(p_torneo bigint)
returns table (tipo text, partido_id bigint, otro_partido_id bigint, categoria_id bigint, mensaje text)
language sql
stable
security invoker
set search_path = ''
as $$
  with t as (
    select * from public.torneos where id = p_torneo
  ), base as (
    select pa.id, pa.categoria_id, pa.estado, pa.cancha_id, pa.hora_programada,
           pa.equipo_local_id, pa.equipo_visitante_id,
           ca.nombre as categoria, ca.tipo_cancha, ca.cancha_fija_id, ca.torneo_id,
           k.nombre as cancha, k.tipo as cancha_tipo, k.activa as cancha_activa, k.torneo_id as cancha_torneo,
           case when pa.estado = 'en_vivo' then pa.inicio_real
                else coalesce(pa.hora_estimada, pa.hora_programada) end as ini,
           make_interval(mins => 2 * ca.minutos_por_tiempo + ca.minutos_descanso) as dur,
           coalesce(el.nombre, pa.ref_local, '?') || ' vs ' || coalesce(ev.nombre, pa.ref_visitante, '?') as cruce
    from public.partidos pa
    join public.categorias ca on ca.id = pa.categoria_id
    left join public.canchas k on k.id = pa.cancha_id
    left join public.equipos el on el.id = pa.equipo_local_id
    left join public.equipos ev on ev.id = pa.equipo_visitante_id
    where ca.torneo_id = p_torneo and pa.estado in ('programado', 'en_vivo')
  ), b as (
    select base.*,
           to_char(ini at time zone 'America/Bogota', 'DD/MM HH24:MI') as h,
           (ini at time zone 'America/Bogota') as l_ini,
           ((ini + dur) at time zone 'America/Bogota') as l_fin
    from base
  ), equipo_partido as (
    select b.id, b.equipo_local_id as equipo_id, b.ini, b.dur from b where b.equipo_local_id is not null and b.ini is not null
    union
    select b.id, b.equipo_visitante_id, b.ini, b.dur from b where b.equipo_visitante_id is not null and b.ini is not null
  ), adv as (
    select 'sin_cancha'::text as tipo, b.id as partido_id, null::bigint as otro_partido_id, b.categoria_id,
           b.categoria || ': ' || b.cruce || ' no tiene cancha' as mensaje, b.ini
    from b where b.estado = 'programado' and b.cancha_id is null
    union all
    select 'sin_hora', b.id, null, b.categoria_id,
           b.categoria || ': ' || b.cruce || ' no tiene hora', b.ini
    from b where b.estado = 'programado' and b.hora_programada is null
    union all
    select 'fuera_de_fecha', b.id, null, b.categoria_id,
           b.categoria || ': ' || b.cruce || ' quedó el ' || b.h || ', fuera de las fechas del torneo', b.ini
    from b cross join t
    where b.estado = 'programado' and b.ini is not null
      and (b.l_ini::date < t.fecha_inicio or b.l_ini::date > t.fecha_fin)
    union all
    select 'fuera_de_jornada', b.id, null, b.categoria_id,
           b.categoria || ': ' || b.cruce || ' (' || b.h || '–' || to_char(b.l_fin, 'HH24:MI')
             || ') se sale de la jornada ' || to_char(t.hora_inicio_jornada, 'HH24:MI') || '–'
             || to_char(t.hora_fin_jornada, 'HH24:MI'), b.ini
    from b cross join t
    where b.estado = 'programado' and b.ini is not null
      and (b.l_ini::time < t.hora_inicio_jornada
           or b.l_fin::date > b.l_ini::date
           or b.l_fin::time > t.hora_fin_jornada)
    union all
    select 'cancha_cerrada', b.id, null, b.categoria_id,
           b.categoria || ': ' || b.cruce || ' (' || coalesce(b.h, 'sin hora') || ') está en ' || b.cancha
             || ', que está deshabilitada', b.ini
    from b where b.estado = 'programado' and b.cancha_id is not null and not b.cancha_activa
    union all
    select 'cancha_incompatible', b.id, null, b.categoria_id,
           b.categoria || ': ' || b.cruce || ' está en ' || b.cancha
             || case when b.cancha_torneo <> b.torneo_id then ', que es de otro torneo'
                     when b.cancha_tipo <> b.tipo_cancha then ' (' || b.cancha_tipo || '), pero la categoría juega en ' || b.tipo_cancha
                     else ', pero la categoría juega solo en su cancha fija' end, b.ini
    from b
    where b.estado = 'programado' and b.cancha_id is not null
      and (b.cancha_torneo <> b.torneo_id or b.cancha_tipo <> b.tipo_cancha
           or (b.cancha_fija_id is not null and b.cancha_id <> b.cancha_fija_id))
    union all
    select 'equipo_solapado', pa.id, pb.id, pa.categoria_id,
           pr.equipos || ' juega a la vez: ' || pa.cruce || ' (' || pa.h || ') y ' || pb.cruce || ' (' || pb.h || ')',
           least(pa.ini, pb.ini)
    from (
      select x.id as a, y.id as c, string_agg(e.nombre, ' y ' order by e.nombre) as equipos
      from equipo_partido x
      join equipo_partido y on y.equipo_id = x.equipo_id and y.id > x.id
      join public.equipos e on e.id = x.equipo_id
      where x.ini < y.ini + y.dur and y.ini < x.ini + x.dur
      group by x.id, y.id
    ) pr
    join b pa on pa.id = pr.a
    join b pb on pb.id = pr.c
  )
  select adv.tipo, adv.partido_id, adv.otro_partido_id, adv.categoria_id, adv.mensaje
  from adv
  order by adv.ini nulls first, adv.partido_id, adv.tipo;
$$;

comment on function public.advertencias_torneo(bigint) is
  'Advertencias del fixture de un torneo (partidos no finalizados). Hora de referencia: coalesce(hora_estimada, hora_programada); en_vivo usa inicio_real.';

revoke execute on function public.advertencias_torneo(bigint) from public, anon;
grant execute on function public.advertencias_torneo(bigint) to authenticated;

-- B) Integridad de la cancha fija -----------------------------------------------------------------
create or replace function public.validar_cancha_fija_categoria()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.cancha_fija_id is not null and not exists (
    select 1 from public.canchas k
    where k.id = new.cancha_fija_id and k.torneo_id = new.torneo_id and k.tipo = new.tipo_cancha
  ) then
    raise exception 'La cancha fija debe ser del mismo torneo y del tipo de la categoría';
  end if;
  return new;
end $$;

create trigger categorias_validar_cancha_fija
  before insert or update of cancha_fija_id, tipo_cancha, torneo_id on public.categorias
  for each row execute function public.validar_cancha_fija_categoria();

create or replace function public.validar_cambio_cancha_fija()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare v_cats text;
begin
  select string_agg(c.nombre, ', ' order by c.orden) into v_cats
  from public.categorias c
  where c.cancha_fija_id = new.id
    and (c.torneo_id <> new.torneo_id or c.tipo_cancha <> new.tipo);
  if v_cats is not null then
    raise exception 'Esta cancha es la cancha fija de %; quítala allí primero', v_cats;
  end if;
  return new;
end $$;

create trigger canchas_validar_cancha_fija
  before update of tipo, torneo_id on public.canchas
  for each row execute function public.validar_cambio_cancha_fija();

revoke execute on function public.validar_cancha_fija_categoria() from public, anon, authenticated;
revoke execute on function public.validar_cambio_cancha_fija() from public, anon, authenticated;
