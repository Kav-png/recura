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
      alerts: {
        Row: {
          action_taken: string | null
          checkin_id: string | null
          clinician_id: string | null
          created_at: string
          id: string
          message: string
          patient_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sent_at: string
          severity: string
          source: string
          wearable_event_id: string | null
        }
        Insert: {
          action_taken?: string | null
          checkin_id?: string | null
          clinician_id?: string | null
          created_at?: string
          id?: string
          message: string
          patient_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string
          severity: string
          source?: string
          wearable_event_id?: string | null
        }
        Update: {
          action_taken?: string | null
          checkin_id?: string | null
          clinician_id?: string | null
          created_at?: string
          id?: string
          message?: string
          patient_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string
          severity?: string
          source?: string
          wearable_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_wearable_event_id_fkey"
            columns: ["wearable_event_id"]
            isOneToOne: false
            referencedRelation: "wearable_events"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount: number
          code: string
          created_at: string
          id: string
          patient_id: string
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          id?: string
          patient_id: string
          period_end: string
          period_start: string
          status: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          id?: string
          patient_id?: string
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          called_at: string
          created_at: string
          flags_raised: Json | null
          id: string
          mood: string | null
          patient_id: string
          proms_score: number | null
          summary: string | null
          transcript: Json | null
        }
        Insert: {
          called_at?: string
          created_at?: string
          flags_raised?: Json | null
          id?: string
          mood?: string | null
          patient_id: string
          proms_score?: number | null
          summary?: string | null
          transcript?: Json | null
        }
        Update: {
          called_at?: string
          created_at?: string
          flags_raised?: Json | null
          id?: string
          mood?: string | null
          patient_id?: string
          proms_score?: number | null
          summary?: string | null
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicians: {
        Row: {
          created_at: string
          id: string
          name: string
          practice_id: string
          role: string
          specialty: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          practice_id: string
          role: string
          specialty?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          practice_id?: string
          role?: string
          specialty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinicians_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          dose: string | null
          frequency: string | null
          id: string
          name: string
          patient_id: string
          reason: string | null
          status: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          name: string
          patient_id: string
          reason?: string | null
          status: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          name?: string
          patient_id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          clinician_id: string | null
          condition: string
          consent_captured_at: string | null
          created_at: string
          discharge_date: string
          enrolled_at: string
          f2f_scheduled_date: string | null
          id: string
          is_demo: boolean
          name: string
          phone: string | null
          practice_id: string
          rpm_days_this_period: number
          rpm_live_contact_at: string | null
          rpm_live_contact_by: string | null
          rpm_live_contact_method: string | null
          tcm_contact_by: string | null
          tcm_contact_date: string | null
          tcm_contact_done: boolean
          tcm_contact_method: string | null
        }
        Insert: {
          clinician_id?: string | null
          condition: string
          consent_captured_at?: string | null
          created_at?: string
          discharge_date: string
          enrolled_at?: string
          f2f_scheduled_date?: string | null
          id?: string
          is_demo?: boolean
          name: string
          phone?: string | null
          practice_id: string
          rpm_days_this_period?: number
          rpm_live_contact_at?: string | null
          rpm_live_contact_by?: string | null
          rpm_live_contact_method?: string | null
          tcm_contact_by?: string | null
          tcm_contact_date?: string | null
          tcm_contact_done?: boolean
          tcm_contact_method?: string | null
        }
        Update: {
          clinician_id?: string | null
          condition?: string
          consent_captured_at?: string | null
          created_at?: string
          discharge_date?: string
          enrolled_at?: string
          f2f_scheduled_date?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          phone?: string | null
          practice_id?: string
          rpm_days_this_period?: number
          rpm_live_contact_at?: string | null
          rpm_live_contact_by?: string | null
          rpm_live_contact_method?: string | null
          tcm_contact_by?: string | null
          tcm_contact_date?: string | null
          tcm_contact_done?: boolean
          tcm_contact_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_rpm_live_contact_by_fkey"
            columns: ["rpm_live_contact_by"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_tcm_contact_by_fkey"
            columns: ["tcm_contact_by"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      practices: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
        }
        Relationships: []
      }
      red_flags: {
        Row: {
          created_at: string
          explanation_plain_english: string
          id: string
          patient_id: string
          severity: string
          source: string
          title: string
        }
        Insert: {
          created_at?: string
          explanation_plain_english: string
          id?: string
          patient_id: string
          severity: string
          source: string
          title: string
        }
        Update: {
          created_at?: string
          explanation_plain_english?: string
          id?: string
          patient_id?: string
          severity?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_flags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_events: {
        Row: {
          created_at: string
          detail: string
          detected_at: string
          device: string
          event_type: string
          id: string
          patient_id: string
          severity: string
          triggered_checkin_id: string | null
        }
        Insert: {
          created_at?: string
          detail: string
          detected_at?: string
          device: string
          event_type: string
          id?: string
          patient_id: string
          severity: string
          triggered_checkin_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string
          detected_at?: string
          device?: string
          event_type?: string
          id?: string
          patient_id?: string
          severity?: string
          triggered_checkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_events_triggered_checkin_id_fkey"
            columns: ["triggered_checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
