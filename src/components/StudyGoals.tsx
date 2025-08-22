import { useState } from 'react';
import { StudyGoal, Subject } from '../types';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudyGoalsProps {
  goals: StudyGoal[];
  subjects: Subject[];
  onAddGoal: (goal: Omit<StudyGoal, 'id' | 'completed'>) => void;
  onToggleGoal: (id: string) => void;
}

export default function StudyGoals({ goals, subjects, onAddGoal, onToggleGoal }: StudyGoalsProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    targetHours: 10,
    deadline: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject) {
      toast.error('Please select a subject');
      return;
    }
    onAddGoal(formData);
    setShowForm(false);
    setFormData({
      subject: '',
      targetHours: 10,
      deadline: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
    });
    toast.success('Study goal added');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target size={20} className="text-indigo-600" />
          Study Goals
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Goal
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={formData.subject}
              onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Hours
              </label>
              <input
                type="number"
                value={formData.targetHours}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  targetHours: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Add Goal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {goals.map(goal => (
          <div
            key={goal.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleGoal(goal.id)}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {goal.completed ? (
                  <CheckCircle2 className="text-green-500" />
                ) : (
                  <Circle />
                )}
              </button>
              <div>
                <h4 className={`font-medium ${goal.completed ? 'line-through text-gray-400' : ''}`}>
                  {goal.subject} - {goal.targetHours} hours
                </h4>
                <p className="text-sm text-gray-500">
                  Due {format(new Date(goal.deadline), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}