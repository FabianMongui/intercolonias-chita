-- Exportada desde supabase_migrations.schema_migrations (version 20261002040300)
create table public.torneos (
  id bigint generated always as identity primary key,
  nombre text not null,
  tipo text not null default 'intercolonias',
  fecha_inicio date not null,
  fecha_fin date not null,
  hora_inicio_jornada time not null default '08:00',
  hora_fin_jornada time not null default '18:00',
  minutos_entre_partidos int not null default 10 check (minutos_entre_partidos >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);
create unique index torneos_un_solo_activo on public.torneos (activo) where activo;
comment on table public.torneos is 'Evento (intercolonias, intersectores, interbarrios...). Solo uno activo a la vez.';

create table public.canchas (
  id bigint generated always as identity primary key,
  torneo_id bigint not null references public.torneos(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('F11','F6')),
  activa boolean not null default true,
  orden int not null default 0,
  unique (torneo_id, nombre)
);

create table public.categorias (
  id bigint generated always as identity primary key,
  torneo_id bigint not null references public.torneos(id) on delete cascade,
  nombre text not null,
  tipo_cancha text not null default 'F11' check (tipo_cancha in ('F11','F6')),
  cancha_fija_id bigint references public.canchas(id) on delete set null,
  minutos_por_tiempo int not null default 45 check (minutos_por_tiempo > 0),
  minutos_descanso int not null default 10 check (minutos_descanso >= 0),
  orden int not null default 0,
  unique (torneo_id, nombre)
);
comment on column public.categorias.cancha_fija_id is 'Si se define, la categoría siempre juega en esa cancha (ej. Femenino en la F6)';

create table public.grupos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias(id) on delete cascade,
  nombre text not null check (nombre ~ '^[A-Z]{1,2}$'),
  unique (categoria_id, nombre)
);

create table public.equipos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias(id) on delete cascade,
  grupo_id bigint references public.grupos(id) on delete set null,
  nombre text not null,
  representante text,
  escudo_path text,
  created_at timestamptz not null default now(),
  unique (categoria_id, nombre)
);
comment on column public.equipos.escudo_path is 'Ruta del archivo dentro del bucket público "escudos" (ej. chita.png). La URL se arma en el frontend.';

create table public.jugadores (
  id bigint generated always as identity primary key,
  equipo_id bigint not null references public.equipos(id) on delete cascade,
  nombre text not null,
  numero int check (numero between 0 and 99),
  posicion text,
  created_at timestamptz not null default now()
);

create table public.partidos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias(id) on delete cascade,
  fase text not null default 'grupos' check (fase in ('grupos','semifinal','tercer_puesto','final')),
  grupo_id bigint references public.grupos(id) on delete set null,
  ronda int,
  etiqueta text,
  equipo_local_id bigint references public.equipos(id) on delete set null,
  equipo_visitante_id bigint references public.equipos(id) on delete set null,
  ref_local text,
  ref_visitante text,
  cancha_id bigint references public.canchas(id) on delete set null,
  hora_programada timestamptz,
  hora_estimada timestamptz,
  estado text not null default 'programado' check (estado in ('programado','en_vivo','finalizado')),
  periodo text check (periodo in ('1T','descanso','2T')),
  inicio_real timestamptz,
  fin_primer_tiempo timestamptz,
  inicio_segundo_tiempo timestamptz,
  fin_real timestamptz,
  goles_local int not null default 0,
  goles_visitante int not null default 0,
  penales_local int,
  penales_visitante int,
  created_at timestamptz not null default now(),
  check (equipo_local_id is null or equipo_visitante_id is null or equipo_local_id <> equipo_visitante_id)
);
comment on column public.partidos.ref_local is 'Origen del equipo en eliminatorias: "1A" (1° grupo A), "G:<id>" (ganador partido), "P:<id>" (perdedor)';
comment on column public.partidos.hora_estimada is 'Hora real esperada según retrasos de la cancha; hora_programada no se toca';
comment on column public.partidos.goles_local is 'Calculado automáticamente desde la tabla eventos';

create table public.eventos (
  id bigint generated always as identity primary key,
  partido_id bigint not null references public.partidos(id) on delete cascade,
  equipo_id bigint not null references public.equipos(id) on delete cascade,
  jugador_id bigint references public.jugadores(id) on delete set null,
  tipo text not null default 'gol' check (tipo in ('gol','amarilla','roja')),
  autogol boolean not null default false,
  minuto int,
  periodo text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
comment on column public.eventos.equipo_id is 'Equipo al que se le suma el gol (en autogol, el rival del jugador)';

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text not null default 'admin' check (rol in ('super_admin','admin')),
  cancha_id bigint references public.canchas(id) on delete set null,
  activo boolean not null default false,
  created_at timestamptz not null default now()
);
comment on column public.perfiles.cancha_id is 'Cancha sugerida (opcional). No restringe: los admins rotan.';

create index on public.canchas (torneo_id);
create index on public.categorias (torneo_id);
create index on public.grupos (categoria_id);
create index on public.equipos (categoria_id);
create index on public.equipos (grupo_id);
create index on public.jugadores (equipo_id);
create index on public.partidos (categoria_id);
create index on public.partidos (cancha_id, hora_programada);
create index on public.partidos (estado);
create index on public.eventos (partido_id);
create index on public.eventos (jugador_id);
