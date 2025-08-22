import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md mx-auto animate-fade-in">
        <AlertTriangle className="w-24 h-24 text-indigo-500 mb-6 mx-auto animate-bounce-slow" />
        <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-tight">
          404
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">
          Oops! Page Not Found
        </p>
        <p className="text-base text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          <Home size={20} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}