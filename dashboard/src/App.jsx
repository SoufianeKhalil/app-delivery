import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminMerchants from "./pages/AdminMerchants";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import MerchantProfile from "./pages/MerchantProfile";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersHistoryPage from "./pages/OrdersHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ClientProfile from "./pages/ClientProfile";
import ClientNavbar from "./components/ClientNavbar";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function AccesRefuse() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      height: "100vh",
      justifyContent: "center"
    }}>
      <h2>Accès refusé</h2>
      <p>Vous n'avez pas accès à cette page.</p>
      <Link to="/login">Retour à la connexion</Link>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ textAlign: "center", marginTop: 50 }}>Chargement...</div>;

  // Only show ClientNavbar for client role
  const shouldShowClientNavbar = user?.role === 'client';
  
  // Show Layout for admin, merchant, and delivery person
  const shouldShowLayout = user && ['admin', 'commercant', 'livreur'].includes(user.role);

  return (
    <>
      {/* ClientNavbar only for clients */}
      {shouldShowClientNavbar && <ClientNavbar />}
      
      {/* Layout wrapper for admin/merchant/livreur */}
      {shouldShowLayout ? (
        <Layout>
          <Routes>
            {/* Merchant/Livreur/Admin Routes with Layout */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/merchant/orders" element={<ProtectedRoute allowedRoles={["commercant", "admin", "livreur"]}><Orders /></ProtectedRoute>} />
            <Route path="/merchant/products" element={<ProtectedRoute allowedRoles={["commercant", "admin"]}><Products /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={["commercant", "admin", "livreur"]}><MerchantProfile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/merchants" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMerchants /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProducts /></ProtectedRoute>} />
            
            <Route path="/acces-refuse" element={<AccesRefuse />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          {/* Client Routes (no Layout/sidebar) */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/products" replace />} />
          
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersHistoryPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          
          <Route path="/acces-refuse" element={<AccesRefuse />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      )}
      
      <Toaster position="top-right" />
    </>
  );
}
