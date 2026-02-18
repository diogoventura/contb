import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import ConsortiumsPage from './pages/consortiums/ConsortiumsPage';
import SalesPage from './pages/sales/SalesPage';
import UsersPage from './pages/users/UsersPage';
import AlertsPage from './pages/alerts/AlertsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div className="flex items-center justify-center h-screen bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const { isAdmin } = useAuth();
    return isAdmin ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="consortiums" element={<ConsortiumsPage />} />
                        <Route path="sales" element={<SalesPage />} />
                        <Route path="alerts" element={<AlertsPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
                        <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
