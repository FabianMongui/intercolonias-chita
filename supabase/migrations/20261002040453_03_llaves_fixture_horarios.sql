-- Exportada desde supabase_migrations.schema_migrations (version 20261002040453)
-- ===== Resolver referencias de eliminatorias ("1A", "G:12", "P:12") =====
create or replace function public.resolver_ref(p_categoria bigint, p_ref text) returns bigint
language plpgsql stable security definer set search_path = '' as $$
declare m text[]; v_grupo bigint; v_partido public.partidos;
begin
  if p_ref is null then return null; end if;
  m := regexp_match(p_ref, '^([0-9]+)([A-Z]{1,2})$');
  if m is not null then
    select id into v_grupo from public.grupos where categoria_id = p_categoria and nombre = m[2];
    if v_grupo is null then return null; end if;
    if exists (select 1 from public.partidos where grupo_id = v_grupo and fase = 'grupos' and estado <> 'finalizado')
       or not exists (select 1 from public.partidos where grupo_id = v_grupo and fase = 'grupos') then
      return null;
    end if;
    return (select equipo_id from public.posiciones where grupo_id = v_grupo and posicion = m[1]::int);
  end if;
  m := regexp_match(p_ref, '^([GP]):([0-9]+)$');
  if m is not null then
    select * into v_partido from public.partidos where id = m[2]::bigint;
    if not found then return null; end if;
    return case m[1] when 'G' then public.ganador(v_partido) else public.perdedor(v_partido) end;
  end if;
  return null;
end $$;

create or replace function public.resolver_llaves(p_categoria bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select * from public.partidos
           where categoria_id = p_categoria and fase <> 'grupos' and estado = 'programado'
           order by id loop
    update public.partidos set
      equipo_local_id = case when r.ref_local is null then equipo_local_id
                             else coalesce(public.resolver_ref(p_categoria, r.ref_local), equipo_local_id) end,
      equipo_visitante_id = case when r.ref_visitante is null then equipo_visitante_id
                             else coalesce(public.resolver_ref(p_categoria, r.ref_visitante), equipo_visitante_id) end
    where id = r.id;
  end loop;
end $$;

create or replace function public.duracion_slot(p_categoria bigint) returns interval
language sql stable security definer set search_path = '' as $$
  select make_interval(mins => 2 * c.minutos_por_tiempo + c.minutos_descanso + t.minutos_entre_partidos)
  from public.categorias c join public.torneos t on t.id = c.torneo_id where c.id = p_categoria;
$$;

-- ===== Horas estimadas según retrasos (por cancha) =====
create or replace function public.recalcular_estimados(p_torneo bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare c record; p record; v_cursor timestamptz; v_est timestamptz;
begin
  for c in select id from public.canchas where torneo_id = p_torneo loop
    v_cursor := now();
    select max(pa.inicio_real + public.duracion_slot(pa.categoria_id)) into v_est
      from public.partidos pa where pa.cancha_id = c.id and pa.estado = 'en_vivo';
    v_cursor := greatest(v_cursor, v_est);
    for p in select id, categoria_id, hora_programada from public.partidos
             where cancha_id = c.id and estado = 'programado' and hora_programada is not null
             order by hora_programada loop
      v_est := greatest(p.hora_programada, v_cursor);
      update public.partidos set hora_estimada = v_est where id = p.id;
      v_cursor := v_est + public.duracion_slot(p.categoria_id);
    end loop;
  end loop;
end $$;

create or replace function public.al_cambiar_estado() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_torneo bigint;
begin
  if new.estado = 'finalizado' then
    perform public.resolver_llaves(new.categoria_id);
  end if;
  select torneo_id into v_torneo from public.categorias where id = new.categoria_id;
  perform public.recalcular_estimados(v_torneo);
  return null;
end $$;
create trigger partidos_estado after update of estado on public.partidos
  for each row when (old.estado is distinct from new.estado)
  execute function public.al_cambiar_estado();

-- ===== Generar partidos de una categoría (requiere que no tenga partidos) =====
create or replace function public.generar_partidos_categoria(p_categoria bigint) returns int
language plpgsql security definer set search_path = '' as $$
declare
  g record; v_eqs bigint[]; n int; r int; i int; a bigint; b bigint;
  v_grupos text[]; sf1 bigint; sf2 bigint; v_count int := 0;
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  if exists (select 1 from public.partidos where categoria_id = p_categoria) then
    raise exception 'La categoría ya tiene partidos. Bórralos primero para regenerar.';
  end if;

  for g in select * from public.grupos where categoria_id = p_categoria order by nombre loop
    select array_agg(id order by id) into v_eqs from public.equipos where grupo_id = g.id;
    n := coalesce(array_length(v_eqs, 1), 0);
    continue when n < 2;
    if n % 2 = 1 then v_eqs := array_append(v_eqs, null::bigint); n := n + 1; end if;
    for r in 1 .. n - 1 loop
      for i in 1 .. n / 2 loop
        a := v_eqs[i]; b := v_eqs[n + 1 - i];
        if a is not null and b is not null then
          insert into public.partidos (categoria_id, fase, grupo_id, ronda, equipo_local_id, equipo_visitante_id)
          values (p_categoria, 'grupos', g.id, r,
                  case when r % 2 = 0 then b else a end,
                  case when r % 2 = 0 then a else b end);
          v_count := v_count + 1;
        end if;
      end loop;
      v_eqs := v_eqs[1:1] || v_eqs[n:n] || v_eqs[2:n-1];
    end loop;
  end loop;

  select array_agg(g2.nombre order by g2.nombre) into v_grupos from public.grupos g2
   where g2.categoria_id = p_categoria and exists (select 1 from public.equipos e where e.grupo_id = g2.id);
  if coalesce(array_length(v_grupos, 1), 0) = 2 then
    insert into public.partidos (categoria_id, fase, etiqueta, ref_local, ref_visitante)
      values (p_categoria, 'semifinal', 'Semifinal 1', '1' || v_grupos[1], '2' || v_grupos[2]) returning id into sf1;
    insert into public.partidos (categoria_id, fase, etiqueta, ref_local, ref_visitante)
      values (p_categoria, 'semifinal', 'Semifinal 2', '1' || v_grupos[2], '2' || v_grupos[1]) returning id into sf2;
    insert into public.partidos (categoria_id, fase, etiqueta, ref_local, ref_visitante)
      values (p_categoria, 'tercer_puesto', 'Tercer puesto', 'P:' || sf1, 'P:' || sf2);
    insert into public.partidos (categoria_id, fase, etiqueta, ref_local, ref_visitante)
      values (p_categoria, 'final', 'Final', 'G:' || sf1, 'G:' || sf2);
    v_count := v_count + 4;
  end if;
  return v_count;
end $$;

create or replace function public.ajustar_jornada(s timestamptz, d interval, hi time, hf time) returns timestamptz
language plpgsql immutable as $$
declare l timestamp := s at time zone 'America/Bogota';
begin
  if l::time < hi then l := l::date + hi; end if;
  if (l + d)::date > l::date or (l + d)::time > hf then l := (l::date + 1) + hi; end if;
  return l at time zone 'America/Bogota';
end $$;

-- ===== Programar horarios y canchas de los partidos pendientes del torneo =====
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
