import { useState } from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Flag, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onTaskCreate: (task: Task) => void;
}

type SortField = 'dueDate' | 'priority' | 'subject';
type SortDirection = 'asc' | 'desc';

export default function TaskList({ tasks, onTaskComplete, onDeleteTask, onEditTask, onTaskCreate }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  // Filter tasks
  const filteredTasks = tasks;

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'priority': {
        const priorityWeight = { low: 0, medium: 1, high: 2 };
        comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
        break;
      }
      case 'subject':
        comparison = a.subject.localeCompare(b.subject);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const priorityColor = {
    low: 'text-gray-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setIsDeleting(taskId);
      const taskToDelete = tasks.find(task => task.id === taskId);
      if (!taskToDelete) {
        throw new Error('Task not found');
      }
      
      await onDeleteTask(taskId);
      setDeletedTasks([taskToDelete]);
      
      toast.success(
        <div className="flex items-center space-x-2">
          <span>Task deleted</span>
          <button
            onClick={() => handleUndoBulkDelete()}
            className="px-2 py-1 text-sm bg-white rounded-md shadow-sm hover:bg-gray-50"
          >
            Undo
          </button>
        </div>,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const tasksToDelete = tasks.filter(task => selectedTasks.has(task.id));
      if (tasksToDelete.length === 0) {
        toast.error('No tasks selected');
        return;
      }

      setDeletedTasks(tasksToDelete);
      
      // Delete all selected tasks
      await Promise.all([...selectedTasks].map(taskId => onDeleteTask(taskId)));
      
      toast.success(
        <div className="flex items-center space-x-2">
          <span>{selectedTasks.size} tasks deleted</span>
          <button
            onClick={handleUndoBulkDelete}
            className="px-2 py-1 text-sm bg-white rounded-md shadow-sm hover:bg-gray-50"
          >
            Undo
          </button>
        </div>,
        { duration: 5000 }
      );
      
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Error deleting tasks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete tasks');
    }
  };

  const handleUndoBulkDelete = async () => {
    if (!deletedTasks.length) return;
    
    try {
      // Restore all deleted tasks
      await Promise.all(deletedTasks.map(task => onTaskCreate(task)));
      toast.success(`${deletedTasks.length} task${deletedTasks.length > 1 ? 's' : ''} restored`);
      setDeletedTasks([]);
    } catch (error) {
      console.error('Error restoring tasks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore tasks');
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    }
  };

  return (
    <div className="w-full">
      {selectedTasks.size > 0 && (
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedTasks.size === filteredTasks.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedTasks.size} selected
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[auto,1fr,auto,auto] gap-4 p-4 bg-gray-50 border-b border-gray-100">
          <div className="w-8"></div>
          <button
            onClick={() => toggleSort('subject')}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Subject <SortIcon field="subject" />
          </button>
          <button
            onClick={() => toggleSort('dueDate')}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Due Date <SortIcon field="dueDate" />
          </button>
          <button
            onClick={() => toggleSort('priority')}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Priority <SortIcon field="priority" />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedTasks.map(task => (
            <div 
              key={task.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border ${
                task.completed
                  ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedTasks.has(task.id)}
                onChange={() => toggleTaskSelection(task.id)}
                className="w-4 h-4 text-blue-600"
              />
              <button 
                onClick={() => onTaskComplete(task.id)}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {task.completed ? <CheckCircle2 className="text-green-500" /> : <Circle />}
              </button>
              
              <div>
                <h3 className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}
                <div className="text-sm text-gray-500 mt-1">{task.subject}</div>
              </div>

              <div className="text-sm text-gray-500">
                {format(new Date(task.dueDate), 'MMM d')}
              </div>

              <div className="flex items-center gap-2">
                <Flag className={priorityColor[task.priority]} size={16} />
                {onEditTask && (
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <Pencil size={16} className="text-gray-500" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  disabled={isDeleting === task.id}
                  className={`ml-4 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition-colors ${
                    isDeleting === task.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}