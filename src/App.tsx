import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Subjects from "./pages/Subjects";
import Analytics from "./pages/Analytics";
import AiAssistant from "./pages/AiAssistant";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import LoadingSpinner from "./components/LoadingSpinner";
import SocialWidget from "./components/SocialWidget";
import { motion, AnimatePresence } from "framer-motion";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user } = useAuth();

  return (
    <Router>
      {/* Always mount Navbar when logged in.
          Navbar itself handles: mobile bottom bar + desktop sidebar (fixed). */}
      {user && <Navbar />}

      <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            user
              ? // On mobile: add bottom padding so content never hides behind bottom navbar.
                // On desktop: shift content to the right of the 256px sidebar.
                "px-4 pt-4 pb-24 md:py-8 md:px-8 lg:px-12 md:ml-64"
              : ""
          }`}
          // Extra safe-area for iOS devices with home indicator.
          style={user ? { paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" } : undefined}
        >
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <Routes>
                {/* Auth Routes */}
                <Route
                  path="/login"
                  element={
                    user ? (
                      <Navigate to="/" replace />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Login />
                      </motion.div>
                    )
                  }
                />
                <Route
                  path="/signup"
                  element={
                    user ? (
                      <Navigate to="/" replace />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Signup />
                      </motion.div>
                    )
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <PrivateRoute>
                      <Tasks />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/subjects"
                  element={
                    <PrivateRoute>
                      <Subjects />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <PrivateRoute>
                      <Analytics />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ai-assistant"
                  element={
                    <PrivateRoute>
                      <AiAssistant />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />

                {/* Fallback */}
                <Route
                  path="*"
                  element={
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <NotFound />
                    </motion.div>
                  }
                />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Floating Social Widget */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        // Nudge up a bit so it doesn't sit under the mobile navbar.
        className={user ? "mb-24 md:mb-0" : ""}
      >
        <SocialWidget />
      </motion.div>

      {/* Toast Notifications (lifted above mobile navbar) */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#fff",
            color: "#333",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)",
          },
          success: {
            iconTheme: {
              primary: "#4F46E5",
              secondary: "#fff",
            },
          },
        }}
        containerStyle={{
          // More breathing room when the user has a bottom navbar
          bottom: user ? 96 : 40,
          right: 40,
        }}
      />
    </Router>
  );
}

export default App;
