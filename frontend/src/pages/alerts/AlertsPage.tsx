import { useState, useEffect } from 'react';
import { notificationsApi } from '../../api';
import { Bell, CheckCheck, Check, Info, AlertCircle, Clock, Trash2 } from 'lucide-react';

export default function AlertsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => { setLoading(true); notificationsApi.getAll().then(r => setNotifications(r.data)).catch(console.error).finally(() => setLoading(false)); };
    useEffect(() => { load(); }, []);

    const markRead = async (id: number) => { await notificationsApi.markAsRead(id); load(); };
    const markAllRead = async () => { await notificationsApi.markAllAsRead(); load(); };

    const getIcon = (content: string) => {
        if (content.toLowerCase().includes('atraso')) return <AlertCircle className="text-red-400" size={20} />;
        if (content.toLowerCase().includes('vencendo')) return <Clock className="text-amber-400" size={20} />;
        return <Info className="text-primary-400" size={20} />;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Alertas</h2>
                    <p className="text-slate-600 text-sm mt-1 font-medium">Acompanhe as notificações do sistema e cobranças automáticas.</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button onClick={markAllRead} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-500 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95"><CheckCheck size={16} /> Marcar tudo como lido</button>
                )}
            </div>

            {loading ? <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
                : notifications.length === 0 ? (
                    <div className="glass-card p-20 text-center bg-white border-dashed border-2 border-slate-200 shadow-sm">
                        <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
                            <Bell size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Tudo em ordem por aqui</h3>
                        <p className="text-slate-600 max-w-xs mx-auto font-medium">Você não tem novas notificações no momento. O sistema avisará quando algo precisar da sua attention.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((n, idx) => (
                            <div key={n.id} className={`glass-card p-5 flex items-start gap-5 transition-all group border bg-white shadow-sm hover:shadow-md animate-in slide-in-from-right-4 duration-500 ${!n.isRead ? 'border-primary-100 ring-2 ring-primary-50/50' : 'border-slate-100'}`} style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className={`p-4 rounded-2xl transition-all ${!n.isRead ? 'bg-primary-50 border border-primary-100 shadow-sm group-hover:scale-110' : 'bg-slate-50 border border-slate-100 opacity-60'}`}>
                                    {getIcon(n.content)}
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${!n.isRead ? 'text-primary-600' : 'text-slate-500'}`}>
                                            {n.type || 'Notificação'}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <p className={`text-sm leading-relaxed tracking-tight ${!n.isRead ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'}`}>{n.content}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {!n.isRead ? (
                                        <button onClick={() => markRead(n.id)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100" title="Marcar como lido">
                                            <Check size={20} />
                                        </button>
                                    ) : (
                                        <div className="p-2.5 text-emerald-600/30">
                                            <CheckCheck size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );
}
