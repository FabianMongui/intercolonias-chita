-- 24: deshacer_inicio (salvavidas para un partido iniciado por error) y validaciones en iniciar_partido.

-- iniciar_partido: igual que en la 04, más dos validaciones previas:
--  * ninguno de sus equipos puede estar jugando otro partido en vivo;
--  * su cancha no puede tener otro partido en vivo.
create or replace function public.iniciar_partido(p_id bigint) returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos; v_p public.partidos; v_otro record;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;

  select * into v_p from public.partidos where id = p_id for update;
  if found and v_p.estado = 'programado' then
    -- Un equipo no puede jugar dos partidos a la vez.
    select e.nombre as equipo, el.nombre as local, ev.nombre as visitante into v_otro
      from public.partidos o
      join public.equipos e on e.id in (v_p.equipo_local_id, v_p.equipo_visitante_id)
                           and e.id in (o.equipo_local_id, o.equipo_visitante_id)
      left join public.equipos el on el.id = o.equipo_local_id
      left join public.equipos ev on ev.id = o.equipo_visitante_id
     where o.id <> p_id and o.estado = 'en_vivo'
     order by o.inicio_real limit 1;
    if found then
      raise exception '% ya está jugando otro partido (% vs %). Termínalo antes de iniciar este.',
        v_otro.equipo, coalesce(v_otro.local, 'Por definir'), coalesce(v_otro.visitante, 'Por definir');
    end if;

    -- Una cancha no puede tener dos partidos en vivo.
    select c.nombre as cancha, el.nombre as local, ev.nombre as visitante into v_otro
      from public.partidos o
      join public.canchas c on c.id = o.cancha_id
      left join public.equipos el on el.id = o.equipo_local_id
      left join public.equipos ev on ev.id = o.equipo_visitante_id
     where o.id <> p_id and o.estado = 'en_vivo' and o.cancha_id = v_p.cancha_id
     order by o.inicio_real limit 1;
    if found then
      raise exception 'En % se está jugando % vs %. Finalízalo antes de iniciar este.',
        v_otro.cancha, coalesce(v_otro.local, 'Por definir'), coalesce(v_otro.visitante, 'Por definir');
    end if;
  end if;

  update public.partidos set estado = 'en_vivo', periodo = '1T', inicio_real = now()
   where id = p_id and estado = 'programado' and equipo_local_id is not null and equipo_visitante_id is not null
  returning * into r;
  if not found then raise exception 'El partido no se puede iniciar (ya inició o faltan equipos)'; end if;
  return r;
end $$;

-- deshacer_inicio: vuelve a 'programado' un partido en vivo iniciado por error.
-- Admin: solo en el 1T y dentro de los 10 minutos desde inicio_real. Super admin: en cualquier momento mientras
-- esté en vivo. Borra sus eventos y deja el partido sin marcador ni tiempos. El trigger partidos_estado
-- (al_cambiar_estado) recalcula las horas estimadas al cambiar el estado.
create or replace function public.deshacer_inicio(p_id bigint) returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;

  select * into r from public.partidos where id = p_id for update;
  if not found or r.estado <> 'en_vivo' then
    raise exception 'Solo se puede deshacer el inicio de un partido en juego';
  end if;

  if not public.es_super_admin()
     and not (r.periodo = '1T' and now() - r.inicio_real <= interval '10 minutes') then
    raise exception 'Ya pasaron más de 10 minutos del inicio: pídele al super admin que lo deshaga';
  end if;

  delete from public.eventos where partido_id = p_id;

  update public.partidos set
    estado = 'programado', periodo = null,
    inicio_real = null, fin_primer_tiempo = null, inicio_segundo_tiempo = null, fin_real = null,
    goles_local = 0, goles_visitante = 0, penales_local = null, penales_visitante = null
   where id = p_id
  returning * into r;
  return r;
end $$;

revoke all on function public.deshacer_inicio(bigint) from public, anon;
grant execute on function public.deshacer_inicio(bigint) to authenticated;
