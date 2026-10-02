-- Exportada desde supabase_migrations.schema_migrations (version 20261002040322)
-- ===== Roles =====
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and activo);
$$;

create or replace function public.es_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and activo and rol = 'super_admin');
$$;

-- Perfil automático (inactivo) al crear usuario: el super admin lo activa
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.crear_perfil();

-- Hora del servidor (para sincronizar el reloj de los partidos en el navegador)
create or replace function public.ahora() returns timestamptz
language sql stable as $$ select now() $$;

-- ===== Tabla de posiciones (3 / 1 / 0; desempate: DG, GF) =====
create view public.posiciones with (security_invoker = true) as
with res as (
  select equipo_local_id as equipo_id, goles_local as gf, goles_visitante as gc
  from public.partidos where fase = 'grupos' and estado = 'finalizado'
  union all
  select equipo_visitante_id, goles_visitante, goles_local
  from public.partidos where fase = 'grupos' and estado = 'finalizado'
), agg as (
  select e.categoria_id, e.grupo_id, g.nombre as grupo, e.id as equipo_id, e.nombre as equipo, e.escudo_path,
    count(r.equipo_id)::int as pj,
    count(*) filter (where r.gf > r.gc)::int as pg,
    count(*) filter (where r.gf = r.gc)::int as pe,
    count(*) filter (where r.gf < r.gc)::int as pp,
    coalesce(sum(r.gf), 0)::int as gf,
    coalesce(sum(r.gc), 0)::int as gc
  from public.equipos e
  join public.grupos g on g.id = e.grupo_id
  left join res r on r.equipo_id = e.id
  group by e.id, g.nombre
)
select *, (gf - gc) as dg, (pg * 3 + pe) as puntos,
  row_number() over (partition by grupo_id order by (pg * 3 + pe) desc, (gf - gc) desc, gf desc, equipo)::int as posicion
from agg;
comment on view public.posiciones is 'Orden: puntos, diferencia de gol, goles a favor. Empate total: alfabético (pendiente 3ra regla).';

-- ===== Goleadores =====
create view public.goleadores with (security_invoker = true) as
select eq.categoria_id, j.id as jugador_id, j.nombre as jugador, j.numero,
  eq.id as equipo_id, eq.nombre as equipo, eq.escudo_path, count(*)::int as goles
from public.eventos ev
join public.jugadores j on j.id = ev.jugador_id
join public.equipos eq on eq.id = j.equipo_id
where ev.tipo = 'gol' and not ev.autogol
group by eq.categoria_id, j.id, eq.id;

-- ===== Marcador automático desde eventos =====
create or replace function public.actualizar_marcador() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pid bigint := coalesce(new.partido_id, old.partido_id);
begin
  update public.partidos p set
    goles_local = (select count(*) from public.eventos e where e.partido_id = pid and e.tipo = 'gol' and e.equipo_id = p.equipo_local_id),
    goles_visitante = (select count(*) from public.eventos e where e.partido_id = pid and e.tipo = 'gol' and e.equipo_id = p.equipo_visitante_id)
  where p.id = pid;
  return null;
end $$;
create trigger eventos_marcador after insert or update or delete on public.eventos
  for each row execute function public.actualizar_marcador();

-- ===== Ganador / perdedor =====
create or replace function public.ganador(p public.partidos) returns bigint
language sql immutable as $$
  select case when p.estado <> 'finalizado' then null
    when p.goles_local > p.goles_visitante then p.equipo_local_id
    when p.goles_local < p.goles_visitante then p.equipo_visitante_id
    when p.penales_local > p.penales_visitante then p.equipo_local_id
    when p.penales_local < p.penales_visitante then p.equipo_visitante_id end;
$$;
create or replace function public.perdedor(p public.partidos) returns bigint
language sql immutable as $$
  select case when public.ganador(p) = p.equipo_local_id then p.equipo_visitante_id
              when public.ganador(p) = p.equipo_visitante_id then p.equipo_local_id end;
$$;
