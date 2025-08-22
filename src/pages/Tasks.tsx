import { useState, useEffect } from 'react';
import { Task } from '../types';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import { Plus, CheckSquare, Clock, Calendar, Filter, Target, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  const completedTasks = tasks.filter(task => task.completed);
  const activeTasks = tasks.filter(task => !task.completed);
  const highPriorityTasks = activeTasks.filter(task => task.priority === 'high');

  const handleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      toast.success('Task completed! 🎉', {
        icon: '✅',
        style: {
          borderRadius: '12px',
          background: '#10b981',
          color: '#fff',
        },
      });
    }
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    toast.success('Task created successfully!', {
      icon: '📝',
      style: {
        borderRadius: '12px',
        background: '#ef4444',
        color: '#fff',
      },
    });
  };

  const handleUpdateTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    if (!editingTask) return;
    setTasks(tasks.map(task =>
      task.id === editingTask.id
        ? { ...task, ...taskData, completed: task.completed }
        : task
    ));
    toast.success('Task updated successfully!', {
      icon: '✏️',
      style: {
        borderRadius: '12px',
        background: '#ef4444',
        color: '#fff',
      },
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast.success('Task deleted successfully!', {
      icon: '🗑️',
      style: {
        borderRadius: '12px',
        background: 'rgba(243, 8, 8, 1)',
        color: '#fff',
      },
    });
  };

  const clearCompletedTasks = () => {
    setTasks(tasks.filter(task => !task.completed));
    toast.success('Completed tasks cleared!', {
      icon: '🧹',
      style: {
        borderRadius: '12px',
        background: '#ef4444',
        color: '#fff',
      },
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <CheckSquare className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
              <p className="text-gray-600">Stay organized and productive</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            New Task
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Target className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-xl font-bold text-gray-900">{tasks.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckSquare className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{completedTasks.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{activeTasks.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingUp className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-xl font-bold text-gray-900">{highPriorityTasks.length}</p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              {(['all', 'active', 'completed'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === option
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
              </div>
              {(['priority', 'dueDate', 'created'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    sortBy === option
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option === 'dueDate' ? 'Due Date' : option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>

            {completedTasks.length > 0 && (
              <button
                onClick={clearCompletedTasks}
                className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Clear Completed
              </button>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <TaskList
            tasks={filteredTasks}
            onTaskComplete={handleTaskComplete}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onTaskCreate={handleCreateTask}
          />

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <CheckSquare className="text-indigo-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'completed' ? 'No completed tasks yet' : 'No tasks yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'completed' 
                  ? 'Complete some tasks to see them here!'
                  : 'Get started by creating your first task.'
                }
              </p>
              {filter !== 'completed' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Your First Task
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress Summary */}
        {tasks.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Progress Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-indigo-100 mb-2">Total Tasks: {tasks.length}</p>
                <p className="text-indigo-100 mb-2">Completed: {completedTasks.length}</p>
                <p className="text-indigo-100">Completion Rate: {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%</p>
              </div>
              <div>
                <p className="text-indigo-100 mb-2">High Priority: {highPriorityTasks.length}</p>
                <p className="text-indigo-100 mb-2">Due Soon: {tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).length}</p>
                <p className="text-indigo-100">Average Priority: {tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.priority === 'high' ? 3 : t.priority === 'medium' ? 2 : 1), 0) / tasks.length * 10) / 10 : 0}/3</p>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <TaskForm
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onClose={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            initialData={editingTask || undefined}
          />
        )}
      </div>
    </div>
  );
}