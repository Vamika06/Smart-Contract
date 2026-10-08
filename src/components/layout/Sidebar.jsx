import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard, Shield, History, User, Settings,
  ShieldCheck, LogOut, X, ChevronRight, BookOpen, FileCode, ListChecks, GraduationCap, Home
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scanner', icon: Shield, label: 'Scan Contract' },
  { to: '/history', icon: History, label: 'Scan History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const toolItems = [
  { to: '/learn', icon: BookOpen, label: 'Learn Hub' },
  { to: '/templates', icon: FileCode, label: 'Templates' },
  { to: '/checklist', icon: ListChecks, label: 'Deploy Checklist' },
  { to: '/academy', icon: GraduationCap, label: 'Security Academy' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`
      fixed top-0 left-0 h-full w-64 z-50 flex flex-col
      bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
    `}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-700">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-surface-900 dark:text-surface-100">SmartAudit</span>
        </NavLink>
        <button onClick={onClose} className="lg:hidden btn-ghost p-1.5 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <nav className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Toolkit</p>
          </div>
          {toolItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          <NavLink to="/" end onClick={onClose} className="sidebar-link mt-2">
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>Home page</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Admin</p>
              </div>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Admin Panel</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div className="p-3 border-t border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer" onClick={() => { navigate('/profile'); onClose(); }}>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{user?.name}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-400" />
        </div>

        <button onClick={handleLogout} className="w-full mt-1 sidebar-link text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
