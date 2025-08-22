export type StorageItem = {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export type StreakData = {
  id: string;
  user_id: string;
  current_streak: number;
  best_streak: number;
  last_study_date: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      storage: {
        Row: StorageItem;
        Insert: Omit<StorageItem, 'created_at'>;
        Update: Partial<Omit<StorageItem, 'created_at'>>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<{
          id: string;
          email: string;
          name: string;
          created_at: string;
        }, 'id' | 'created_at'>;
        Update: Partial<Omit<{
          id: string;
          email: string;
          name: string;
          created_at: string;
        }, 'id' | 'created_at'>>;
      };
      streaks: {
        Row: StreakData;
        Insert: Omit<StreakData, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StreakData, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};