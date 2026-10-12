import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  Stethoscope, 
  BookOpen, 
  Scroll, 
  TrendingUp, 
  ShieldAlert, 
  X, 
  UserCircle 
} from 'lucide-react';

const Sidebar = ({ isOpen, onCloseMobile }) => {
  const { user } = useContext(AuthContext);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'AI Crop Doctor',
      path: '/crop-doctor',
      icon: Stethoscope,
    },
    {
      name: 'Treatment Finder (RAG)',
      path: '/treatments',
      icon: BookOpen,
    },
    {
      name: 'Government Schemes',
      path: '/schemes',
      icon: Scroll,
    },
    {
      name: 'Market Trends',
      path: '/trends',
      icon: TrendingUp,
    },
  ];

  // Insert Admin Panel only if the logged-in user is an admin
  if (user && user.role === 'admin') {
    menuItems.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: ShieldAlert,
    });
  }

  const activeStyle = "flex items-center gap-3 bg-farm-100 text-farm-700 dark:bg-farm-950/40 dark:text-farm-300 font-bold py-3 px-4 rounded-xl border-l-4 border-farm-600 dark:border-farm-400 shadow-sm transition-all duration-200";
  const inactiveStyle = "flex items-center gap-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-earth-900 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-3 px-4 rounded-xl transition-all duration-200";

  return (
    <>
      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-45 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Container */}
      <aside className={`
        fixed md:sticky top-[73px] left-0 z-46
        h-[calc(100vh-73px)] w-64 p-4
        bg-white dark:bg-earth-950 border-r border-gray-200 dark:border-earth-900
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Header close button */}
        <div className="flex md:hidden items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-earth-900">
          <span className="font-extrabold text-sm text-gray-400 tracking-wider uppercase">Navigation</span>
          <button 
            onClick={onCloseMobile} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
            aria-label="Close Navigation Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Farmer Bio Tag Card */}
        {user && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-farm-50 to-emerald-100/50 dark:from-earth-900 dark:to-earth-900/50 border border-farm-100 dark:border-earth-800 flex items-center gap-3">
            <div className="bg-farm-600/10 text-farm-700 dark:text-farm-400 p-2 rounded-xl">
              <UserCircle className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-gray-800 dark:text-gray-200 leading-tight truncate max-w-[140px]">
                {user.name}
              </span>
              <span className="text-[11px] font-semibold text-farm-600 dark:text-farm-400 uppercase tracking-wider mt-0.5">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Sidebar Nav Items */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
