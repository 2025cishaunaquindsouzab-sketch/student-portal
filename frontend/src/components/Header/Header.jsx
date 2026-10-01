import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getTitle(pathname) {
  const map = {
    '/dashboard': 'Dashboard',
    '/students': 'Students',
    '/profile': 'Profile',
    '/admin': 'Administration',
  };

  return map[pathname] || 'Overview';
}

export default function Header({ location }) {
  const { user } = useAuth();
  const pathname = location?.pathname || '/dashboard';

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Overview</p>
        <h1>{getTitle(pathname)}</h1>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={15} />
          <input type="text" placeholder="Search students, activity, profiles..." aria-label="Search" />
        </div>

        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="topbar-user">
          <div className="avatar small">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <strong>{user?.name || 'User'}</strong>
            <span className="role-badge small-badge">{user?.role || 'student'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
