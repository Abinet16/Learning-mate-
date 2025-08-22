import { useState, useEffect } from 'react';
import { StudySession, StudyStreak, Subject } from '../types';
import PomodoroTimer from '../components/PomodoroTimer';
import StudyStreakComponent from '../components/StudyStreak';
import FocusMode from '../components/FocusMode';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  GraduationCap,
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  Target,
  Flame,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFromStorage, setToStorage } from '../utils/storage';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyTime, setStudyTime] = useState<StudySession[]>([]);
  const [isStudyActive, setIsStudyActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [streak, setStreak] = useState<StudyStreak>({
    currentStreak: 0,
    bestStreak: 0,
    lastStudyDate: new Date().toISOString(),
  });

  // Stats
  const totalStudyTime = studyTime.reduce((t, s) => t + s.durationMinutes, 0);
  const todayStudyTime = studyTime
    .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((t, s) => t + s.durationMinutes, 0);
  const weeklyStudyTime = studyTime
    .filter(s => {
      const d = new Date(s.date);
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    })
    .reduce((t, s) => t + s.durationMinutes, 0);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedSubjects, loadedStudyTime, loadedStreak] = await Promise.all([
          getFromStorage<Subject[]>('subjects', []),
          getFromStorage<StudySession[]>('studyTime', []),
          getFromStorage<StudyStreak>('streak', {
            currentStreak: 0,
            bestStreak: 0,
            lastStudyDate: new Date().toISOString(),
          }),
        ]);

        setSubjects(loadedSubjects || []);
        setStudyTime(loadedStudyTime || []);
        setStreak(loadedStreak);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load data. Please try refreshing.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) setToStorage('studyTime', studyTime).catch(console.error);
  }, [studyTime, isLoading]);

  useEffect(() => {
    if (!isLoading) setToStorage('streak', streak).catch(console.error);
  }, [streak, isLoading]);

  const handleStudySessionComplete = (minutes: number) => {
    if (minutes <= 0) return;

    const newSession: StudySession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      durationMinutes: minutes,
      subject: selectedSubject || 'General',
    };
    setStudyTime(prev => [...prev, newSession]);

    const today = new Date();
    const lastStudy = new Date(streak.lastStudyDate);
    today.setHours(0, 0, 0, 0);
    lastStudy.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));

    if (diff <= 1) {
      if (diff === 1 || (diff === 0 && streak.currentStreak === 0)) {
        setStreak(prev => ({
          currentStreak: prev.currentStreak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
          lastStudyDate: today.toISOString(),
        }));
      }
    } else {
      setStreak({
        currentStreak: 1,
        bestStreak: streak.bestStreak,
        lastStudyDate: today.toISOString(),
      });
    }

    setIsStudyActive(false);
    setSelectedSubject('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-100 to-indigo-200">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="text-red-500 mb-4">
            ⚠️
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl shadow-lg">
              <GraduationCap className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Study Dashboard</h1>
              <p className="text-gray-500">Stay consistent. Build your streak. Master your subjects.</p>
            </div>
          </div>
          <FocusMode isStudyActive={isStudyActive} />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {[
            { label: "Today's Study", value: todayStudyTime, icon: <Clock className="text-blue-600" />, color: "blue" },
            { label: "This Week", value: weeklyStudyTime, icon: <TrendingUp className="text-green-600" />, color: "green" },
            { label: "Total Time", value: totalStudyTime, icon: <Target className="text-purple-600" />, color: "purple" },
            { label: "Subjects", value: subjects.length, icon: <Calendar className="text-orange-600" />, color: "orange" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl border border-gray-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.label === "Subjects"
                    ? stat.value
                    : `${Math.floor((stat.value as number) / 60)}h ${(stat.value as number) % 60}m`}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Streak + Sessions */}
          <div className="lg:col-span-2 space-y-8">
            <StudyStreakComponent streak={streak} />

            {/* Recent Sessions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-100 p-6 rounded-2xl shadow-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen size={20} /> Recent Study Sessions
                </h2>
                {studyTime.length > 0 && (
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View All
                  </button>
                )}
              </div>

              {studyTime.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No study sessions yet</p>
                  <p className="text-sm text-gray-400">Start a session and track your progress!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studyTime.slice(0, 5).map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{session.subject}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.date).toLocaleDateString()} • {session.durationMinutes} mins
                        </p>
                      </div>
                      <span className="text-indigo-600 font-semibold">
                        {Math.floor(session.durationMinutes / 60)}h {session.durationMinutes % 60}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Timer + Tips */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-md border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Target size={20} /> Study Timer
              </h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Subject</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">General Study</option>
                  {subjects?.map(subject => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <PomodoroTimer
                onSessionComplete={handleStudySessionComplete}
                onStart={() => setIsStudyActive(true)}
                onStop={() => setIsStudyActive(false)}
              />
            </motion.div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200 shadow-sm">
              <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <Flame size={18} className="text-orange-500" /> Pro Tip
              </h3>
              <p className="text-indigo-700 text-sm">
                Use the <strong>Pomodoro technique</strong>: 25 minutes of focus + 5 minutes break. After 4 rounds, take a longer break!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
