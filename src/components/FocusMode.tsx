import { useState, useEffect } from 'react';
import { BellRing, Focus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface FocusModeProps {
  isStudyActive: boolean;
}

export default function FocusMode({ isStudyActive }: FocusModeProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isFocusMode && isStudyActive) {
      // Request notification permission
      if ('Notification' in window) {
        Notification.requestPermission();
      }

      // Set up focus mode reminder
      const interval = setInterval(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Focus Mode Active', {
            body: 'Stay focused on your studies!',
            icon: '/favicon.ico'
          });
        }
        setShowNotification(true);
      }, 10 * 60 * 1000); // Every 10 minutes

      return () => clearInterval(interval);
    }
  }, [isFocusMode, isStudyActive]);

  const toggleFocusMode = () => {
    if (!isFocusMode) {
      toast.success('Focus mode activated');
    }
    setIsFocusMode(!isFocusMode);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleFocusMode}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isFocusMode
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Focus size={20} />
        Focus Mode
      </button>

      {showNotification && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border p-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <BellRing className="text-indigo-600" />
            <div className="flex-1">
              <h4 className="font-medium">Stay Focused!</h4>
              <p className="text-sm text-gray-500">
                Remember to maintain your concentration and avoid distractions.
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}