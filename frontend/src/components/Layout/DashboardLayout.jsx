import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-main">
        <Header location={location} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
