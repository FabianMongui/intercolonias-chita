-- Exportada desde supabase_migrations.schema_migrations (version 20261002065137)
-- 07: politicas de escritura separadas por operacion (una sola politica SELECT por rol)
-- y permisos minimos para anon/authenticated. La semantica de acceso no cambia.

-- 1) Tablas configurables por el super admin: "super admin escribe" (FOR ALL) -> insert/update/delete
do $$
declare t text;
begin
  foreach t in array array['torneos','canchas','categorias','grupos','equipos','jugadores'] loop
    execute format('drop policy "super admin escribe" on public.%I', t);
    execute format('create policy "super admin inserta" on public.%I for insert to authenticated with check ((select public.es_super_admin()))', t);
    execute format('create policy "super admin actualiza" on public.%I for update to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()))', t);
    execute format('create policy "super admin borra" on public.%I for delete to authenticated using ((select public.es_super_admin()))', t);
  end loop;
end $$;

-- 2) eventos: "admin escribe" (FOR ALL) -> insert/update/delete
drop policy "admin escribe" on public.eventos;
create policy "admin inserta" on public.eventos for insert to authenticated
  with check ((select public.es_admin()));
create policy "admin actualiza" on public.eventos for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "admin borra" on public.eventos for delete to authenticated
  using ((select public.es_admin()));

-- 3) perfiles: "ver perfil" ya cubre (id = uid) OR super admin, que es la union exacta con la
--    parte SELECT de "super admin gestiona". Se deja como unica politica SELECT.
drop policy "super admin gestiona" on public.perfiles;
create policy "super admin inserta" on public.perfiles for insert to authenticated
  with check ((select public.es_super_admin()));
create policy "super admin actualiza" on public.perfiles for update to authenticated
  using ((select public.es_super_admin())) with check ((select public.es_super_admin()));
create policy "super admin borra" on public.perfiles for delete to authenticated
  using ((select public.es_super_admin()));

-- 4) Grants de objetos existentes (tablas y vistas de public)
--    anon: solo SELECT. authenticated: select/insert/update/delete gobernados por RLS
--    (TRUNCATE salta RLS; MAINTAIN de PG17 permite LOCK/VACUUM/REFRESH).
revoke insert, update, delete, truncate, references, trigger, maintain
  on all tables in schema public from anon;
revoke truncate, references, trigger, maintain
  on all tables in schema public from authenticated;
--    Secuencias: anon no inserta, no necesita ninguna.
revoke all on all sequences in schema public from anon;

-- 5) Default privileges para objetos futuros creados por postgres.
--    (Los de supabase_admin no se pueden alterar desde el rol postgres.)
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger, maintain on tables from anon;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
