-- 20: nadie se quita su propio rol ni se desactiva, y siempre queda al menos un super admin activo.
-- (Desde el editor SQL / service role auth.uid() es null: el dueño siempre puede arreglar desde Supabase.)

-- Antes de cada cambio: bloquea el auto-cambio de rol/activo y serializa los cambios que tocan super admins.
create or replace function public.perfiles_proteger_propio() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and auth.uid() is not null and old.id = auth.uid()
     and (new.rol is distinct from old.rol or new.activo is distinct from old.activo) then
    raise exception 'No puedes cambiar tu propio rol ni desactivarte' using errcode = '42501';
  end if;
  if old.rol = 'super_admin' and old.activo then
    perform pg_advisory_xact_lock(hashtext('public.perfiles.super_admin'));
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

-- Después de cada sentencia: debe quedar al menos un super admin activo.
-- security definer: el conteo ve todas las filas sin depender de la RLS de quien hace el cambio.
create or replace function public.perfiles_exigir_super_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('public.perfiles.super_admin'));
  perform 1 from public.perfiles where rol = 'super_admin' and activo for share;
  if not found then
    raise exception 'Debe quedar al menos un super admin activo' using errcode = '23514';
  end if;
  return null;
end $$;

revoke execute on function public.perfiles_proteger_propio() from public, anon, authenticated;
revoke execute on function public.perfiles_exigir_super_admin() from public, anon, authenticated;

create trigger perfiles_proteger_propio before update or delete on public.perfiles
  for each row execute function public.perfiles_proteger_propio();
create trigger perfiles_exigir_super_admin after update or delete on public.perfiles
  for each statement execute function public.perfiles_exigir_super_admin();
