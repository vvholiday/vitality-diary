export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          emoji_icon: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          emoji_icon?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          emoji_icon?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          type: 'toggle' | 'numeric';
          unit: string | null;
          score: number;
          description: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          type?: 'toggle' | 'numeric';
          unit?: string | null;
          score?: number;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          type?: 'toggle' | 'numeric';
          unit?: string | null;
          score?: number;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          check_date: string;
          value: number | null;
          note: string;
          is_backfill: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          check_date: string;
          value?: number | null;
          note?: string;
          is_backfill?: boolean;
          created_at?: string;
        };
        Update: {
          value?: number | null;
          note?: string;
          is_backfill?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          nickname: string;
          role: 'admin' | 'user';
          created_at: string;
        };
        Insert: {
          id: string;
          nickname?: string;
          role?: 'admin' | 'user';
          created_at?: string;
        };
        Update: {
          nickname?: string;
          role?: 'admin' | 'user';
        };
      };
    };
  };
}
