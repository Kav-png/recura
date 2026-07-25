export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          created_at: string
          discharge_date: string
          enrolled_at: string
          f2f_scheduled_date: string | null
          id: string
          name: string
          phone: string | null
          practice_id: string
          rpm_days_this_period: number
          tcm_contact_date: string | null
          tcm_contact_done: boolean
        }
        Insert: {
          clinician_id?: string | null
          condition: string
          created_at?: string
          discharge_date: string
          enrolled_at?: string
          f2f_scheduled_date?: string | null
          id?: string
          name: string
          phone?: string | null
          practice_id: string
          rpm_days_this_period?: number
          tcm_contact_date?: string | null
          tcm_contact_done?: boolean
        }
        Update: {
          clinician_id?: string | null
          condition?: string
          created_at?: string
          discharge_date?: string
          enrolled_at?: string
          f2f_scheduled_date?: string | null
          id?: string
          name?: string
          phone?: string | null
          practice_id?: string
          rpm_days_this_period?: number
          tcm_contact_date?: string | null
          tcm_contact_done?: boolean
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
        ]
      }
      practices: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
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
