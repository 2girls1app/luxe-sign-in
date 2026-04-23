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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          sent_by: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          sent_by?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      chat_message_views: {
        Row: {
          id: string
          message_id: string
          viewed_at: string
          viewer_id: string
          viewer_name: string
        }
        Insert: {
          id?: string
          message_id: string
          viewed_at?: string
          viewer_id: string
          viewer_name?: string
        }
        Update: {
          id?: string
          message_id?: string
          viewed_at?: string
          viewer_id?: string
          viewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_views_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_name: string
          sender_role: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_name?: string
          sender_role?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "procedure_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_facilities: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          created_at: string
          facility_code: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facility_code?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          facility_code?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facility_documents: {
        Row: {
          created_at: string
          description: string | null
          facility_id: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_favorite: boolean
          mime_type: string | null
          target_role: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          facility_id: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_favorite?: boolean
          mime_type?: string | null
          target_role?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          facility_id?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_favorite?: boolean
          mime_type?: string | null
          target_role?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_documents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_medications: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          facility_id: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          facility_id: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          facility_id?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_medications_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_supplies: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          facility_id: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          facility_id: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          facility_id?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_supplies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_sutures: {
        Row: {
          created_at: string
          created_by: string | null
          facility_id: string
          id: string
          name: string
          notes: string | null
          size: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          facility_id: string
          id?: string
          name: string
          notes?: string | null
          size?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          facility_id?: string
          id?: string
          name?: string
          notes?: string | null
          size?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_sutures_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      music_preferences: {
        Row: {
          created_at: string
          id: string
          type: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      notification_views: {
        Row: {
          id: string
          notification_id: string
          viewed_at: string
          viewer_id: string
          viewer_name: string
        }
        Insert: {
          id?: string
          notification_id: string
          viewed_at?: string
          viewer_id: string
          viewer_name?: string
        }
        Update: {
          id?: string
          notification_id?: string
          viewed_at?: string
          viewer_id?: string
          viewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_views_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_preference_changes: {
        Row: {
          category: string
          created_at: string
          denial_reason: string | null
          id: string
          is_read: boolean
          new_value: string
          old_value: string | null
          procedure_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string
        }
        Insert: {
          category: string
          created_at?: string
          denial_reason?: string | null
          id?: string
          is_read?: boolean
          new_value: string
          old_value?: string | null
          procedure_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by: string
        }
        Update: {
          category?: string
          created_at?: string
          denial_reason?: string | null
          id?: string
          is_read?: boolean
          new_value?: string
          old_value?: string | null
          procedure_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_preference_changes_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_chats: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          procedure_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          is_active?: boolean
          procedure_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          procedure_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_chats_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_favorites: {
        Row: {
          created_at: string
          id: string
          procedure_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          procedure_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          procedure_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_favorites_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_files: {
        Row: {
          category: string
          created_at: string
          custom_name: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          procedure_id: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          custom_name?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          procedure_id: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_name?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          procedure_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_files_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_preferences: {
        Row: {
          category: string
          created_at: string
          id: string
          procedure_id: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          procedure_id: string
          updated_at?: string
          user_id: string
          value?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          procedure_id?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_preferences_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          category: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          facility_id: string | null
          id: string
          is_complete: boolean
          is_favorite: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          facility_id?: string | null
          id?: string
          is_complete?: boolean
          is_favorite?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          facility_id?: string | null
          id?: string
          is_complete?: boolean
          is_favorite?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          facility_id: string | null
          id: string
          onboarding_completed: boolean
          pandora_connected: boolean
          role: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          facility_id?: string | null
          id?: string
          onboarding_completed?: boolean
          pandora_connected?: boolean
          role?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          facility_id?: string | null
          id?: string
          onboarding_completed?: boolean
          pandora_connected?: boolean
          role?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_rep_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          prefill_data: Json
          procedure_id: string
          rep_email: string
          rep_index: number
          status: string
          submitted_at: string | null
          submitted_data: Json | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          prefill_data?: Json
          procedure_id: string
          rep_email: string
          rep_index?: number
          status?: string
          submitted_at?: string | null
          submitted_data?: Json | null
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          prefill_data?: Json
          procedure_id?: string
          rep_email?: string
          rep_index?: number
          status?: string
          submitted_at?: string | null
          submitted_data?: Json | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_procedure_cards: {
        Row: {
          created_at: string
          id: string
          permission: string
          procedure_id: string
          share_token: string
          shared_by: string
          shared_with: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission?: string
          procedure_id: string
          share_token?: string
          shared_by: string
          shared_with: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          procedure_id?: string
          share_token?: string
          shared_by?: string
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_procedure_cards_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_library: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_sales_rep_invite_by_token: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          id: string
          prefill_data: Json
          procedure_id: string
          rep_email: string
          status: string
          submitted_at: string
        }[]
      }
      get_user_facility_id: { Args: { _user_id: string }; Returns: string }
      has_edit_access: {
        Args: { _procedure_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_facility_linked_user: {
        Args: { _facility_id: string; _viewer_id: string }
        Returns: boolean
      }
      is_facility_owner: {
        Args: { _facility_id: string; _viewer_id: string }
        Returns: boolean
      }
      is_linked_doctor: {
        Args: { _doctor_user_id: string; _viewer_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      owns_procedure: {
        Args: { _procedure_id: string; _user_id: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      submit_sales_rep_invite: {
        Args: { _data: Json; _token: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
