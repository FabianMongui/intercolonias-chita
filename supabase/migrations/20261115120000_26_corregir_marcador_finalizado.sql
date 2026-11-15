-- 26: corregir el marcador de un partido finalizado.
-- * Solo el super admin puede agregar, cambiar o anular goles de un partido finalizado
--   (el admin de cancha solo toca goles mientras el partido está en vivo).
-- * Al corregir un partido finalizado se vuelven a resolver las llaves de su categoría
--   (solo cambian las eliminatorias que aún no inician: resolver_llaves ignora las demás).
-- El trigger se llama eventos_resolver_llaves para correr DESPUÉS de eventos_marcador (orden alfabético),
-- así resolver_llaves ve el marcador ya actualizado.
-- Los borrados en cascada (torneo, categoría, equipo, partido) llegan con pg_trigger_depth() > 1 y se ignoran
-- (mismo patrón que la migración 14).

create or replace function public.al_corregir_gol() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_id bigint; p public.partidos;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  -- En un UPDATE que mueva el gol de partido se revisan los dos partidos.
  for v_id in select distinct x from unnest(array[
      case when tg_op <> 'INSERT' then old.partido_id end,
      case when tg_op <> 'DELETE' then new.partido_id end]) as t(x) where x is not null loop
    select * into p from public.partidos where id = v_id;
    continue when not found or p.estado <> 'finalizado';
    if not public.es_super_admin() then
      raise exception 'El partido ya terminó: solo el super admin puede corregir el marcador';
    end if;
    perform public.resolver_llaves(p.categoria_id);
  end loop;
  return null;
end $$;

revoke all on function public.al_corregir_gol() from public, anon, authenticated;

drop trigger if exists eventos_resolver_llaves on public.eventos;
create trigger eventos_resolver_llaves after insert or update or delete on public.eventos
  for each row execute function public.al_corregir_gol();
