import { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import { Trophy, User, Bell, Volume2, Save, Camera, Edit3, Target, Clock, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFromStorage, setToStorage } from '../utils/storage';
import LoadingSpinner from '../components/LoadingSpinner';

const defaultProfile: StudentProfile = {
  name: '',
  email: '',
  bio: '',
  studyPreferences: {
    preferredStudyTime: 'morning',
    focusSessionDuration: 25,
    breakDuration: 5,
    dailyGoalHours: 4,
    notifications: true,
    soundEffects: true,
  },
  achievements: [],
};

export default function Profile() {
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const loadedProfile = await getFromStorage<StudentProfile>('profile', defaultProfile);
        setProfile(loadedProfile || defaultProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await setToStorage('profile', profile);
      setIsEditing(false);
      toast.success('Profile updated successfully!', {
        icon: '✅',
        style: {
          borderRadius: '12px',
          background: '#4f46e5',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile', {
        icon: '❌',
        style: {
          borderRadius: '12px',
          background: '#ef4444',
          color: '#fff',
        },
      });
    }
  };

  const handleCancel = () => {
    // Reload original profile data
    getFromStorage<StudentProfile>('profile', defaultProfile)
      .then(loadedProfile => {
        setProfile(loadedProfile || defaultProfile);
        setIsEditing(false);
      })
      .catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <User className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account and study preferences</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User size={20} />
                Personal Information
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-300">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full cursor-pointer text-white hover:bg-indigo-700 transition-colors shadow-md">
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your Name"
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself, your study goals, or what motivates you..."
                  disabled={!isEditing}
                  className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Study Preferences */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target size={20} />
                Study Preferences
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Study Time
                  </label>
                  <select
                    value={profile.studyPreferences.preferredStudyTime}
                    onChange={e => setProfile(prev => ({
                      ...prev,
                      studyPreferences: {
                        ...prev.studyPreferences,
                        preferredStudyTime: e.target.value as StudentProfile['studyPreferences']['preferredStudyTime']
                      }
                    }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="morning">🌅 Morning (6AM - 12PM)</option>
                    <option value="afternoon">🌞 Afternoon (12PM - 6PM)</option>
                    <option value="evening">🌆 Evening (6PM - 12AM)</option>
                    <option value="night">🌙 Night (12AM - 6AM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Study Goal (hours)
                  </label>
                  <input
                    type="number"
                    value={profile.studyPreferences.dailyGoalHours}
                    onChange={e => setProfile(prev => ({
                      ...prev,
                      studyPreferences: {
                        ...prev.studyPreferences,
                        dailyGoalHours: parseInt(e.target.value)
                      }
                    }))}
                    min="1"
                    max="24"
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Session (minutes)
                  </label>
                  <input
                    type="number"
                    value={profile.studyPreferences.focusSessionDuration}
                    onChange={e => setProfile(prev => ({
                      ...prev,
                      studyPreferences: {
                        ...prev.studyPreferences,
                        focusSessionDuration: parseInt(e.target.value)
                      }
                    }))}
                    min="1"
                    max="120"
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={profile.studyPreferences.breakDuration}
                    onChange={e => setProfile(prev => ({
                      ...prev,
                      studyPreferences: {
                        ...prev.studyPreferences,
                        breakDuration: parseInt(e.target.value)
                      }
                    }))}
                    min="1"
                    max="30"
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-indigo-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notifications</span>
                      <p className="text-xs text-gray-500">Get reminders for study sessions</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.studyPreferences.notifications}
                      onChange={e => setProfile(prev => ({
                        ...prev,
                        studyPreferences: {
                          ...prev.studyPreferences,
                          notifications: e.target.checked
                        }
                      }))}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} className="text-indigo-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Sound Effects</span>
                      <p className="text-xs text-gray-500">Enable timer sounds</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.studyPreferences.soundEffects}
                      onChange={e => setProfile(prev => ({
                        ...prev,
                        studyPreferences: {
                          ...prev.studyPreferences,
                          soundEffects: e.target.checked
                        }
                      }))}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Achievements */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Trophy size={20} />
                Achievements
              </h2>
              
              <div className="space-y-4">
                {profile.achievements.length > 0 ? (
                  profile.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Trophy className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        <p className="text-xs text-indigo-600 mt-2">Earned on {new Date(achievement.date || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">No achievements yet</p>
                    <p className="text-sm text-gray-400 mt-1">Complete study sessions to earn achievements</p>
                  </div>
                )}
              </div>
            </div>

            {/* Study Stats */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl text-white">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={18} />
                Study Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100">Current Streak</span>
                  <span className="font-bold">3 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100">Total Study Time</span>
                  <span className="font-bold">42 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100">Sessions Completed</span>
                  <span className="font-bold">28</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}