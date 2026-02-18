import { useState, useEffect } from 'react';
import { usersApi } from '../../api';
import { Plus, Edit2, Trash2, X, User, Shield, Mail, Phone, Calendar, Key, Eye, EyeOff } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'regular', phone: '' });
    const [showPassword, setShowPassword] = useState(false);

    const load = () => {
        setLoading(true);
        usersApi.getAll()
            .then(r => {
                // Handle both simple array and paginated object
                const data = r.data.users || r.data;
                setUsers(Array.isArray(data) ? data : []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'regular', phone: '' }); setShowModal(true); };
    const openEdit = (u: any) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' }); setShowModal(true); };

    const handleSave = async () => {
        if (editing) await usersApi.update(editing.id, form);
        else await usersApi.create(form);
        setShowModal(false);
        load();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Deseja realmente excluir este usuário?')) return;
        await usersApi.delete(String(id));
        load();
    };

    const roleBadge = (role: string) => role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-primary-500/10 text-primary-400 border border-primary-500/20';
    const translateRole = (role: string) => role === 'admin' ? 'Administrador' : 'Padrão';

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Usuários</h2>
                    <p className="text-slate-600 text-sm mt-1 font-medium">Gerencie o acesso e permissões dos membros da sua equipe.</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-3 px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20 active:scale-95">
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(u => (
                        <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50/30 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500" />

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-inner">
                                        <User size={28} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-900 text-lg tracking-tight group-hover:text-primary-600 transition-colors">{u.name}</p>
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm ${roleBadge(u.role)}`}>{translateRole(u.role)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(u)} className="p-2.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100 active:scale-90" title="Editar"><Edit2 size={18} /></button>
                                    {u.role !== 'admin' && (
                                        <button onClick={() => handleDelete(u.id)} className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-90" title="Excluir"><Trash2 size={18} /></button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 space-y-3 border-t border-slate-50 pt-5 relative z-10">
                                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/50"><Mail size={16} /></div>
                                    <span className="truncate">{u.email}</span>
                                </div>
                                {u.phone && (
                                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/50"><Phone size={16} /></div>
                                        <span>{u.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-widest pt-1 pl-1">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span>Desde {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
                    <div className="bg-white w-full max-w-lg p-8 rounded-[2.5rem] space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Defina as credenciais e nível de acesso</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2.5 text-slate-500 hover:text-slate-600 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:rotate-90"><X size={24} /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo *</label>
                                <div className="relative group">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Diogo Almeida" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100/50 focus:bg-white focus:border-primary-200 transition-all text-sm shadow-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail de Acesso *</label>
                                    <div className="relative group">
                                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                                        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100/50 focus:bg-white focus:border-primary-200 transition-all text-sm shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
                                    <div className="relative group">
                                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-100/50 focus:bg-white focus:border-emerald-200 transition-all text-sm shadow-sm" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{editing ? 'Nova Senha (opcional)' : 'Senha de Acesso *'}</label>
                                <div className="relative group">
                                    <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-amber-100/50 focus:bg-white focus:border-amber-200 transition-all text-sm shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível de Acesso (Função)</label>
                                <div className="relative group">
                                    <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors z-10" />
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-purple-100/50 focus:bg-white focus:border-purple-200 transition-all text-sm shadow-sm appearance-none relative">
                                        <option value="regular">Membro Padrão (Vendedor)</option>
                                        <option value="admin">Administrador (Acesso Total)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <Calendar size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-sm font-black text-slate-500 uppercase tracking-widest hover:text-slate-600 transition-colors bg-slate-50 rounded-2xl border border-slate-100 mb-0">Cancelar</button>
                            <button onClick={handleSave} className="flex-[2] py-4 text-sm bg-primary-600 text-white rounded-2xl hover:bg-primary-500 font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-600/20 hover:shadow-2xl active:scale-95">Salvar Usuário</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
