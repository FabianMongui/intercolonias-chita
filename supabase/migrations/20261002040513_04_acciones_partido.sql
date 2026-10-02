-- Exportada desde supabase_migrations.schema_migrations (version 20261002040513)
create or replace function public.minuto_actual(p public.partidos) returns int
language sql stable security definer set search_path = '' as $$
  select case p.periodo
    when '1T' then ceil(extract(epoch from now() - p.inicio_real) / 60)::int
    when 'descanso' then c.minutos_por_tiempo
    when '2T' then c.minutos_por_tiempo + ceil(extract(epoch from now() - p.inicio_segundo_tiempo) / 60)::int
  end
  from public.categorias c where c.id = p.categoria_id;
$$;

create or replace function public.iniciar_partido(p_id bigint) returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.partidos set estado = 'en_vivo', periodo = '1T', inicio_real = now()
   where id = p_id and estado = 'programado' and equipo_local_id is not null and equipo_visitante_id is not null
  returning * into r;
  if not found then raise exception 'El partido no se puede iniciar (ya inició o faltan equipos)'; end if;
  return r;
end $$;

create or replace function public.medio_tiempo(p_id bigint) returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.partidos set periodo = 'descanso', fin_primer_tiempo = now()
   where id = p_id and estado = 'en_vivo' and periodo = '1T' returning * into r;
  if not found then raise exception 'El partido no está en el primer tiempo'; end if;
  return r;
end $$;

create or replace function public.iniciar_segundo_tiempo(p_id bigint) returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.partidos set periodo = '2T', inicio_segundo_tiempo = now()
   where id = p_id and estado = 'en_vivo' and periodo = 'descanso' returning * into r;
  if not found then raise exception 'El partido no está en el descanso'; end if;
  return r;
end $$;

create or replace function public.finalizar_partido(p_id bigint, p_penales_local int default null, p_penales_visitante int default null)
returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select * into r from public.partidos where id = p_id for update;
  if not found or r.estado <> 'en_vivo' then raise exception 'El partido no está en vivo'; end if;
  if r.fase <> 'grupos' and r.goles_local = r.goles_visitante then
    if p_penales_local is null or p_penales_visitante is null or p_penales_local = p_penales_visitante then
      raise exception 'Partido de eliminación empatado: registra los penales (con un ganador)';
    end if;
  else
    p_penales_local := null; p_penales_visitante := null;
  end if;
  update public.partidos set estado = 'finalizado', periodo = null, fin_real = now(),
    penales_local = p_penales_local, penales_visitante = p_penales_visitante
   where id = p_id returning * into r;
  return r;
end $$;

create or replace function public.registrar_gol(p_partido bigint, p_equipo bigint, p_jugador bigint default null, p_autogol boolean default false)
returns public.eventos
language plpgsql security definer set search_path = '' as $$
declare p public.partidos; ev public.eventos;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select * into p from public.partidos where id = p_partido;
  if not found then raise exception 'Partido no existe'; end if;
  if p.estado = 'programado' then raise exception 'El partido no ha iniciado'; end if;
  if p_equipo not in (p.equipo_local_id, p.equipo_visitante_id) then raise exception 'El equipo no juega este partido'; end if;
  insert into public.eventos (partido_id, equipo_id, jugador_id, tipo, autogol, minuto, periodo)
  values (p_partido, p_equipo, p_jugador, 'gol', p_autogol, public.minuto_actual(p), p.periodo)
  returning * into ev;
  return ev;
end $$;

-- ===== Permisos de ejecución =====
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function public.ahora() to anon;
grant execute on function public.ganador(public.partidos) to anon;
grant execute on function public.perdedor(public.partidos) to anon;
grant execute on function public.minuto_actual(public.partidos) to anon;
revoke execute on function public.crear_perfil(), public.actualizar_marcador(), public.al_cambiar_estado(),
  public.resolver_llaves(bigint), public.recalcular_estimados(bigint) from authenticated;
