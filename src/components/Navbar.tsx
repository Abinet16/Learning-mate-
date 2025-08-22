import { Link, useLocation } from 'react-router-dom';
import { BarChart2, CheckSquare, Home, Book, Bot, User, LogOut, Settings, HelpCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const navItems = [
    { to: "/", icon: <Home size={20} />, label: "Dashboard" },
    { to: "/tasks", icon: <CheckSquare size={20} />, label: "Tasks" },
    { to: "/subjects", icon: <Book size={20} />, label: "Subjects" },
    { to: "/analytics", icon: <BarChart2 size={20} />, label: "Analytics" },
    { to: "/ai-assistant", icon: <Bot size={20} />, label: "AI Assistant" },
    { to: "/profile", icon: <User size={20} />, label: "Profile" },
  ];

  return (
    <>
      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-50 md:hidden shadow-lg">
        <ul className="flex justify-around">
          {navItems.slice(0, 4).map((item) => (
            <MobileNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.to)}
            />
          ))}
          <li>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex flex-col items-center p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-1 h-1 bg-current rounded-full mb-1"></div>
                <div className="w-1 h-1 bg-current rounded-full mb-1"></div>
                <div className="w-1 h-1 bg-current rounded-full"></div>
              </div>
              <span className="text-xs mt-1">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Expanded Menu */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setIsExpanded(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4">
            <div className="grid grid-cols-2 gap-2">
              {navItems.slice(4).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsExpanded(false)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                    isActive(item.to)
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-3 p-4 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:h-screen md:w-80 md:bg-gradient-to-b md:from-indigo-600 md:to-purple-700 md:text-white md:z-40 md:shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-8">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Book className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ሳምኬት</h1>
            <p className="text-indigo-100 text-sm">Your learning companion</p>
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="px-8 py-6 mb-6">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{user.user_metadata?.name || 'User'}</div>
                <div className="text-indigo-200 text-sm truncate">{user.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <ul className="flex-1 space-y-2 px-6">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group
                  ${isActive(item.to)
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive(item.to) 
                    ? 'bg-white/20' 
                    : 'bg-white/10 group-hover:bg-white/20'
                }`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive(item.to) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer Section */}
        <div className="p-6 mt-auto space-y-4 border-t border-white/20">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-4 p-4 rounded-2xl text-indigo-100 hover:bg-white/10 hover:text-white transition-all w-full"
          >
            <div className="p-2 rounded-lg bg-white/10">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Support Links */}
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center gap-2 p-3 rounded-xl text-indigo-100 hover:bg-white/10 transition-colors text-sm">
              <Settings size={16} />
              Settings
            </button>
            <button className="flex items-center gap-2 p-3 rounded-xl text-indigo-100 hover:bg-white/10 transition-colors text-sm">
              <HelpCircle size={16} />
              Help
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 rounded-2xl text-white bg-white/10 hover:bg-white/20 transition-all w-full group"
          >
            <div className="p-2 rounded-lg bg-white/20">
              <LogOut size={20} />
            </div>
            <span className="font-medium">Logout</span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              👋
            </div>
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 translate-y-12"></div>
      </nav>

      {/* Desktop Content Padding */}
      <div className="hidden md:block md:ml-80"></div>
    </>
  );
}

function MobileNavItem({ to, icon, label, isActive }: { to: string; icon: React.ReactNode; label: string; isActive: boolean }) {
  return (
    <li className="flex-1">
      <Link
        to={to}
        className="flex flex-col items-center p-2 rounded-xl transition-colors"
      >
        <div className={`p-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' 
            : 'text-gray-600 dark:text-gray-300'
        }`}>
          {icon}
        </div>
        <span className={`text-xs mt-1 ${
          isActive 
            ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
            : 'text-gray-600 dark:text-gray-300'
        }`}>
          {label}
        </span>
      </Link>
    </li>
  );
}