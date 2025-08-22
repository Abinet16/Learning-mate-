import { supabase } from '../lib/supabase';

export interface StudySession {
  id: string;
  user_id: string;
  title: string;
  content: string;
  transcription?: string;
  audio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  study_preferences: {
    daily_goal?: number;
    preferred_subjects?: string[];
    reminder_time?: string;
  };
  created_at: string;
  updated_at: string;
}

export async function getFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        await setToStorage(key, defaultValue);
        return defaultValue;
      }
      console.error(`Error reading ${key} from Supabase:`, error);
      return defaultValue;
    }

    return data ? JSON.parse(data.value) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from Supabase:`, error);
    return defaultValue;
  }
}

export async function setToStorage<T>(key: string, value: T): Promise<void> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,key'
        }
      );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Error writing ${key} to Supabase:`, error);
    throw error;
  }
}

// Study Sessions
export async function createStudySession(title: string, content: string): Promise<StudySession> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        title,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating study session:', error);
    throw error;
  }
}

export async function getStudySessions(): Promise<StudySession[]> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting study sessions:', error);
    throw error;
  }
}

export async function updateStudySession(id: string, updates: Partial<StudySession>): Promise<StudySession> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating study session:', error);
    throw error;
  }
}

// Tasks
export async function createTask(title: string, description?: string, dueDate?: string): Promise<Task> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title,
        description,
        due_date: dueDate,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function getTasks(): Promise<Task[]> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function deleteSubject(subjectId: string): Promise<void> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('study_preferences')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Remove subject from preferred_subjects
    const updatedPreferences = {
      ...profile.study_preferences,
      preferred_subjects: profile.study_preferences.preferred_subjects?.filter(
        (subject: string) => subject !== subjectId
      ) || []
    };

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        study_preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
}

// Audio Files
export async function uploadAudioFile(audioBlob: Blob, fileName: string): Promise<string> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const filePath = `${userId}/audio/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('study_recordings')
      .upload(filePath, audioBlob, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('study_recordings')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
}

export async function getAudioFiles(): Promise<Array<{ name: string; url: string; created_at: string }>> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.storage
      .from('study_recordings')
      .list(`${userId}/audio`, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    return await Promise.all(data.map(async (file) => {
      const { data: { publicUrl } } = supabase.storage
        .from('study_recordings')
        .getPublicUrl(`${userId}/audio/${file.name}`);

      return {
        name: file.name,
        url: publicUrl,
        created_at: file.created_at
      };
    }));
  } catch (error) {
    console.error('Error getting audio files:', error);
    throw error;
  }
}

export async function deleteAudioFile(fileName: string): Promise<void> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase.storage
      .from('study_recordings')
      .remove([`${userId}/audio/${fileName}`]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting audio file:', error);
    throw error;
  }
}