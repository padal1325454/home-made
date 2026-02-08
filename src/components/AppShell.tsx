import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from './ToastContainer';

const AppShell = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default AppShell;
