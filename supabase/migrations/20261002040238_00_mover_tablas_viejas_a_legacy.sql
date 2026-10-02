-- Exportada desde supabase_migrations.schema_migrations (version 20261002040238)
create schema if not exists legacy;
revoke all on schema legacy from anon, authenticated;
alter table public.products set schema legacy;
alter table public.bracket_final set schema legacy;
alter table public.bracket_campeon set schema legacy;
alter table public.bracket_tercer_puesto set schema legacy;
alter table public.jugadores set schema legacy;
alter table public.partidos set schema legacy;
alter table public.equipos set schema legacy;
alter table public.categorias set schema legacy;
