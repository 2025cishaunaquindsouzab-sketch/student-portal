import { BarChart3, GraduationCap, LayoutDashboard, LogOut, Plus, ShieldCheck, UserCircle2 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/students', icon: GraduationCap },
  { label: 'My Profile', to: '/profile', icon: UserCircle2 },
];

const adminNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/students', icon: GraduationCap },
  { label: 'Add Student', to: '/admin', icon: Plus },
  { label: 'Administration', to: '/admin', icon: ShieldCheck },
  { label: 'My Profile', to: '/profile', icon: UserCircle2 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'admin' ? adminNav : studentNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">S</div>
        <div>
          <p className="brand-name">Shaun@college_Database</p>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div className="user-meta">
            <strong>{user?.name || 'User'}</strong>
            <span className="role-badge">{user?.role || 'student'}</span>
          </div>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
