-- remove() de Storage necesita SELECT además de DELETE. Solo super admin; anon lee por URL pública.
create policy "escudos: super admin lee" on storage.objects for select to authenticated
  using (bucket_id = 'escudos' and (select public.es_super_admin()));
