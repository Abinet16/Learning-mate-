import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudyTimerProps {
  onSessionComplete: (minutes: number) => void;
  onStart: () => void;
  onStop: () => void;
}

export default function StudyTimer({ onSessionComplete, onStart, onStop }: StudyTimerProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const playSound = (soundName: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(error => console.error('Error playing sound:', error));
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        silent: true // We'll handle sound separately
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            onStop();
            playSound('work-complete');
            showNotification('Study Session Complete! 🎉', `Great job! You studied for ${sessionMinutes} minutes.`);
            toast.success(
              <div>
                <p className="font-medium">Study session complete!</p>
                <p className="text-sm">You studied for {Math.floor(sessionMinutes)} minutes 🎉</p>
              </div>
            );
            onSessionComplete(25); // Default session length
            setSessionMinutes(0);
            setMinutes(25);
            setSeconds(0);
            return;
          }
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
        setSessionMinutes(prev => prev + 1/60);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, onSessionComplete, onStop, sessionMinutes]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive) {
      playSound('timer-start');
      onStart();
    } else {
      onStop();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    onStop();
    setMinutes(25);
    setSeconds(0);
    setSessionMinutes(0);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500">Study Timer</h3>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      
      <div className="text-5xl font-bold text-center mb-6">
        {formatTime(minutes, seconds)}
      </div>
      
      <div className="flex justify-center gap-4">
        <button
          onClick={toggleTimer}
          className="p-3 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
        >
          {isActive ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {sessionMinutes > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Current session: {Math.floor(sessionMinutes)} minutes
        </div>
      )}
    </div>
  );
}