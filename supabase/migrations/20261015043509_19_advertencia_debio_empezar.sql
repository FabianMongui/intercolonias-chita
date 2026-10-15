-- 19: advertencias_torneo agrega el tipo 'debio_empezar': partido 'programado' cuya hora de referencia
-- coalesce(hora_estimada, hora_programada) es anterior a now() - 10 minutos. Firma, columnas, STABLE,
-- SECURITY INVOKER, search_path '', grants y demás tipos idénticos a la 17.

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
           pa.equipo_local_id, pa.equipo_visitante_id, pa.fase,
           ca.nombre as categoria, ca.tipo_cancha, ca.cancha_fija_id, ca.torneo_id,
           k.nombre as cancha, k.tipo as cancha_tipo, k.activa as cancha_activa, k.torneo_id as cancha_torneo,
           case when pa.estado = 'en_vivo' then pa.inicio_real
                else coalesce(pa.hora_estimada, pa.hora_programada) end as ini,
           make_interval(mins => 2 * ca.minutos_por_tiempo + ca.minutos_descanso) as dur,
           case when el.nombre is not null and ev.nombre is not null then el.nombre || ' vs ' || ev.nombre
                when pa.fase <> 'grupos' then nombre_llave.txt
                else coalesce(el.nombre, pa.ref_local, '?') || ' vs ' || coalesce(ev.nombre, pa.ref_visitante, '?') end as cruce,
           nombre_llave.txt as nombre_llave
    from public.partidos pa
    join public.categorias ca on ca.id = pa.categoria_id
    left join public.canchas k on k.id = pa.cancha_id
    left join public.equipos el on el.id = pa.equipo_local_id
    left join public.equipos ev on ev.id = pa.equipo_visitante_id
    cross join lateral (
      select coalesce(pa.etiqueta,
               case pa.fase when 'semifinal' then 'Semifinal' || coalesce(' ' || pa.ronda::text, '')
                            when 'tercer_puesto' then 'Tercer puesto'
                            when 'final' then 'Final'
                            else initcap(replace(pa.fase, '_', ' ')) end) as txt
    ) nombre_llave
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
  ), fin_grupos as (
    select b.categoria_id, max(b.ini + b.dur) as fin
    from b where b.fase = 'grupos' and b.ini is not null
    group by b.categoria_id
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
             || ', que está cerrada', b.ini
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
           pr.equipos || case when pr.n_equipos > 1 then ' juegan' else ' juega' end || ' a la vez: ' || pa.cruce || ' (' || pa.h || ') y ' || pb.cruce || ' (' || pb.h || ')',
           least(pa.ini, pb.ini)
    from (
      select x.id as a, y.id as c, string_agg(e.nombre, ' y ' order by e.nombre) as equipos, count(*) as n_equipos
      from equipo_partido x
      join equipo_partido y on y.equipo_id = x.equipo_id and y.id > x.id
      join public.equipos e on e.id = x.equipo_id
      where x.ini < y.ini + y.dur and y.ini < x.ini + x.dur
      group by x.id, y.id
    ) pr
    join b pa on pa.id = pr.a
    join b pb on pb.id = pr.c
    union all
    select 'eliminatoria_antes_de_grupos', b.id, null, b.categoria_id,
           b.categoria || ': ' || b.nombre_llave || ' (' || b.h || ') empieza antes de que terminen los partidos de grupos ('
             || to_char(fg.fin at time zone 'America/Bogota', 'DD/MM HH24:MI') || ')', b.ini
    from b join fin_grupos fg on fg.categoria_id = b.categoria_id
    where b.fase <> 'grupos' and b.ini is not null and b.ini < fg.fin
    union all
    select 'debio_empezar', b.id, null, b.categoria_id,
           b.categoria || ': ' || b.cruce || ' (' || coalesce(b.cancha, 'sin cancha') || ', ' || b.h || ') ya debió empezar', b.ini
    from b
    where b.estado = 'programado' and b.ini is not null and b.ini < now() - interval '10 minutes'
  )
  select adv.tipo, adv.partido_id, adv.otro_partido_id, adv.categoria_id, adv.mensaje
  from adv
  order by adv.ini nulls first, adv.partido_id, adv.tipo;
$$;

comment on function public.advertencias_torneo(bigint) is
  'Advertencias del fixture de un torneo (partidos no finalizados). Hora de referencia: coalesce(hora_estimada, hora_programada); en_vivo usa inicio_real.';

revoke execute on function public.advertencias_torneo(bigint) from public, anon;
grant execute on function public.advertencias_torneo(bigint) to authenticated;
