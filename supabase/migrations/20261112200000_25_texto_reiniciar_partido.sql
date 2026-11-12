-- 25: en la app el salvavidas se llama "Reiniciar partido"; el mensaje de deshacer_inicio usa ese nombre.
-- Misma lógica que en la 24, solo cambia el texto del rechazo al admin de cancha pasados los 10 minutos.
create or replace function public.deshacer_inicio(p_id bigint) returns public.partidos
language plpgsql security definer set search_path = '' as $$
declare r public.partidos;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;

  select * into r from public.partidos where id = p_id for update;
  if not found or r.estado <> 'en_vivo' then
    raise exception 'Solo se puede reiniciar un partido en juego';
  end if;

  if not public.es_super_admin()
     and not (r.periodo = '1T' and now() - r.inicio_real <= interval '10 minutes') then
    raise exception 'Ya pasaron más de 10 minutos del inicio: pídele al super admin que reinicie el partido';
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
