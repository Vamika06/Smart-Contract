import { Menu, Sun, Moon, Bell, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/scanner': 'Scan Contract',
  '/history': 'Scan History',
  '/learn': 'Learn Hub',
  '/templates': 'Template Library',
  '/checklist': 'Deploy Checklist',
  '/academy': 'Security Academy',
  '/profile': 'Profile',
  '/admin': 'Admin Panel',
};

export default function Navbar({ onMenuClick }) {
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const title = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] || 'SmartAudit';

  return (
    <header className="h-16 flex items-center gap-4 px-4 md:px-6 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden btn-ghost p-2 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/scanner')}
          className="btn-primary text-xs hidden sm:flex"
        >
          <Plus className="w-3.5 h-3.5" />
          New Scan
        </button>

        <button
          onClick={toggleTheme}
          className="btn-ghost p-2 rounded-lg"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
