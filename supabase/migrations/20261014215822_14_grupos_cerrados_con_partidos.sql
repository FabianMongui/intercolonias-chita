-- 14: si una categoría ya tiene partidos de fase 'grupos', sus grupos (y la asignación de equipos) quedan cerrados.
-- Los borrados en cascada (torneo/categoría) no se bloquean: las acciones de FK corren dentro de triggers RI
-- (pg_trigger_depth() > 1), mientras que un DML directo sobre la tabla tiene depth 1.

create or replace function public.validar_grupos_sin_partidos()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then return coalesce(new, old); end if;
  if exists (
    select 1 from public.partidos p
    where p.fase = 'grupos'
      and p.categoria_id in (old.categoria_id, new.categoria_id)
  ) then
    raise exception 'La categoría ya tiene partidos de grupos; bórralos antes de cambiar los grupos';
  end if;
  return coalesce(new, old);
end $$;

create or replace function public.validar_equipo_grupo_sin_partidos()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if exists (
    select 1 from public.partidos p
    where p.fase = 'grupos'
      and p.categoria_id in (old.categoria_id, new.categoria_id)
  ) then
    raise exception 'La categoría ya tiene partidos de grupos; bórralos antes de cambiar los grupos';
  end if;
  return new;
end $$;

create trigger grupos_cerrados_con_partidos
  before insert or update or delete on public.grupos
  for each row execute function public.validar_grupos_sin_partidos();

create trigger equipos_grupo_cerrado_con_partidos
  before update of grupo_id on public.equipos
  for each row
  when (old.grupo_id is distinct from new.grupo_id)
  execute function public.validar_equipo_grupo_sin_partidos();

revoke execute on function public.validar_grupos_sin_partidos() from public, anon, authenticated;
revoke execute on function public.validar_equipo_grupo_sin_partidos() from public, anon, authenticated;
