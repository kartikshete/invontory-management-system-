import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineLogout } from 'react-icons/hi';
import useAuth from '../../hooks/useAuth';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-surface-800/80 backdrop-blur-md border-b border-surface-700/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2 rounded-lg" id="menu-toggle">
          <HiOutlineMenuAlt2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications placeholder */}
        <button className="btn-ghost p-2 rounded-lg relative" id="notifications-btn">
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-surface-700">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-red-400" id="logout-btn" title="Logout">
            <HiOutlineLogout className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
