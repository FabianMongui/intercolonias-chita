-- Tabla de posiciones "en vivo": igual que public.posiciones pero contando también
-- los partidos de grupos en curso (con su marcador actual). La vista oficial
-- public.posiciones NO cambia (resolver_ref la usa para definir clasificados).
create view public.posiciones_en_vivo
with (security_invoker = true) as
with res as (
  select p.equipo_local_id as equipo_id, p.goles_local as gf, p.goles_visitante as gc
    from public.partidos p
   where p.fase = 'grupos' and p.estado in ('finalizado', 'en_vivo')
  union all
  select p.equipo_visitante_id, p.goles_visitante, p.goles_local
    from public.partidos p
   where p.fase = 'grupos' and p.estado in ('finalizado', 'en_vivo')
), vivos as (
  select distinct x.equipo_id
    from public.partidos p
   cross join lateral (values (p.equipo_local_id), (p.equipo_visitante_id)) as x(equipo_id)
   where p.fase = 'grupos' and p.estado = 'en_vivo' and x.equipo_id is not null
), agg as (
  select e.categoria_id,
         e.grupo_id,
         g.nombre as grupo,
         e.id as equipo_id,
         e.nombre as equipo,
         e.escudo_path,
         count(r.equipo_id)::integer as pj,
         count(*) filter (where r.gf > r.gc)::integer as pg,
         count(*) filter (where r.gf = r.gc)::integer as pe,
         count(*) filter (where r.gf < r.gc)::integer as pp,
         coalesce(sum(r.gf), 0::bigint)::integer as gf,
         coalesce(sum(r.gc), 0::bigint)::integer as gc
    from public.equipos e
    join public.grupos g on g.id = e.grupo_id
    left join res r on r.equipo_id = e.id
   group by e.id, g.nombre
)
select a.categoria_id,
       a.grupo_id,
       a.grupo,
       a.equipo_id,
       a.equipo,
       a.escudo_path,
       a.pj,
       a.pg,
       a.pe,
       a.pp,
       a.gf,
       a.gc,
       a.gf - a.gc as dg,
       a.pg * 3 + a.pe as puntos,
       row_number() over (partition by a.grupo_id
                          order by (a.pg * 3 + a.pe) desc, (a.gf - a.gc) desc, a.gf desc, a.equipo)::integer as posicion,
       (v.equipo_id is not null) as en_juego,
       po.posicion as posicion_oficial
  from agg a
  left join vivos v on v.equipo_id = a.equipo_id
  left join public.posiciones po on po.equipo_id = a.equipo_id;

comment on view public.posiciones_en_vivo is
  'Posiciones contando partidos de grupos finalizados y en vivo (marcador actual). en_juego: tiene partido de grupos en_vivo. posicion_oficial: posicion en public.posiciones (solo finalizados).';

revoke all on public.posiciones_en_vivo from public, anon, authenticated;
grant select on public.posiciones_en_vivo to anon, authenticated;
