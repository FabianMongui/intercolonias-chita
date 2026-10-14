-- Exportada desde supabase_migrations.schema_migrations (version 20261007041909)
-- 08: RPC reprogramar_partido (admin) y UPDATE directo de partidos solo para super admin.
-- Los admin siguen operando partidos via RPC security definer (iniciar, goles, finalizar, reprogramar).

create or replace function public.reprogramar_partido(p_id bigint, p_hora timestamptz default null, p_cancha bigint default null)
returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos; cat public.categorias; ca public.canchas;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select * into r from public.partidos where id = p_id for update;
  if not found or r.estado <> 'programado' then
    raise exception 'Solo se puede reprogramar un partido que no ha iniciado';
  end if;
  if p_hora is null and p_cancha is null then raise exception 'No hay cambios'; end if;
  select * into cat from public.categorias where id = r.categoria_id;
  if p_cancha is not null then
    select * into ca from public.canchas where id = p_cancha and torneo_id = cat.torneo_id;
    if not found then raise exception 'La cancha no existe en este torneo'; end if;
    if not ca.activa then raise exception 'La cancha no está activa'; end if;
    if ca.tipo <> cat.tipo_cancha then raise exception 'La cancha no es del tipo de esta categoría'; end if;
    if cat.cancha_fija_id is not null and cat.cancha_fija_id <> p_cancha then
      raise exception 'Esta categoría solo juega en su cancha fija';
    end if;
  end if;
  -- hora_estimada parte de la hora programada; recalcular_estimados la ajusta si hay cancha.
  update public.partidos
     set hora_programada = coalesce(p_hora, hora_programada),
         cancha_id = coalesce(p_cancha, cancha_id),
         hora_estimada = coalesce(p_hora, hora_programada)
   where id = p_id;
  perform public.recalcular_estimados(cat.torneo_id);
  select * into r from public.partidos where id = p_id;
  return r;
end $$;

revoke execute on function public.reprogramar_partido(bigint, timestamptz, bigint) from public, anon;
grant execute on function public.reprogramar_partido(bigint, timestamptz, bigint) to authenticated;

-- UPDATE directo de partidos: solo super admin
drop policy "admin edita" on public.partidos;
create policy "super admin actualiza" on public.partidos for update to authenticated
  using ((select public.es_super_admin())) with check ((select public.es_super_admin()));
