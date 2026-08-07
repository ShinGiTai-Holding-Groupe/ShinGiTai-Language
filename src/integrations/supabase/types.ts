export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string;
          code: string;
          created_at: string;
          description: string;
          icon: string;
          id: string;
          sort_order: number;
          threshold: number;
          title: string;
          xp_reward: number;
        };
        Insert: {
          category?: string;
          code: string;
          created_at?: string;
          description: string;
          icon?: string;
          id?: string;
          sort_order?: number;
          threshold?: number;
          title: string;
          xp_reward?: number;
        };
        Update: {
          category?: string;
          code?: string;
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          sort_order?: number;
          threshold?: number;
          title?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      exam_questions: {
        Row: {
          correct_index: number;
          created_at: string;
          id: string;
          options: Json;
          order_index: number;
          prompt: string;
          section: string;
          session_id: string;
          user_answer: number | null;
        };
        Insert: {
          correct_index: number;
          created_at?: string;
          id?: string;
          options: Json;
          order_index: number;
          prompt: string;
          section?: string;
          session_id: string;
          user_answer?: number | null;
        };
        Update: {
          correct_index?: number;
          created_at?: string;
          id?: string;
          options?: Json;
          order_index?: number;
          prompt?: string;
          section?: string;
          session_id?: string;
          user_answer?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_questions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_sessions: {
        Row: {
          completed_at: string | null;
          correct_count: number;
          created_at: string;
          id: string;
          language_code: string;
          level: Database["public"]["Enums"]["cefr_level"];
          pass_threshold: number;
          passed: boolean;
          score_percent: number;
          status: string;
          total_questions: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          correct_count?: number;
          created_at?: string;
          id?: string;
          language_code: string;
          level: Database["public"]["Enums"]["cefr_level"];
          pass_threshold?: number;
          passed?: boolean;
          score_percent?: number;
          status?: string;
          total_questions?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          correct_count?: number;
          created_at?: string;
          id?: string;
          language_code?: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          pass_threshold?: number;
          passed?: boolean;
          score_percent?: number;
          status?: string;
          total_questions?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      flashcard_decks: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          language_code: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          language_code: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          language_code?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      flashcards: {
        Row: {
          back: string;
          created_at: string;
          deck_id: string;
          due_date: string;
          ease_factor: number;
          emoji: string | null;
          example: string | null;
          front: string;
          id: string;
          interval_days: number;
          last_reviewed_at: string | null;
          repetitions: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          back: string;
          created_at?: string;
          deck_id: string;
          due_date?: string;
          ease_factor?: number;
          emoji?: string | null;
          example?: string | null;
          front: string;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          repetitions?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          deck_id?: string;
          due_date?: string;
          ease_factor?: number;
          emoji?: string | null;
          example?: string | null;
          front?: string;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          repetitions?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_decks";
            referencedColumns: ["id"];
          },
        ];
      };
      grammar_lessons: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_published: boolean;
          language_code: string;
          level: Database["public"]["Enums"]["cefr_level"];
          slug: string;
          sort_order: number;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          language_code: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          slug: string;
          sort_order?: number;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          language_code?: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          slug?: string;
          sort_order?: number;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      languages: {
        Row: {
          code: string;
          created_at: string;
          flag_emoji: string;
          is_active: boolean;
          name: string;
          native_name: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          flag_emoji: string;
          is_active?: boolean;
          name: string;
          native_name: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          flag_emoji?: string;
          is_active?: boolean;
          name?: string;
          native_name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          is_read: boolean;
          link: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          daily_goal_minutes: number;
          display_name: string | null;
          id: string;
          native_language_code: string | null;
          onboarding_completed: boolean;
          teacher_avatar: string;
          timezone: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          daily_goal_minutes?: number;
          display_name?: string | null;
          id: string;
          native_language_code?: string | null;
          onboarding_completed?: boolean;
          teacher_avatar?: string;
          timezone?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          daily_goal_minutes?: number;
          display_name?: string | null;
          id?: string;
          native_language_code?: string | null;
          onboarding_completed?: boolean;
          teacher_avatar?: string;
          timezone?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_native_language_code_fkey";
            columns: ["native_language_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          correct_index: number;
          created_at: string;
          explanation: string | null;
          id: string;
          options: Json;
          prompt: string;
          quiz_id: string;
          sort_order: number;
        };
        Insert: {
          correct_index: number;
          created_at?: string;
          explanation?: string | null;
          id?: string;
          options: Json;
          prompt: string;
          quiz_id: string;
          sort_order?: number;
        };
        Update: {
          correct_index?: number;
          created_at?: string;
          explanation?: string | null;
          id?: string;
          options?: Json;
          prompt?: string;
          quiz_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_published: boolean;
          language_code: string;
          level: Database["public"]["Enums"]["cefr_level"];
          slug: string;
          sort_order: number;
          title: string;
          updated_at: string;
          xp_reward: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          language_code: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          slug: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          language_code?: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          slug?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      subscribers: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          id: string;
          status: string;
          tier: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          tier?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          tier?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tutor_conversations: {
        Row: {
          created_at: string;
          id: string;
          language_code: string;
          level: Database["public"]["Enums"]["cefr_level"];
          mode: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          language_code: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          mode?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          language_code?: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          mode?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tutor_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          parts: Json | null;
          role: string;
          user_id: string;
        };
        Insert: {
          content?: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          parts?: Json | null;
          role: string;
          user_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          parts?: Json | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tutor_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "tutor_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          earned_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          earned_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          earned_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
        ];
      };
      user_courses: {
        Row: {
          course_xp: number;
          created_at: string;
          id: string;
          is_active: boolean;
          language_code: string;
          level: Database["public"]["Enums"]["cefr_level"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          course_xp?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          language_code: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          course_xp?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          language_code?: string;
          level?: Database["public"]["Enums"]["cefr_level"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_courses_language_code_fkey";
            columns: ["language_code"];
            isOneToOne: false;
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };
      user_lesson_progress: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          id: string;
          lesson_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          lesson_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          lesson_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "grammar_lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      user_quiz_attempts: {
        Row: {
          completed_at: string;
          id: string;
          quiz_id: string;
          score: number;
          total: number;
          user_id: string;
          xp_earned: number;
        };
        Insert: {
          completed_at?: string;
          id?: string;
          quiz_id: string;
          score?: number;
          total?: number;
          user_id: string;
          xp_earned?: number;
        };
        Update: {
          completed_at?: string;
          id?: string;
          quiz_id?: string;
          score?: number;
          total?: number;
          user_id?: string;
          xp_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          created_at: string;
          current_streak: number;
          gems: number;
          hearts: number;
          last_activity_date: string | null;
          longest_streak: number;
          total_xp: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_streak?: number;
          gems?: number;
          hearts?: number;
          last_activity_date?: string | null;
          longest_streak?: number;
          total_xp?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_streak?: number;
          gems?: number;
          hearts?: number;
          last_activity_date?: string | null;
          longest_streak?: number;
          total_xp?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_first_admin: { Args: { _user_id: string }; Returns: boolean };
      get_admin_overview: { Args: never; Returns: Json };
      get_admin_users: {
        Args: { _limit?: number };
        Returns: {
          avatar_url: string;
          created_at: string;
          current_streak: number;
          display_name: string;
          roles: string[];
          tier: string;
          total_xp: number;
          user_id: string;
          username: string;
        }[];
      };
      get_leaderboard: {
        Args: { _limit?: number };
        Returns: {
          avatar_url: string;
          current_streak: number;
          display_name: string;
          longest_streak: number;
          total_xp: number;
          user_id: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
  },
} as const;
