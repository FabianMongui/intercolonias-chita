-- Exportada desde supabase_migrations.schema_migrations (version 20261002040545)
alter table public.torneos   enable row level security;
alter table public.canchas   enable row level security;
alter table public.categorias enable row level security;
alter table public.grupos    enable row level security;
alter table public.equipos   enable row level security;
alter table public.jugadores enable row level security;
alter table public.partidos  enable row level security;
alter table public.eventos   enable row level security;
alter table public.perfiles  enable row level security;

-- Lectura pública
create policy "lectura publica" on public.torneos    for select to anon, authenticated using (true);
create policy "lectura publica" on public.canchas    for select to anon, authenticated using (true);
create policy "lectura publica" on public.categorias for select to anon, authenticated using (true);
create policy "lectura publica" on public.grupos     for select to anon, authenticated using (true);
create policy "lectura publica" on public.equipos    for select to anon, authenticated using (true);
create policy "lectura publica" on public.jugadores  for select to anon, authenticated using (true);
create policy "lectura publica" on public.partidos   for select to anon, authenticated using (true);
create policy "lectura publica" on public.eventos    for select to anon, authenticated using (true);

-- Configuración: solo super admin
create policy "super admin escribe" on public.torneos    for all to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()));
create policy "super admin escribe" on public.canchas    for all to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()));
create policy "super admin escribe" on public.categorias for all to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()));
create policy "super admin escribe" on public.grupos     for all to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()));
create policy "super admin escribe" on public.equipos    for all to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()));
create policy "super admin escribe" on public.jugadores  for all to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()));

-- Partidos: crear/borrar super admin; editar (horas, cancha, correcciones) cualquier admin activo
create policy "super admin crea" on public.partidos for insert to authenticated with check ((select public.es_super_admin()));
create policy "super admin borra" on public.partidos for delete to authenticated using ((select public.es_super_admin()));
create policy "admin edita" on public.partidos for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));

-- Eventos (goles): cualquier admin activo
create policy "admin escribe" on public.eventos for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));

-- Perfiles: cada uno ve el suyo; el super admin gestiona todos
create policy "ver perfil" on public.perfiles for select to authenticated using (id = (select auth.uid()) or (select public.es_super_admin()));
create policy "super admin gestiona" on public.perfiles for all to authenticated using ((select public.es_super_admin())) with check ((select public.es_super_admin()));

-- Las vistas se leen públicamente
grant select on public.posiciones, public.goleadores to anon, authenticated;

-- ===== Storage: bucket público para escudos (máx 1 MB, solo imágenes) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('escudos', 'escudos', true, 1048576, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "escudos: super admin sube" on storage.objects for insert to authenticated
  with check (bucket_id = 'escudos' and (select public.es_super_admin()));
create policy "escudos: super admin edita" on storage.objects for update to authenticated
  using (bucket_id = 'escudos' and (select public.es_super_admin()));
create policy "escudos: super admin borra" on storage.objects for delete to authenticated
  using (bucket_id = 'escudos' and (select public.es_super_admin()));

-- ===== Realtime =====
alter publication supabase_realtime add table public.partidos, public.eventos;
