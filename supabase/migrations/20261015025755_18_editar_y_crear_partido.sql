-- Exportada desde supabase_migrations.schema_migrations (version 20261015025755)
-- 18: editar_partido y crear_partido (super admin).
-- Validaciones compartidas en funciones internas (sin execute para clientes):
--   validar_cancha_partido: misma regla que reprogramar_partido (que ahora la reutiliza).
--   validar_equipos_partido: equipos de la categoría y, en 'grupos', del grupo del partido.
-- Equipos fijos en eliminatoria: si se pone a mano un equipo distinto al actual, se borra la ref de ese lado
-- ("1A", "G:12"...), porque resolver_llaves la volvería a aplicar y pisaría la elección manual.
-- Si el lado se deja "por definir" (null) o con el mismo equipo, la ref se conserva.

create or replace function public.validar_cancha_partido(p_categoria bigint, p_cancha bigint)
returns void
language plpgsql stable security definer set search_path = '' as $$
declare cat public.categorias; ca public.canchas;
begin
  if p_cancha is null then return; end if;
  select * into cat from public.categorias where id = p_categoria;
  select * into ca from public.canchas where id = p_cancha and torneo_id = cat.torneo_id;
  if not found then raise exception 'La cancha no existe en este torneo'; end if;
  if not ca.activa then raise exception 'La cancha no está activa'; end if;
  if ca.tipo <> cat.tipo_cancha then raise exception 'La cancha no es del tipo de esta categoría'; end if;
  if cat.cancha_fija_id is not null and cat.cancha_fija_id <> p_cancha then
    raise exception 'Esta categoría solo juega en su cancha fija';
  end if;
end $$;

create or replace function public.validar_equipos_partido(p_categoria bigint, p_fase text, p_grupo bigint,
                                                          p_local bigint, p_visitante bigint)
returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_fase = 'grupos' and (p_local is null or p_visitante is null) then
    raise exception 'En fase de grupos van los dos equipos';
  end if;
  if p_local is not null and p_local = p_visitante then
    raise exception 'Un equipo no puede jugar contra sí mismo';
  end if;
  if exists (
    select 1 from unnest(array[p_local, p_visitante]) as x(eq)
    where x.eq is not null and not exists (
      select 1 from public.equipos e
      where e.id = x.eq and e.categoria_id = p_categoria
        and (p_fase <> 'grupos' or e.grupo_id is not distinct from p_grupo)
    )
  ) then
    raise exception 'El equipo no es de este grupo/categoría';
  end if;
end $$;

revoke execute on function public.validar_cancha_partido(bigint, bigint) from public, anon, authenticated;
revoke execute on function public.validar_equipos_partido(bigint, text, bigint, bigint, bigint) from public, anon, authenticated;

-- reprogramar_partido: misma lógica, validación de cancha extraída.
create or replace function public.reprogramar_partido(p_id bigint, p_hora timestamptz default null, p_cancha bigint default null)
returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos; v_torneo bigint;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select * into r from public.partidos where id = p_id for update;
  if not found or r.estado <> 'programado' then
    raise exception 'Solo se puede reprogramar un partido que no ha iniciado';
  end if;
  if p_hora is null and p_cancha is null then raise exception 'No hay cambios'; end if;
  perform public.validar_cancha_partido(r.categoria_id, p_cancha);
  select torneo_id into v_torneo from public.categorias where id = r.categoria_id;
  -- hora_estimada parte de la hora programada; recalcular_estimados la ajusta si hay cancha.
  update public.partidos
     set hora_programada = coalesce(p_hora, hora_programada),
         cancha_id = coalesce(p_cancha, cancha_id),
         hora_estimada = coalesce(p_hora, hora_programada)
   where id = p_id;
  perform public.recalcular_estimados(v_torneo);
  select * into r from public.partidos where id = p_id;
  return r;
end $$;

create or replace function public.editar_partido(
  p_id bigint, p_hora timestamptz default null, p_cancha bigint default null,
  p_cambiar_equipos boolean default false, p_local bigint default null, p_visitante bigint default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare r public.partidos; v_torneo bigint; v_horario boolean; v_equipos boolean;
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  select * into r from public.partidos where id = p_id for update;
  if not found or r.estado <> 'programado' then
    raise exception 'Solo se puede editar un partido que no ha iniciado';
  end if;

  v_horario := (p_hora is not null and p_hora is distinct from r.hora_programada)
            or (p_cancha is not null and p_cancha is distinct from r.cancha_id);
  v_equipos := coalesce(p_cambiar_equipos, false)
            and (p_local is distinct from r.equipo_local_id or p_visitante is distinct from r.equipo_visitante_id);
  if not v_horario and not v_equipos then raise exception 'No hay cambios'; end if;

  perform public.validar_cancha_partido(r.categoria_id, p_cancha);
  if v_equipos then
    perform public.validar_equipos_partido(r.categoria_id, r.fase, r.grupo_id, p_local, p_visitante);
    update public.partidos
       set equipo_local_id = p_local,
           equipo_visitante_id = p_visitante,
           ref_local = case when p_local is not null and p_local is distinct from r.equipo_local_id
                            then null else ref_local end,
           ref_visitante = case when p_visitante is not null and p_visitante is distinct from r.equipo_visitante_id
                                then null else ref_visitante end
     where id = p_id;
  end if;

  if v_horario then
    select torneo_id into v_torneo from public.categorias where id = r.categoria_id;
    update public.partidos
       set hora_programada = coalesce(p_hora, hora_programada),
           cancha_id = coalesce(p_cancha, cancha_id),
           hora_estimada = coalesce(p_hora, hora_programada)
     where id = p_id;
    perform public.recalcular_estimados(v_torneo);
  end if;
end $$;

create or replace function public.crear_partido(
  p_categoria bigint, p_fase text, p_grupo bigint default null, p_etiqueta text default null,
  p_local bigint default null, p_visitante bigint default null,
  p_cancha bigint default null, p_hora timestamptz default null)
returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_torneo bigint; v_id bigint;
begin
  if not public.es_super_admin() then raise exception 'No autorizado'; end if;
  select torneo_id into v_torneo from public.categorias where id = p_categoria;
  if not found then raise exception 'La categoría no existe'; end if;
  if p_fase is null or p_fase not in ('grupos', 'semifinal', 'tercer_puesto', 'final') then
    raise exception 'Fase no válida';
  end if;
  if p_fase = 'grupos' then
    if p_grupo is null then raise exception 'En fase de grupos hay que elegir el grupo'; end if;
    if not exists (select 1 from public.grupos where id = p_grupo and categoria_id = p_categoria) then
      raise exception 'El grupo no es de esta categoría';
    end if;
  elsif p_grupo is not null then
    raise exception 'Solo los partidos de fase de grupos llevan grupo';
  end if;
  perform public.validar_equipos_partido(p_categoria, p_fase, p_grupo, p_local, p_visitante);
  perform public.validar_cancha_partido(p_categoria, p_cancha);

  insert into public.partidos (categoria_id, fase, grupo_id, etiqueta, equipo_local_id, equipo_visitante_id,
                               cancha_id, hora_programada, hora_estimada)
  values (p_categoria, p_fase, p_grupo, nullif(btrim(p_etiqueta), ''), p_local, p_visitante,
          p_cancha, p_hora, p_hora)
  returning id into v_id;
  if p_cancha is not null and p_hora is not null then
    perform public.recalcular_estimados(v_torneo);
  end if;
  return v_id;
end $$;

revoke execute on function public.editar_partido(bigint, timestamptz, bigint, boolean, bigint, bigint) from public, anon;
grant execute on function public.editar_partido(bigint, timestamptz, bigint, boolean, bigint, bigint) to authenticated;
revoke execute on function public.crear_partido(bigint, text, bigint, text, bigint, bigint, bigint, timestamptz) from public, anon;
grant execute on function public.crear_partido(bigint, text, bigint, text, bigint, bigint, bigint, timestamptz) to authenticated;
