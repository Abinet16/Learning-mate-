import { Link, useLocation } from "react-router-dom";
import {
  BarChart2,
  CheckSquare,
  Home,
  Book,
  Bot,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully 🚀");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { to: "/", icon: <Home size={20} />, label: "Dashboard", color: "from-blue-500 to-cyan-500" },
    { to: "/tasks", icon: <CheckSquare size={20} />, label: "Tasks", color: "from-green-500 to-emerald-500" },
    { to: "/subjects", icon: <Book size={20} />, label: "Subjects", color: "from-purple-500 to-pink-500" },
    { to: "/analytics", icon: <BarChart2 size={20} />, label: "Analytics", color: "from-orange-500 to-yellow-500" },
    { to: "/ai-assistant", icon: <Bot size={20} />, label: "AI Assistant", color: "from-pink-500 to-rose-500" },
    { to: "/profile", icon: <User size={20} />, label: "Profile", color: "from-indigo-500 to-purple-500" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-indigo-50 via-white to-purple-50 backdrop-blur-md border-r border-gray-200 shadow-xl flex-col z-30">
        {/* Brand */}
        <div className="flex items-center h-20 px-4">
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
            className="px-4 py-4 border-b"
          >
            <div className="font-medium text-gray-800">
              {user.user_metadata.name}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </motion.div>
        )}

        {/* Nav Links */}
        <ul className="flex flex-col space-y-2 mt-8 flex-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.to)}
              color={item.color}
            />
          ))}
        </ul>

        {/* Logout */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="px-4 py-4"
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

      {/* Mobile Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-50 via-white to-purple-50 backdrop-blur-md border-t border-gray-200 px-4 py-2 z-30 shadow-xl">
        {/* Mobile Nav Items */}
        <ul className="flex justify-around">
          {navItems.slice(0, 4).map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.to)}
              color={item.color}
              isMobile={true}
            />
          ))}
          
          {/* Mobile Menu Toggle */}
          <motion.li
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <button
              onClick={toggleMobileMenu}
              className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 relative overflow-hidden
                ${isMobileMenuOpen
                  ? "text-white bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold shadow-lg"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
                }`}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Tooltip */}
            <span className="absolute bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-all">
              Menu
            </span>
          </motion.li>
        </ul>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 bg-black z-40"
              onClick={toggleMobileMenu}
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 p-6"
            >
              {/* User Info in Mobile Menu */}
              {user && (
                <div className="px-4 py-4 border-b mb-4">
                  <div className="font-medium text-gray-800 text-center">
                    {user.user_metadata.name}
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    {user.email}
                  </div>
                </div>
              )}

              {/* Additional Nav Items for Mobile */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {navItems.slice(4).map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.to)}
                    color={item.color}
                    isMobile={true}
                    fullWidth={true}
                    onClick={toggleMobileMenu}
                  />
                ))}
              </div>

              {/* Brand in Mobile Menu */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  ሳምኬት
                </h1>
                <p className="text-gray-500 text-sm">Your learning companion</p>
              </div>

              {/* Logout in Mobile Menu */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 w-full p-3 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-xl transition-all duration-300 border border-red-200"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              )}

              {/* Close button */}
              <button
                onClick={toggleMobileMenu}
                className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for mobile navbar */}
      <div className="md:hidden h-16"></div>
    </>
  );
}

/* NavItem Component */
function NavItem({
  to,
  icon,
  label,
  isActive,
  color,
  isMobile = false,
  fullWidth = false,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  color: string;
  isMobile?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.li
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
      style={fullWidth ? { width: '100%' } : {}}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden
          ${fullWidth ? 'justify-center' : 'justify-center md:justify-start'}
          ${
            isActive
              ? `text-white bg-gradient-to-r ${color} font-semibold shadow-lg`
              : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
          }`}
      >
        {/* Glowing Indicator Bar */}
        {isActive && !isMobile && (
          <motion.span
            layoutId="activeIndicator"
            className={`absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b ${color} shadow-lg`}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
        
        {icon}
        <span className="hidden md:inline">{label}</span>
      </Link>

      {/* Tooltip for Mobile */}
      {isMobile && (
        <span className="absolute bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
          {label}
        </span>
      )}
    </motion.li>
  );
}