-- 22: el palmarés solo cuenta torneos marcados como reales, y el historial queda oculto de verdad
-- (no solo en la UI) mientras ajustes.historial_publico = false, salvo para el super admin activo.

-- 1) Marca de torneo real (los existentes son de prueba -> false)
alter table public.torneos
  add column cuenta_en_historial boolean not null default false;

-- 2) anon necesita poder evaluar es_super_admin() dentro de la vista (security_invoker).
--    Es seguro: solo devuelve boolean y para anon (auth.uid() null) siempre es false.
--    Una subconsulta a perfiles no sirve: anon no tiene grant sobre perfiles y el permiso
--    se valida al iniciar la consulta (error aunque la condición no se evalúe).
grant execute on function public.es_super_admin() to anon;

-- 3) Palmarés (mismas columnas y orden)
create or replace view public.palmares with (security_invoker = true) as
with app as (
  select
    'app'::text as origen,
    extract(year from t.fecha_inicio)::int as anio,
    t.tipo as tipo_torneo,
    c.nombre as categoria,
    t.id as torneo_id,
    eg.club_id as campeon_club_id,
    coalesce(cg.nombre, eg.nombre) as campeon_nombre,
    coalesce(cg.escudo_path, eg.escudo_path) as campeon_escudo_path,
    ep.club_id as subcampeon_club_id,
    coalesce(cp.nombre, ep.nombre) as subcampeon_nombre,
    coalesce(cp.escudo_path, ep.escudo_path) as subcampeon_escudo_path,
    (case when public.ganador(p) = p.equipo_local_id
          then p.goles_local || '-' || p.goles_visitante
          else p.goles_visitante || '-' || p.goles_local end)
    || case when p.penales_local is not null and p.penales_visitante is not null
            then ' (' || (case when public.ganador(p) = p.equipo_local_id
                               then p.penales_local || '-' || p.penales_visitante
                               else p.penales_visitante || '-' || p.penales_local end) || ' pen.)'
            else '' end as marcador_final
  from public.partidos p
  join public.categorias c on c.id = p.categoria_id
  join public.torneos t on t.id = c.torneo_id
  join public.equipos eg on eg.id = public.ganador(p)
  left join public.clubes cg on cg.id = eg.club_id
  left join public.equipos ep on ep.id = public.perdedor(p)
  left join public.clubes cp on cp.id = ep.club_id
  where p.fase = 'final' and p.estado = 'finalizado'
    and t.cuenta_en_historial
),
todo as (
  select * from app
  union all
  select
    'registro'::text, h.anio, h.tipo_torneo, h.categoria, null::bigint,
    h.campeon_club_id, cc.nombre, cc.escudo_path,
    h.subcampeon_club_id, cs.nombre, cs.escudo_path,
    h.marcador_final
  from public.campeones_historicos h
  join public.clubes cc on cc.id = h.campeon_club_id
  left join public.clubes cs on cs.id = h.subcampeon_club_id
  where not exists (
    select 1 from app a
    where a.anio = h.anio
      and lower(a.tipo_torneo) = lower(h.tipo_torneo)
      and translate(lower(btrim(a.categoria)), 'áéíóúüñ', 'aeiouun')
        = translate(lower(btrim(h.categoria)), 'áéíóúüñ', 'aeiouun')
  )
)
select * from todo
where coalesce((select a.historial_publico from public.ajustes a where a.id = 1), false)
   or (select public.es_super_admin());

-- 4) Títulos por club: hereda el filtro de palmares; se repite explícito por claridad
create or replace view public.titulos_por_club with (security_invoker = true) as
select cl.id as club_id, cl.nombre, cl.escudo_path, count(*)::int as titulos
from public.palmares pa
join public.clubes cl on cl.id = pa.campeon_club_id
where coalesce((select a.historial_publico from public.ajustes a where a.id = 1), false)
   or (select public.es_super_admin())
group by cl.id, cl.nombre, cl.escudo_path
order by titulos desc, cl.nombre;

-- 5) Grants de las vistas (sin cambios)
revoke all on public.palmares, public.titulos_por_club from anon, authenticated;
grant select on public.palmares, public.titulos_por_club to anon, authenticated;
