-- 15: borrar los partidos de una categoría para regenerar el fixture, solo si ninguno ha empezado.
create or replace function public.borrar_partidos_categoria(p_categoria bigint) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_n integer;
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.categorias where id = p_categoria) then raise exception 'Categoría no existe'; end if;
  perform 1 from public.partidos where categoria_id = p_categoria for update;
  if exists (select 1 from public.partidos where categoria_id = p_categoria and estado <> 'programado') then
    raise exception 'Ya hay partidos iniciados o jugados en esta categoría; no se pueden borrar';
  end if;
  delete from public.partidos where categoria_id = p_categoria;
  get diagnostics v_n = row_count;
  return v_n;
end; $$;
revoke all on function public.borrar_partidos_categoria(bigint) from public, anon;
grant execute on function public.borrar_partidos_categoria(bigint) to authenticated;
