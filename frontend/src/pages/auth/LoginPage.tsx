import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Leaf, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login ou senha incorretos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-2xl shadow-primary-600/10 mb-4 ring-1 ring-white group hover:rotate-6 transition-transform">
                        <Leaf className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">SV</h1>
                    <p className="text-slate-600 text-sm font-medium tracking-tight uppercase tracking-[0.1em]">Gestão de Vendas</p>
                </div>

                <div className="glass-card p-8 border border-white shadow-xl relative">
                    {/* Subtle inner border */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Login</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all text-sm"
                                    placeholder="exemplo@svvendas.com" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Senha</label>
                                <button type="button" className="text-[10px] font-black text-primary-600 uppercase tracking-wider hover:text-primary-500 transition-colors">Esqueceu?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                                    className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all text-sm"
                                    placeholder="••••••••" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-black text-center animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full h-12 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/10">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <>
                                    Entrar no Sistema
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="pt-2">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acesso Demonstrativo</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Login</p>
                                        <p className="text-[11px] font-black text-slate-900">admin@gmail.com</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Senha</p>
                                        <p className="text-[11px] font-black text-slate-900">Admin@123</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="text-center pt-4">
                    <p className="text-slate-600 text-xs font-medium">ContB © 2026 · Todos os direitos reservados</p>
                </div>
            </div>
        </div>
    );
}
