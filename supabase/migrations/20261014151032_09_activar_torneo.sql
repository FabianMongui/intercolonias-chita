-- Exportada desde supabase_migrations.schema_migrations (version 20261014151032)
-- 09: RPC activar_torneo (super admin). Deja un solo torneo activo:
-- desactiva el resto antes de activar el elegido para respetar el índice único parcial torneos_un_solo_activo.

create or replace function public.activar_torneo(p_id bigint)
returns public.torneos
language plpgsql security definer set search_path = '' as $$
declare r public.torneos;
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.torneos where id = p_id) then
    raise exception 'Torneo no existe';
  end if;
  -- Primero se desactiva el resto para respetar el índice único parcial torneos_un_solo_activo.
  update public.torneos set activo = false where activo and id <> p_id;
  update public.torneos set activo = true where id = p_id returning * into r;
  return r;
end $$;

revoke execute on function public.activar_torneo(bigint) from public, anon;
grant execute on function public.activar_torneo(bigint) to authenticated;
