export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  subject: string;
  estimatedMinutes: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  date: string;
  durationMinutes: number;
  subject: string;
}

export interface Subject {
  description: string;
  id: string;
  name: string;
  color: string;
  goalHoursPerWeek: number;
}

export interface StudyGoal {
  id: string;
  subject: string;
  targetHours: number;
  deadline: string;
  completed: boolean;
}

export interface StudyStreak {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  nextReview: string;
  interval: number;
  ease: number;
  createdAt: string;
}

export interface StudentProfile {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  studyPreferences: {
    preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
    focusSessionDuration: number;
    breakDuration: number;
    dailyGoalHours: number;
    notifications: boolean;
    soundEffects: boolean;
  };
  achievements: Achievement[];
}

export interface Achievement {
  date: number;
  id: string;
  title: string;
  description: string;
  earnedAt: string;
}