import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Sun, Moon, Mic, LogOut, Menu, X, Sprout, User } from 'lucide-react';

const Navbar = ({ onOpenVoice, toggleMobileSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  // Sync theme with local storage on mount
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 glass w-full py-3.5 px-4 md:px-8 flex items-center justify-between border-b border-gray-200 dark:border-earth-800 transition-colors duration-300">
      <div className="flex items-center gap-3">
        {user && (
          <button 
            onClick={toggleMobileSidebar} 
            className="md:hidden p-1.5 text-gray-500 hover:text-farm-600 dark:text-gray-400 dark:hover:text-farm-400 focus:outline-none"
            aria-label="Toggle Navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-farm-600 text-white p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Sprout className="h-5 w-5 hover-wiggle" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-farm-700 via-farm-600 to-harvest-600 dark:from-farm-400 dark:via-farm-300 dark:to-harvest-500 bg-clip-text text-transparent">
            AgroTech AI
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Voice Assistant MIC shortcut (available when logged in) */}
        {user && (
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 bg-gradient-to-r from-farm-500 to-farm-600 hover:from-farm-600 hover:to-farm-700 text-white font-semibold py-2 px-3 md:px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 scale-95 md:scale-100"
            title="Talk to AgroTech Voice"
          >
            <Mic className="h-4.5 w-4.5 animate-pulse" />
            <span className="hidden md:inline text-sm">Voice Doctor</span>
          </button>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-earth-800 text-gray-600 dark:text-gray-300 transition-colors duration-300 focus:outline-none"
          title="Toggle Light/Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Authenticated User Menu */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-none">
                {user.name}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium capitalize mt-0.5">
                {user.role} Dashboard
              </span>
            </div>
            
            <Link 
              to="/dashboard" 
              className="h-9 w-9 rounded-xl bg-farm-100 dark:bg-farm-950 text-farm-700 dark:text-farm-300 flex items-center justify-center font-bold text-sm border border-farm-200 dark:border-farm-900"
              title="Go to Dashboard"
            >
              <User className="h-4 w-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 focus:outline-none"
              title="Log Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-farm-600 font-medium text-sm py-2 px-3.5 rounded-xl transition-all duration-300"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm py-2 px-4 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
