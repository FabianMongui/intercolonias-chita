-- 21: clubes (identidad de un equipo entre torneos), campeones históricos cargados a mano,
-- ajustes globales (una fila) y vistas públicas palmares / titulos_por_club. Solo agrega.

-- 1) Clubes
create table public.clubes (
  id bigint generated always as identity primary key,
  nombre text not null unique check (nombre = btrim(nombre) and nombre <> ''),
  escudo_path text,
  created_at timestamptz not null default now()
);

-- 2) Equipo -> club (opcional)
alter table public.equipos
  add column club_id bigint references public.clubes(id) on delete set null;
create index equipos_club_id_idx on public.equipos (club_id);

-- 3) Campeones de torneos anteriores a la app
create table public.campeones_historicos (
  id bigint generated always as identity primary key,
  anio int not null check (anio between 1990 and 2100),
  tipo_torneo text not null default 'intercolonias',
  categoria text not null check (categoria = btrim(categoria) and categoria <> ''),
  campeon_club_id bigint not null references public.clubes(id) on delete restrict,
  subcampeon_club_id bigint references public.clubes(id) on delete set null,
  marcador_final text,
  nota text,
  created_at timestamptz not null default now(),
  constraint campeones_historicos_unico unique (anio, tipo_torneo, categoria),
  constraint campeones_historicos_sub_distinto check (subcampeon_club_id is distinct from campeon_club_id)
);
create index campeones_historicos_campeon_idx on public.campeones_historicos (campeon_club_id);
create index campeones_historicos_subcampeon_idx on public.campeones_historicos (subcampeon_club_id);

-- 4) Ajustes globales (una sola fila)
create table public.ajustes (
  id smallint primary key default 1 check (id = 1),
  historial_publico boolean not null default false
);
insert into public.ajustes (id) values (1);

-- 5) RLS (mismo patrón de la 07: un SELECT público, escrituras separadas solo super admin)
alter table public.clubes enable row level security;
alter table public.campeones_historicos enable row level security;
alter table public.ajustes enable row level security;

do $$
declare t text;
begin
  foreach t in array array['clubes','campeones_historicos'] loop
    execute format('create policy "lectura publica" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "super admin inserta" on public.%I for insert to authenticated with check ((select public.es_super_admin()))', t);
    execute format('create policy "super admin actualiza" on public.%I for update to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()))', t);
    execute format('create policy "super admin borra" on public.%I for delete to authenticated using ((select public.es_super_admin()))', t);
  end loop;
end $$;

create policy "lectura publica" on public.ajustes for select to anon, authenticated using (true);
create policy "super admin actualiza" on public.ajustes for update to authenticated
  using ((select public.es_super_admin())) with check ((select public.es_super_admin()));

-- Grants explícitos (no depender solo de los default privileges)
revoke all on public.clubes, public.campeones_historicos, public.ajustes from anon, authenticated;
grant select on public.clubes, public.campeones_historicos, public.ajustes to anon;
grant select, insert, update, delete on public.clubes, public.campeones_historicos to authenticated;
grant select, update on public.ajustes to authenticated;

-- 6) Palmarés: finales jugadas en la app + registro histórico (sin duplicar la misma edición)
create view public.palmares with (security_invoker = true) as
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
)
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
);

-- 7) Títulos por club (solo clubes con al menos un título)
create view public.titulos_por_club with (security_invoker = true) as
select cl.id as club_id, cl.nombre, cl.escudo_path, count(*)::int as titulos
from public.palmares pa
join public.clubes cl on cl.id = pa.campeon_club_id
group by cl.id, cl.nombre, cl.escudo_path
order by titulos desc, cl.nombre;

-- 8) Grants de las vistas
revoke all on public.palmares, public.titulos_por_club from anon, authenticated;
grant select on public.palmares, public.titulos_por_club to anon, authenticated;
