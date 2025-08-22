import { useState } from 'react';
import { StudySession, Subject } from '../types';
import { BarChart2, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface StudyStatsProps {
  sessions: StudySession[];
  subjects: Subject[];
}

export default function StudyStats({ sessions, subjects }: StudyStatsProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const getFilteredSessions = () => {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= startOfWeek(now) && sessionDate <= endOfWeek(now);
        });
      case 'month':
        return sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return (
            sessionDate.getMonth() === now.getMonth() &&
            sessionDate.getFullYear() === now.getFullYear()
          );
        });
      default:
        return sessions;
    }
  };

  const exportStats = () => {
    const filteredSessions = getFilteredSessions();
    const stats = subjects.map(subject => {
      const subjectSessions = filteredSessions.filter(s => s.subject === subject.name);
      const totalMinutes = subjectSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      return {
        subject: subject.name,
        totalHours: (totalMinutes / 60).toFixed(1),
        sessionsCount: subjectSessions.length,
      };
    });

    const csv = [
      ['Subject', 'Total Hours', 'Number of Sessions'],
      ...stats.map(s => [s.subject, s.totalHours, s.sessionsCount]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-stats-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredSessions = getFilteredSessions();
  const subjectStats = subjects
    .map(subject => {
      const subjectSessions = filteredSessions.filter(s => s.subject === subject.name);
      const totalMinutes = subjectSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      const totalAllMinutes = filteredSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      return {
        subject,
        totalHours: totalMinutes / 60,
        percentage: totalAllMinutes > 0 ? (totalMinutes / totalAllMinutes) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BarChart2 className="text-indigo-600" />
          </div>
          <h3 className="font-semibold text-lg text-gray-900">Study Statistics</h3>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value as 'week' | 'month' | 'all')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportStats}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-5">
        {subjectStats.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm italic">
            No study data available for this timeframe 📊
          </div>
        ) : (
          subjectStats.map(({ subject, totalHours, percentage }) => (
            <div
              key={subject.id}
              className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="font-medium text-gray-800">{subject.name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {totalHours.toFixed(1)}h · {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: subject.color,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
