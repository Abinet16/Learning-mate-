import { useState, useEffect, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { BarChart2, Clock, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { getStudySessions } from '../utils/storage';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { PieChart, Pie, Cell, Legend as PieLegend } from 'recharts';

interface StudySession {
  date: string;
  durationMinutes: number;
  subject: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ee681aff', '#f59e0b', '#10b981', '#3b82f6'];

export default function Analytics() {
  const [studyTime, setStudyTime] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudySessions() {
      try {
        const sessions = await getStudySessions();
        const transformedSessions = sessions.map(session => {
          const durationMatch = session.content.match(/Duration: (\d+) minutes/);
          const subjectMatch = session.content.match(/Subject: (.+?)(?:\n|$)/);
          const parsedDate = parseISO(session.created_at);
          return {
            date: isNaN(parsedDate.getTime()) ? '' : format(parsedDate, 'yyyy-MM-dd'),
            durationMinutes: durationMatch ? parseInt(durationMatch[1], 10) : 0,
            subject: subjectMatch ? subjectMatch[1].trim() : 'Unknown'
          };
        }).filter(session => session.date && session.durationMinutes > 0); // Filter invalid sessions
        setStudyTime(transformedSessions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error loading study sessions:', errorMessage);
        setError('Failed to load study data. Please try refreshing the page.');
        toast.error('Failed to load study data');
      } finally {
        setIsLoading(false);
      }
    }
    loadStudySessions();
  }, []);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const minutes = studyTime
        .filter(session => session.date === dateStr)
        .reduce((acc, session) => acc + session.durationMinutes, 0);
      return {
        date: format(date, 'MMM d'),
        minutes,
      };
    }).reverse();
  }, [studyTime]);

  const totalMinutes = useMemo(() => {
    return studyTime.reduce((acc, session) => acc + session.durationMinutes, 0);
  }, [studyTime]);

  const averageMinutesPerDay = useMemo(() => {
    const daysWithStudy = new Set(studyTime.map(s => s.date)).size;
    return daysWithStudy > 0 ? Math.round(totalMinutes / daysWithStudy) : 0;
  }, [studyTime, totalMinutes]);

  const subjectDistribution = useMemo(() => {
    const subjectMap = studyTime.reduce((acc, session) => {
      acc[session.subject] = (acc[session.subject] || 0) + session.durationMinutes;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(subjectMap).map(([subject, minutes]) => ({
      name: subject,
      value: minutes,
    })).sort((a, b) => b.value - a.value);
  }, [studyTime]);

  const formatTime = (minutes: number) => {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (studyTime.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No study sessions found. Start studying to see analytics!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Study Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
          <Clock size={24} className="text-indigo-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Study Time</h3>
            <p className="text-2xl font-bold text-gray-900">{formatTime(totalMinutes)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
          <TrendingUp size={24} className="text-indigo-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
            <p className="text-2xl font-bold text-gray-900">{formatTime(averageMinutesPerDay)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Study Time - Last 7 Days</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${value}m`} />
              <Tooltip formatter={(value: number) => formatTime(value)} />
              <Legend />
              <Bar dataKey="minutes" fill="#6366f1" name="Minutes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <PieIcon size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Subject Distribution</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subjectDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {subjectDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatTime(value)} />
              <PieLegend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}