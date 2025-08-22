import { Link, useLocation } from "react-router-dom";
import {BarChart2, CheckSquare, Home, Book, Bot, User, LogOut} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully 🚀");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-50 via-white to-purple-50 backdrop-blur-md border-t border-gray-200 px-4 py-2 z-30 md:top-0 md:bottom-auto md:right-auto md:h-screen md:w-64 md:border-t-0 md:border-r shadow-xl">
      {/* Brand */}
      <div className="hidden md:flex md:items-center md:h-20 md:px-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent"
        >
          ሳምኬት
          <p className="text-black-100 text-sm">Your learning companion</p>
        </motion.h1>
      </div>

      {/* User Info */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden md:block px-4 py-4 border-b"
        >
          <div className="font-medium text-gray-800">
            {user.user_metadata.name}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </motion.div>
      )}

      {/* Nav Links */}
      <ul className="flex justify-around md:flex-col md:space-y-2 md:mt-8">
        <NavItem
          to="/"
          icon={<Home size={20} />}
          label="Dashboard"
          isActive={isActive("/")}
          color="from-blue-500 to-cyan-500"
        />
        <NavItem
          to="/tasks"
          icon={<CheckSquare size={20} />}
          label="Tasks"
          isActive={isActive("/tasks")}
          color="from-green-500 to-emerald-500"
        />
        <NavItem
          to="/subjects"
          icon={<Book size={20} />}
          label="Subjects"
          isActive={isActive("/subjects")}
          color="from-purple-500 to-pink-500"
        />
        <NavItem
          to="/analytics"
          icon={<BarChart2 size={20} />}
          label="Analytics"
          isActive={isActive("/analytics")}
          color="from-orange-500 to-yellow-500"
        />
        <NavItem
          to="/ai-assistant"
          icon={<Bot size={20} />}
          label="AI Assistant"
          isActive={isActive("/ai-assistant")}
          color="from-pink-500 to-rose-500"
        />
        <NavItem
          to="/profile"
          icon={<User size={20} />}
          label="Profile"
          isActive={isActive("/profile")}
          color="from-indigo-500 to-purple-500"
        />
      </ul>

      {/* Logout */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="hidden md:block absolute bottom-8 left-0 right-0 px-4"
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-xl transition-all duration-300"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </motion.div>
      )}
    </nav>
  );
}

/* NavItem with Gradient Active Indicator */
function NavItem({
  to,
  icon,
  label,
  isActive,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  color: string;
}) {
  return (
    <motion.li
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
    >
      <Link
        to={to}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden
          ${
            isActive
              ? `text-white bg-gradient-to-r ${color} font-semibold shadow-lg`
              : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
          }`}
      >
        {/* Glowing Indicator Bar (Left Side in Desktop) */}
        {isActive && (
          <motion.span
            layoutId="activeIndicator"
            className={`absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b ${color} shadow-lg`}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
        {icon}
        <span className="hidden md:inline">{label}</span>
      </Link>

      {/* Tooltip (Mobile Hover / Tap) */}
      <span className="absolute md:hidden bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-all">
        {label}
      </span>
    </motion.li>
  );
}
