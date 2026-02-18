import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, Users as UsersIcon, ShoppingCart, Bell, Settings, LogOut, Menu, X, Handshake, ChevronRight, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationsApi } from '../api';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Consórcios', href: '/consortiums', icon: Handshake },
    { name: 'Vendas', href: '/sales', icon: ShoppingCart },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Alertas', href: '/alerts', icon: Bell },
];

const adminNavigation = [
    { name: 'Utilizadores', href: '/users', icon: UsersIcon },
    { name: 'Configurações', href: '/settings', icon: Settings },
];

export default function Layout() {
    const { user, isAdmin, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnread = () => {
        notificationsApi.getUnreadCount().then(r => setUnreadCount(r.data.count)).catch(() => { });
    };

    useEffect(() => {
        loadUnread();
        const interval = setInterval(loadUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => { if (confirm('Sair do sistema?')) { logout(); window.location.href = '/login'; } };

    const allNav = [...navigation, ...(isAdmin ? adminNavigation : [])];

    return (
        <div className="flex h-screen overflow-hidden bg-brand-bg text-slate-900">
            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-all duration-300" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl ring-1 ring-black/5' : '-translate-x-full'}`}>
                <div className="flex h-full flex-col bg-white/80 backdrop-blur-2xl border-r border-slate-200 shadow-xl overflow-hidden">
                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Logo Area */}
                    <div className="relative flex h-20 items-center gap-4 px-8 border-b border-slate-100 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-primary-600/20 rotate-3">SV</div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-slate-900 tracking-tighter">SV</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em]">Gestão de Vendas</span>
                        </div>
                        <button className="lg:hidden ml-auto p-2 rounded-xl text-slate-400 hover:text-slate-900 bg-slate-100" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4 ml-4">Navegação Principal</p>
                        {allNav.map(item => {
                            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                            return (
                                <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)}
                                    className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 group ${isActive
                                        ? 'bg-primary-50 text-primary-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>

                                    {isActive && <div className="absolute left-0 w-1 h-5 bg-primary-500 rounded-r-full" />}

                                    <item.icon size={20} className={isActive ? 'text-primary-400' : 'text-slate-600 group-hover:text-slate-400 group-hover:scale-110 transition-all'} />
                                    {item.name}

                                    {item.name === 'Alertas' && unreadCount > 0 && (
                                        <span className="ml-auto bg-primary-600 text-white text-[10px] rounded-lg px-2 py-0.5 font-black shadow-lg shadow-primary-600/30 animate-pulse">{unreadCount}</span>
                                    )}
                                    {isActive && <ChevronRight size={14} className="ml-auto text-primary-500 opacity-50" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom User Profile */}
                    <div className="p-6 mt-auto border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4 group">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 p-0.5 shadow-sm transition-transform group-hover:scale-105">
                                <div className="h-full w-full rounded-2xl bg-white flex items-center justify-center text-slate-900 font-black text-sm border border-slate-200">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{user?.role === 'admin' ? 'Administrador' : 'Gestor'}</p>
                            </div>
                            <button onClick={handleLogout} className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm" title="Sair do Sistema">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Global Background Glow */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Navbar Header */}
                <header className="h-20 flex items-center justify-between gap-4 px-6 lg:px-10 border-b border-slate-200 bg-white/50 backdrop-blur-3xl z-30">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2.5 rounded-xl text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-200" onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                {allNav.find(n => n.href === location.pathname || (n.href !== '/' && location.pathname.startsWith(n.href)))?.name || 'Início'}
                            </h1>
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 px-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-2 group cursor-help transition-all hover:border-accent-300 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-accent-500 shadow-lg shadow-accent-500/50" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Sistema Online</span>
                        </div>
                    </div>
                </header>

                {/* Page Runner */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
