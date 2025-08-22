import { useState, useEffect } from 'react';
import { Subject, StudySession } from '../types';
import SubjectManager from '../components/SubjectManager';
import { Book, Plus, Clock, Target, Award } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('subjects');
    return saved ? JSON.parse(saved) : [];
  });

  const [studySessions, setStudySessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('studyTime');
    return saved ? JSON.parse(saved) : [];
  });

  const [showManager, setShowManager] = useState(false);
  const [selectedView, setSelectedView] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    // Listen for study session updates
    const handleStorageChange = () => {
      const saved = localStorage.getItem('studyTime');
      if (saved) {
        setStudySessions(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getTimeProgress = (subjectName: string, period: 'weekly' | 'monthly' = 'weekly') => {
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    if (period === 'weekly') {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    const periodMinutes = studySessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return session.subject === subjectName &&
               isWithinInterval(sessionDate, { start: startDate, end: endDate });
      })
      .reduce((acc, session) => acc + session.durationMinutes, 0);
    
    return periodMinutes / 60; // Convert to hours
  };

  const getTotalStudyTime = () => {
    return studySessions.reduce((total, session) => total + session.durationMinutes, 0) / 60;
  };

  const getCompletionRate = (subject: Subject) => {
    const weeklyHours = getTimeProgress(subject.name, 'weekly');
    return (weeklyHours / subject.goalHoursPerWeek) * 100;
  };

  const handleAddSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subjectData,
      id: crypto.randomUUID(),
    };
    setSubjects([...subjects, newSubject]);
    toast.success(`${subjectData.name} added successfully!`, {
      icon: '✅',
      style: {
        borderRadius: '12px',
        background: '#4f46e5',
        color: '#fff',
      },
    });
  };

  const handleEditSubject = (id: string, subjectData: Omit<Subject, 'id'>) => {
    setSubjects(subjects.map(subject =>
      subject.id === id ? { ...subject, ...subjectData } : subject
    ));
    toast.success(`${subjectData.name} updated successfully!`, {
      icon: '✅',
      style: {
        borderRadius: '12px',
        background: '#4f46e5',
        color: '#fff',
      },
    });
  };

  const handleDeleteSubject = (id: string) => {
    const subjectToDelete = subjects.find(s => s.id === id);
    setSubjects(subjects.filter(subject => subject.id !== id));
    toast.success(`${subjectToDelete?.name} deleted successfully!`, {
      icon: '✅',
      style: {
        borderRadius: '12px',
        background: '#4f46e5',
        color: '#fff',
      },
    });
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 100) return '🏆';
    if (percentage >= 75) return '🔥';
    if (percentage >= 50) return '👍';
    return '💪';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Book className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Subjects</h1>
              <p className="text-gray-600">Track your progress and set study goals</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setSelectedView('weekly')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedView === 'weekly'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSelectedView('monthly')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedView === 'monthly'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
            </div>
            
            <button
              onClick={() => setShowManager(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Manage Subjects
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Book className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Subjects</p>
              <p className="text-xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Clock className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Study Time</p>
              <p className="text-xl font-bold text-gray-900">{getTotalStudyTime().toFixed(1)}h</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Target className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Goals</p>
              <p className="text-xl font-bold text-gray-900">
                {subjects.filter(s => s.goalHoursPerWeek > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {subjects.map(subject => {
            const periodHours = getTimeProgress(subject.name, selectedView);
            const goalHours = selectedView === 'weekly' 
              ? subject.goalHoursPerWeek 
              : subject.goalHoursPerWeek * 4; // Approximate monthly goal
            const progress = goalHours > 0 ? (periodHours / goalHours) * 100 : 0;
            const completionRate = getCompletionRate(subject);
            
            return (
              <div
                key={subject.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-gray-900">{subject.name}</h3>
                      <p className="text-gray-500 text-sm">{subject.description || 'No description'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-lg font-bold text-gray-900">
                          {periodHours.toFixed(1)}h
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        of {goalHours}h {selectedView} goal
                      </span>
                    </div>
                    
                    <div className="hidden sm:block">
                      <div className={`text-lg font-bold ${getPerformanceColor(completionRate)}`}>
                        {getPerformanceIcon(completionRate)} {Math.min(100, Math.round(progress))}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{Math.min(100, Math.round(progress))}% Complete</span>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100">
                      <div
                        style={{
                          width: `${Math.min(100, progress)}%`,
                          backgroundColor: subject.color,
                          transition: 'width 0.5s ease-in-out',
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{selectedView === 'weekly' ? 'This week' : 'This month'}</span>
                    <span className="sm:hidden">
                      {getPerformanceIcon(completionRate)} {Math.min(100, Math.round(progress))}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {subjects.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Book className="text-indigo-400" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No subjects yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Add subjects to track your study progress and set weekly goals for better learning outcomes.
              </p>
              <button
                onClick={() => setShowManager(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors mx-auto shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add Your First Subject
              </button>
            </div>
          )}
        </div>

        {subjects.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award size={20} />
              Study Performance Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-indigo-100 mb-2">Total Subjects: {subjects.length}</p>
                <p className="text-indigo-100 mb-2">
                  Subjects with goals: {subjects.filter(s => s.goalHoursPerWeek > 0).length}
                </p>
                <p className="text-indigo-100">
                  Average completion: {subjects.length > 0 
                    ? Math.round(subjects.reduce((sum, s) => sum + getCompletionRate(s), 0) / subjects.length) 
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-indigo-100 mb-2">
                  Total study time: {getTotalStudyTime().toFixed(1)} hours
                </p>
                <p className="text-indigo-100 mb-2">
                  Study sessions: {studySessions.length}
                </p>
                <p className="text-indigo-100">
                  Most studied: {subjects.length > 0 
                    ? subjects.reduce((prev, current) => 
                        getTimeProgress(prev.name) > getTimeProgress(current.name) ? prev : current
                      ).name 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {showManager && (
          <SubjectManager
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
            onClose={() => setShowManager(false)}
          />
        )}
      </div>
    </div>
  );
}