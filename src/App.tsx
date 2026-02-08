import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './state/AppState';
import AppShell from './components/AppShell';
import AccessDenied from './components/AccessDenied';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrdersList from './pages/OrdersList';
import OrderDraft from './pages/OrderDraft';
import OrderDetails from './pages/OrderDetails';
import CustomersList from './pages/CustomersList';
import CustomerForm from './pages/CustomerForm';
import CustomerProfile from './pages/CustomerProfile';
import ProductsList from './pages/ProductsList';
import ProductForm from './pages/ProductForm';
import UsersList from './pages/UsersList';
import ReportsHome from './pages/ReportsHome';
import ReportDetail from './pages/ReportDetail';
import Settings from './pages/Settings';
import ComponentLibrary from './pages/ComponentLibrary';
import InvoicePrint from './pages/print/InvoicePrint';
import OrderPrint from './pages/print/OrderPrint';
import CustomerReportPrint from './pages/print/CustomerReportPrint';

const App = () => {
  const { currentUser, getRoleAccess } = useApp();

  const guard = (page: string, element: JSX.Element) => {
    if (!currentUser) return <Navigate to="/admin/login" replace />;
    return getRoleAccess(currentUser.role, page) ? element : <AccessDenied />;
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/print/invoice/:orderId" element={<InvoicePrint />} />
      <Route path="/admin/print/order/:orderId" element={<OrderPrint />} />
      <Route path="/admin/print/customer/:customerId" element={<CustomerReportPrint />} />

      <Route path="/admin" element={currentUser ? <AppShell /> : <Navigate to="/admin/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/new" element={<OrderDraft />} />
        <Route path="orders/:orderId" element={<OrderDetails />} />
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:customerId" element={<CustomerProfile />} />
        <Route path="customers/:customerId/edit" element={<CustomerForm />} />
        <Route path="products" element={guard('products', <ProductsList />)} />
        <Route path="products/new" element={guard('products', <ProductForm />)} />
        <Route path="products/:productId/edit" element={guard('products', <ProductForm />)} />
        <Route path="users" element={guard('users', <UsersList />)} />
        <Route path="reports" element={guard('reports', <ReportsHome />)} />
        <Route path="reports/:reportId" element={guard('reports', <ReportDetail />)} />
        <Route path="settings" element={guard('settings', <Settings />)} />
        <Route path="components" element={guard('settings', <ComponentLibrary />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
