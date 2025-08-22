import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend the Supabase User type
type User = SupabaseUser & {
  user_metadata: {
    name: string;
  };
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { name?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as User ?? null);
      setIsLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as User ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred during login');
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      if (!email || !password || !name) {
        throw new Error('Please fill in all required fields');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('This email is already registered');
        }
        throw error;
      }

      toast.success('Please check your email to verify your account');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred during signup');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        if (error.message.includes('Email not found')) {
          throw new Error('No account found with this email address');
        }
        throw error;
      }

      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to send password reset email');
      }
      throw error;
    }
  };

  const updateProfile = async (data: { name?: string; password?: string }) => {
    try {
      if (data.password) {
        if (data.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (passwordError) throw passwordError;
      }

      if (data.name) {
        const { error: nameError } = await supabase.auth.updateUser({
          data: { name: data.name },
        });

        if (nameError) throw nameError;
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update profile');
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isLoading,
      resetPassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}