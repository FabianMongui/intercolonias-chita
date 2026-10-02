-- Exportada desde supabase_migrations.schema_migrations (version 20261002040659)
alter function public.ahora() set search_path = '';
alter function public.ganador(public.partidos) set search_path = '';
alter function public.perdedor(public.partidos) set search_path = '';
alter function public.ajustar_jornada(timestamptz, interval, time, time) set search_path = '';
alter function public.minuto_actual(public.partidos) security invoker;

revoke execute on function public.duracion_slot(bigint), public.resolver_ref(bigint, text),
  public.ajustar_jornada(timestamptz, interval, time, time) from authenticated, anon, public;

revoke all on all tables in schema legacy from anon, authenticated;
revoke select on public.perfiles from anon;

create index on public.categorias (cancha_fija_id);
create index on public.eventos (equipo_id);
create index on public.eventos (created_by);
create index on public.partidos (equipo_local_id);
create index on public.partidos (equipo_visitante_id);
create index on public.partidos (grupo_id);
create index on public.perfiles (cancha_id);
