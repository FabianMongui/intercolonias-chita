export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      canchas: {
        Row: {
          activa: boolean
          id: number
          nombre: string
          orden: number
          tipo: string
          torneo_id: number
        }
        Insert: {
          activa?: boolean
          id?: never
          nombre: string
          orden?: number
          tipo: string
          torneo_id: number
        }
        Update: {
          activa?: boolean
          id?: never
          nombre?: string
          orden?: number
          tipo?: string
          torneo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "canchas_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          cancha_fija_id: number | null
          id: number
          minutos_descanso: number
          minutos_por_tiempo: number
          nombre: string
          orden: number
          tipo_cancha: string
          torneo_id: number
        }
        Insert: {
          cancha_fija_id?: number | null
          id?: never
          minutos_descanso?: number
          minutos_por_tiempo?: number
          nombre: string
          orden?: number
          tipo_cancha?: string
          torneo_id: number
        }
        Update: {
          cancha_fija_id?: number | null
          id?: never
          minutos_descanso?: number
          minutos_por_tiempo?: number
          nombre?: string
          orden?: number
          tipo_cancha?: string
          torneo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_cancha_fija_id_fkey"
            columns: ["cancha_fija_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_torneo_id_fkey"
            columns: ["torneo_id"]
            isOneToOne: false
            referencedRelation: "torneos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          categoria_id: number
          created_at: string
          escudo_path: string | null
          grupo_id: number | null
          id: number
          nombre: string
          representante: string | null
        }
        Insert: {
          categoria_id: number
          created_at?: string
          escudo_path?: string | null
          grupo_id?: number | null
          id?: never
          nombre: string
          representante?: string | null
        }
        Update: {
          categoria_id?: number
          created_at?: string
          escudo_path?: string | null
          grupo_id?: number | null
          id?: never
          nombre?: string
          representante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          autogol: boolean
          created_at: string
          created_by: string | null
          equipo_id: number
          id: number
          jugador_id: number | null
          minuto: number | null
          partido_id: number
          periodo: string | null
          tipo: string
        }
        Insert: {
          autogol?: boolean
          created_at?: string
          created_by?: string | null
          equipo_id: number
          id?: never
          jugador_id?: number | null
          minuto?: number | null
          partido_id: number
          periodo?: string | null
          tipo?: string
        }
        Update: {
          autogol?: boolean
          created_at?: string
          created_by?: string | null
          equipo_id?: number
          id?: never
          jugador_id?: number | null
          minuto?: number | null
          partido_id?: number
          periodo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "goleadores"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "eventos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "posiciones"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "eventos_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "goleadores"
            referencedColumns: ["jugador_id"]
          },
          {
            foreignKeyName: "eventos_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          categoria_id: number
          id: number
          nombre: string
        }
        Insert: {
          categoria_id: number
          id?: never
          nombre: string
        }
        Update: {
          categoria_id?: number
          id?: never
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      jugadores: {
        Row: {
          created_at: string
          equipo_id: number
          id: number
          nombre: string
          numero: number | null
          posicion: string | null
        }
        Insert: {
          created_at?: string
          equipo_id: number
          id?: never
          nombre: string
          numero?: number | null
          posicion?: string | null
        }
        Update: {
          created_at?: string
          equipo_id?: number
          id?: never
          nombre?: string
          numero?: number | null
          posicion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jugadores_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "goleadores"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "jugadores_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "posiciones"
            referencedColumns: ["equipo_id"]
          },
        ]
      }
      partidos: {
        Row: {
          cancha_id: number | null
          categoria_id: number
          created_at: string
          equipo_local_id: number | null
          equipo_visitante_id: number | null
          estado: string
          etiqueta: string | null
          fase: string
          fin_primer_tiempo: string | null
          fin_real: string | null
          goles_local: number
          goles_visitante: number
          grupo_id: number | null
          hora_estimada: string | null
          hora_programada: string | null
          id: number
          inicio_real: string | null
          inicio_segundo_tiempo: string | null
          penales_local: number | null
          penales_visitante: number | null
          periodo: string | null
          ref_local: string | null
          ref_visitante: string | null
          ronda: number | null
        }
        Insert: {
          cancha_id?: number | null
          categoria_id: number
          created_at?: string
          equipo_local_id?: number | null
          equipo_visitante_id?: number | null
          estado?: string
          etiqueta?: string | null
          fase?: string
          fin_primer_tiempo?: string | null
          fin_real?: string | null
          goles_local?: number
          goles_visitante?: number
          grupo_id?: number | null
          hora_estimada?: string | null
          hora_programada?: string | null
          id?: never
          inicio_real?: string | null
          inicio_segundo_tiempo?: string | null
          penales_local?: number | null
          penales_visitante?: number | null
          periodo?: string | null
          ref_local?: string | null
          ref_visitante?: string | null
          ronda?: number | null
        }
        Update: {
          cancha_id?: number | null
          categoria_id?: number
          created_at?: string
          equipo_local_id?: number | null
          equipo_visitante_id?: number | null
          estado?: string
          etiqueta?: string | null
          fase?: string
          fin_primer_tiempo?: string | null
          fin_real?: string | null
          goles_local?: number
          goles_visitante?: number
          grupo_id?: number | null
          hora_estimada?: string | null
          hora_programada?: string | null
          id?: never
          inicio_real?: string | null
          inicio_segundo_tiempo?: string | null
          penales_local?: number | null
          penales_visitante?: number | null
          periodo?: string | null
          ref_local?: string | null
          ref_visitante?: string | null
          ronda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partidos_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_equipo_local_id_fkey"
            columns: ["equipo_local_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_equipo_local_id_fkey"
            columns: ["equipo_local_id"]
            isOneToOne: false
            referencedRelation: "goleadores"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "partidos_equipo_local_id_fkey"
            columns: ["equipo_local_id"]
            isOneToOne: false
            referencedRelation: "posiciones"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "partidos_equipo_visitante_id_fkey"
            columns: ["equipo_visitante_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_equipo_visitante_id_fkey"
            columns: ["equipo_visitante_id"]
            isOneToOne: false
            referencedRelation: "goleadores"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "partidos_equipo_visitante_id_fkey"
            columns: ["equipo_visitante_id"]
            isOneToOne: false
            referencedRelation: "posiciones"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "partidos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          cancha_id: number | null
          created_at: string
          id: string
          nombre: string | null
          rol: string
        }
        Insert: {
          activo?: boolean
          cancha_id?: number | null
          created_at?: string
          id: string
          nombre?: string | null
          rol?: string
        }
        Update: {
          activo?: boolean
          cancha_id?: number | null
          created_at?: string
          id?: string
          nombre?: string | null
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "canchas"
            referencedColumns: ["id"]
          },
        ]
      }
      torneos: {
        Row: {
          activo: boolean
          created_at: string
          fecha_fin: string
          fecha_inicio: string
          hora_fin_jornada: string
          hora_inicio_jornada: string
          id: number
          minutos_entre_partidos: number
          nombre: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_fin: string
          fecha_inicio: string
          hora_fin_jornada?: string
          hora_inicio_jornada?: string
          id?: never
          minutos_entre_partidos?: number
          nombre: string
          tipo?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_fin?: string
          fecha_inicio?: string
          hora_fin_jornada?: string
          hora_inicio_jornada?: string
          id?: never
          minutos_entre_partidos?: number
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      goleadores: {
        Row: {
          categoria_id: number | null
          equipo: string | null
          equipo_id: number | null
          escudo_path: string | null
          goles: number | null
          jugador: string | null
          jugador_id: number | null
          numero: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      posiciones: {
        Row: {
          categoria_id: number | null
          dg: number | null
          equipo: string | null
          equipo_id: number | null
          escudo_path: string | null
          gc: number | null
          gf: number | null
          grupo: string | null
          grupo_id: number | null
          pe: number | null
          pg: number | null
          pj: number | null
          posicion: number | null
          pp: number | null
          puntos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      ahora: { Args: never; Returns: string }
      ajustar_jornada: {
        Args: { d: string; hf: string; hi: string; s: string }
        Returns: string
      }
      duracion_slot: { Args: { p_categoria: number }; Returns: string }
      es_admin: { Args: never; Returns: boolean }
      es_super_admin: { Args: never; Returns: boolean }
      finalizar_partido: {
        Args: {
          p_id: number
          p_penales_local?: number
          p_penales_visitante?: number
        }
        Returns: {
          cancha_id: number | null
          categoria_id: number
          created_at: string
          equipo_local_id: number | null
          equipo_visitante_id: number | null
          estado: string
          etiqueta: string | null
          fase: string
          fin_primer_tiempo: string | null
          fin_real: string | null
          goles_local: number
          goles_visitante: number
          grupo_id: number | null
          hora_estimada: string | null
          hora_programada: string | null
          id: number
          inicio_real: string | null
          inicio_segundo_tiempo: string | null
          penales_local: number | null
          penales_visitante: number | null
          periodo: string | null
          ref_local: string | null
          ref_visitante: string | null
          ronda: number | null
        }
        SetofOptions: {
          from: "*"
          to: "partidos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ganador: {
        Args: { p: Database["public"]["Tables"]["partidos"]["Row"] }
        Returns: number
      }
      generar_partidos_categoria: {
        Args: { p_categoria: number }
        Returns: number
      }
      iniciar_partido: {
        Args: { p_id: number }
        Returns: {
          cancha_id: number | null
          categoria_id: number
          created_at: string
          equipo_local_id: number | null
          equipo_visitante_id: number | null
          estado: string
          etiqueta: string | null
          fase: string
          fin_primer_tiempo: string | null
          fin_real: string | null
          goles_local: number
          goles_visitante: number
          grupo_id: number | null
          hora_estimada: string | null
          hora_programada: string | null
          id: number
          inicio_real: string | null
          inicio_segundo_tiempo: string | null
          penales_local: number | null
          penales_visitante: number | null
          periodo: string | null
          ref_local: string | null
          ref_visitante: string | null
          ronda: number | null
        }
        SetofOptions: {
          from: "*"
          to: "partidos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      iniciar_segundo_tiempo: {
        Args: { p_id: number }
        Returns: {
          cancha_id: number | null
          categoria_id: number
          created_at: string
          equipo_local_id: number | null
          equipo_visitante_id: number | null
          estado: string
          etiqueta: string | null
          fase: string
          fin_primer_tiempo: string | null
          fin_real: string | null
          goles_local: number
          goles_visitante: number
          grupo_id: number | null
          hora_estimada: string | null
          hora_programada: string | null
          id: number
          inicio_real: string | null
          inicio_segundo_tiempo: string | null
          penales_local: number | null
          penales_visitante: number | null
          periodo: string | null
          ref_local: string | null
          ref_visitante: string | null
          ronda: number | null
        }
        SetofOptions: {
          from: "*"
          to: "partidos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      medio_tiempo: {
        Args: { p_id: number }
        Returns: {
          cancha_id: number | null
          categoria_id: number
          created_at: string
          equipo_local_id: number | null
          equipo_visitante_id: number | null
          estado: string
          etiqueta: string | null
          fase: string
          fin_primer_tiempo: string | null
          fin_real: string | null
          goles_local: number
          goles_visitante: number
          grupo_id: number | null
          hora_estimada: string | null
          hora_programada: string | null
          id: number
          inicio_real: string | null
          inicio_segundo_tiempo: string | null
          penales_local: number | null
          penales_visitante: number | null
          periodo: string | null
          ref_local: string | null
          ref_visitante: string | null
          ronda: number | null
        }
        SetofOptions: {
          from: "*"
          to: "partidos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      minuto_actual: {
        Args: { p: Database["public"]["Tables"]["partidos"]["Row"] }
        Returns: number
      }
      perdedor: {
        Args: { p: Database["public"]["Tables"]["partidos"]["Row"] }
        Returns: number
      }
      programar_horarios: {
        Args: { p_desde?: string; p_torneo: number }
        Returns: number
      }
      recalcular_estimados: { Args: { p_torneo: number }; Returns: undefined }
      registrar_gol: {
        Args: {
          p_autogol?: boolean
          p_equipo: number
          p_jugador?: number
          p_partido: number
        }
        Returns: {
          autogol: boolean
          created_at: string
          created_by: string | null
          equipo_id: number
          id: number
          jugador_id: number | null
          minuto: number | null
          partido_id: number
          periodo: string | null
          tipo: string
        }
        SetofOptions: {
          from: "*"
          to: "eventos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolver_llaves: { Args: { p_categoria: number }; Returns: undefined }
      resolver_ref: {
        Args: { p_categoria: number; p_ref: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
