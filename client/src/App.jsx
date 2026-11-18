import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/Unauthorized';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ProductManagement from './pages/admin/ProductManagement';
import WarehouseManagement from './pages/admin/WarehouseManagement';

// Warehouse Manager pages
import ManagerDashboard from './pages/warehouseManager/ManagerDashboard';
import InventoryView from './pages/warehouseManager/InventoryView';
import StockInOut from './pages/warehouseManager/StockInOut';
import TransactionHistory from './pages/warehouseManager/TransactionHistory';

// Supplier pages
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplyRequests from './pages/supplier/SupplyRequests';

// Sales Representative pages
import SalesDashboard from './pages/salesRep/SalesDashboard';
import ProductCatalog from './pages/salesRep/ProductCatalog';
import CreateOrder from './pages/salesRep/CreateOrder';
import MyOrders from './pages/salesRep/MyOrders';

// Root redirector based on authentication and role
const RootRedirect = () => {
  const { isAuthenticated, loading, getRoleDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleDashboardPath()} replace />;
  }

  return <Home />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/warehouses" element={<WarehouseManagement />} />
            <Route path="/admin/orders" element={<MyOrders />} />
            <Route path="/admin/supply-requests" element={<SupplyRequests />} />
            <Route path="/admin/transactions" element={<TransactionHistory />} />
          </Route>

          {/* Warehouse Manager routes */}
          <Route element={<ProtectedRoute allowedRoles={['warehouseManager', 'admin']} />}>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/inventory" element={<InventoryView />} />
            <Route path="/manager/stock" element={<StockInOut />} />
            <Route path="/manager/products" element={<ProductManagement />} />
            <Route path="/manager/orders" element={<MyOrders />} />
            <Route path="/manager/supply-requests" element={<SupplyRequests />} />
            <Route path="/manager/transactions" element={<TransactionHistory />} />
          </Route>

          {/* Supplier routes */}
          <Route element={<ProtectedRoute allowedRoles={['supplier', 'admin']} />}>
            <Route path="/supplier" element={<SupplierDashboard />} />
            <Route path="/supplier/requests" element={<SupplyRequests />} />
          </Route>

          {/* Sales Representative routes */}
          <Route element={<ProtectedRoute allowedRoles={['salesRepresentative', 'admin']} />}>
            <Route path="/sales" element={<SalesDashboard />} />
            <Route path="/sales/catalog" element={<ProductCatalog />} />
            <Route path="/sales/new-order" element={<CreateOrder />} />
            <Route path="/sales/orders" element={<MyOrders />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
