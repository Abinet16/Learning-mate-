import { useState } from 'react';
import { Subject } from '../types';
import { X, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubjectManagerProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onEditSubject: (id: string, subject: Omit<Subject, 'id'>) => void;
  onDeleteSubject: (id: string) => void;
  onClose: () => void;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9E9E9E', '#58B19F', '#FFB6B9', '#BAD7DF'
];

export default function SubjectManager({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onClose
}: SubjectManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: COLORS[0],
    goalHoursPerWeek: 5
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [deletedSubjects, setDeletedSubjects] = useState<Array<{
    id: string;
    name: string;
    color: string;
    goalHoursPerWeek: number;
  }>>([]);

  const toggleSubjectSelection = (subjectId: string) => {
    const newSelection = new Set(selectedSubjects);
    if (newSelection.has(subjectId)) {
      newSelection.delete(subjectId);
    } else {
      newSelection.add(subjectId);
    }
    setSelectedSubjects(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedSubjects.size === subjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(subjects.map(subject => subject.id)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const subjectsToDelete = subjects.filter(subject => selectedSubjects.has(subject.id));
      setDeletedSubjects(subjectsToDelete);
      
      // Delete all selected subjects
      await Promise.all([...selectedSubjects].map(subjectId => onDeleteSubject(subjectId)));
      
      toast.success(
        <div className="flex items-center space-x-2">
          <span>{selectedSubjects.size} subjects deleted</span>
          <button
            onClick={handleUndoBulkDelete}
            className="px-2 py-1 text-sm bg-white rounded-md shadow-sm hover:bg-gray-50"
          >
            Undo
          </button>
        </div>,
        { duration: 5000 }
      );
      
      setSelectedSubjects(new Set());
    } catch (error) {
      console.error('Error deleting subjects:', error);
      toast.error('Failed to delete subjects');
    }
  };

  const handleUndoBulkDelete = async () => {
    if (!deletedSubjects.length) return;
    
    try {
      // Restore all deleted subjects
      await Promise.all(
        deletedSubjects.map(subject =>
          onAddSubject({
            name: subject.name,
            color: subject.color,
            goalHoursPerWeek: subject.goalHoursPerWeek,
            description: '' // or provide a default/previous description if available
          })
        )
      );
      toast.success('Subjects restored');
      setDeletedSubjects([]);
    } catch (error) {
      console.error('Error restoring subjects:', error);
      toast.error('Failed to restore subjects');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a subject name');
      return;
    }

    if (editingId) {
      onEditSubject(editingId, { ...formData, description: '' });
      setEditingId(null);
    } else {
      onAddSubject({ ...formData, description: '' });
    }

    setFormData({ name: '', color: COLORS[0], goalHoursPerWeek: 5 });
    toast.success(editingId ? 'Subject updated' : 'Subject added');
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      color: subject.color,
      goalHoursPerWeek: subject.goalHoursPerWeek
    });
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      await onDeleteSubject(id);
      toast.success('Subject deleted');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Manage Subjects</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter subject name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-black' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Goal (hours)
              </label>
              <input
                type="number"
                value={formData.goalHoursPerWeek}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  goalHoursPerWeek: Math.max(0, parseInt(e.target.value) || 0)
                }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              {editingId ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>

        {selectedSubjects.size > 0 && (
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedSubjects.size === subjects.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {selectedSubjects.size} selected
              </span>
            </div>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md"
            >
              Delete Selected
            </button>
          </div>
        )}

        <div className="space-y-2">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedSubjects.has(subject.id)}
                  onChange={() => toggleSubjectSelection(subject.id)}
                  className="w-4 h-4 text-blue-600"
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span>{subject.name}</span>
                <span className="text-sm text-gray-500">
                  {subject.goalHoursPerWeek}h/week
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(subject)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(subject.id)}
                  disabled={isDeleting === subject.id}
                  className={`p-1 text-gray-500 hover:text-red-500 ${
                    isDeleting === subject.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}