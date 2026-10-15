-- Exportada desde supabase_migrations.schema_migrations (version 20261014215359)
-- 13: RPC sortear_grupos (super admin). Reparte al azar los equipos sin grupo de una categoría
-- entre sus grupos, equilibrando tamaños (cuenta los ya asignados a mano, p. ej. cabezas de serie).
create or replace function public.sortear_grupos(p_categoria bigint)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_equipo bigint;
  v_grupo bigint;
  v_n integer := 0;
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.categorias where id = p_categoria) then
    raise exception 'Categoría no existe';
  end if;
  if not exists (select 1 from public.grupos where categoria_id = p_categoria) then
    raise exception 'Primero crea los grupos';
  end if;
  if exists (select 1 from public.partidos where categoria_id = p_categoria and fase = 'grupos') then
    raise exception 'La categoría ya tiene partidos de grupos; bórralos antes de cambiar los grupos';
  end if;

  -- Bloquea los equipos de la categoría para evitar dos sorteos simultáneos.
  perform 1 from public.equipos where categoria_id = p_categoria for update;

  for v_equipo in
    select id from public.equipos
    where categoria_id = p_categoria and grupo_id is null
    order by random()
  loop
    -- Grupo con menos equipos en este momento; empate al azar.
    select g.id into v_grupo
    from public.grupos g
    left join public.equipos e on e.grupo_id = g.id
    where g.categoria_id = p_categoria
    group by g.id
    order by count(e.id), random()
    limit 1;

    update public.equipos set grupo_id = v_grupo where id = v_equipo;
    v_n := v_n + 1;
  end loop;

  return v_n;
end $$;

revoke execute on function public.sortear_grupos(bigint) from public, anon;
grant execute on function public.sortear_grupos(bigint) to authenticated;
