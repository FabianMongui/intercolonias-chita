-- 16: reprogramar pendientes desde la hora del servidor (no del celular)
-- y bloquear la programación "desde el inicio" cuando el torneo ya empezó.

create or replace function public.programar_horarios(p_torneo bigint, p_desde timestamptz default null) returns int
language plpgsql security definer set search_path = '' as $$
declare
  t public.torneos; p record; c record; v_inicio timestamptz; v_dur interval;
  v_min timestamptz; s timestamptz; v_best_c bigint; v_best_t timestamptz; v_count int := 0;
  c_libre jsonb := '{}'; e_libre jsonb := '{}'; f_libre jsonb := '{}'; v_fin timestamptz; k int;
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  select * into t from public.torneos where id = p_torneo;
  if not found then raise exception 'Torneo no existe'; end if;
  if p_desde is null and exists (
       select 1 from public.partidos pa join public.categorias ca on ca.id = pa.categoria_id
       where ca.torneo_id = p_torneo and pa.estado <> 'programado') then
    raise exception 'El torneo ya empezó; usa "Reprogramar pendientes desde ahora"';
  end if;
  v_inicio := coalesce(p_desde, (t.fecha_inicio + t.hora_inicio_jornada) at time zone 'America/Bogota');

  for c in select k2.id, greatest(v_inicio, (select max(pa.inicio_real + public.duracion_slot(pa.categoria_id))
                 from public.partidos pa where pa.cancha_id = k2.id and pa.estado = 'en_vivo')) libre
           from public.canchas k2 where k2.torneo_id = p_torneo and k2.activa loop
    c_libre := c_libre || jsonb_build_object(c.id::text, c.libre);
  end loop;

  for p in
    select pa.id, pa.categoria_id, pa.equipo_local_id, pa.equipo_visitante_id,
           ca.tipo_cancha, ca.cancha_fija_id,
           case pa.fase when 'grupos' then 1 when 'semifinal' then 2 when 'tercer_puesto' then 3 else 4 end as fr
    from public.partidos pa join public.categorias ca on ca.id = pa.categoria_id
    where ca.torneo_id = p_torneo and pa.estado = 'programado'
    order by fr, pa.ronda nulls last, ca.orden, pa.id
  loop
    v_dur := public.duracion_slot(p.categoria_id);
    v_min := v_inicio;
    for k in 1 .. p.fr - 1 loop
      v_min := greatest(v_min, (f_libre ->> (p.categoria_id || ':' || k))::timestamptz);
    end loop;
    v_min := greatest(v_min, (e_libre ->> p.equipo_local_id::text)::timestamptz,
                             (e_libre ->> p.equipo_visitante_id::text)::timestamptz);
    v_best_c := null; v_best_t := null;
    for c in select k2.id, (c_libre ->> k2.id::text)::timestamptz libre from public.canchas k2
             where c_libre ? k2.id::text
               and ((p.cancha_fija_id is not null and k2.id = p.cancha_fija_id)
                 or (p.cancha_fija_id is null and k2.tipo = p.tipo_cancha))
             order by 2, k2.orden loop
      s := public.ajustar_jornada(greatest(v_min, c.libre), v_dur, t.hora_inicio_jornada, t.hora_fin_jornada);
      if v_best_t is null or s < v_best_t then v_best_t := s; v_best_c := c.id; end if;
    end loop;
    if v_best_c is null then
      raise exception 'No hay cancha activa disponible para la categoría %', p.categoria_id;
    end if;

    v_fin := v_best_t + v_dur;
    update public.partidos set cancha_id = v_best_c, hora_programada = v_best_t, hora_estimada = v_best_t where id = p.id;
    c_libre := c_libre || jsonb_build_object(v_best_c::text, v_fin);
    if p.equipo_local_id is not null then e_libre := e_libre || jsonb_build_object(p.equipo_local_id::text, v_fin); end if;
    if p.equipo_visitante_id is not null then e_libre := e_libre || jsonb_build_object(p.equipo_visitante_id::text, v_fin); end if;
    f_libre := f_libre || jsonb_build_object(p.categoria_id || ':' || p.fr,
                 greatest(v_fin, (f_libre ->> (p.categoria_id || ':' || p.fr))::timestamptz));
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

create or replace function public.reprogramar_pendientes(p_torneo bigint) returns integer
language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  return public.programar_horarios(p_torneo, now());
end $$;

revoke all on function public.programar_horarios(bigint, timestamptz) from public, anon;
grant execute on function public.programar_horarios(bigint, timestamptz) to authenticated;
revoke all on function public.reprogramar_pendientes(bigint) from public, anon;
grant execute on function public.reprogramar_pendientes(bigint) to authenticated;
