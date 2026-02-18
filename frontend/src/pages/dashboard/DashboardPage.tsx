import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api';
import { DollarSign, Package, AlertTriangle, TrendingUp, Clock, Handshake, ShoppingCart, ArrowRight, Wallet, Target, Calendar } from 'lucide-react';

export default function DashboardPage() {
    const { isAdmin } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardApi.getSummary().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>;
    if (!data) return <div className="text-center text-slate-400 py-12">Erro ao carregar dados</div>;

    const cards = [
        { label: 'Receita Mensal', value: `R$ ${Number(data.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Total em Vendas', value: data.totalSales, icon: ShoppingCart, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-100' },
        { label: 'Consórcios Ativos', value: data.activeConsortiums, icon: Handshake, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Parcelas Pendentes', value: data.pendingInstallments, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Parcelas em Atraso', value: data.overdueInstallments, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        { label: 'Produtos em Estoque', value: data.totalProducts, icon: Package, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header / Welcome Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Painel de Controle</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Bem-vindo de volta! Aqui está o resumo financeiro de hoje.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="px-4 py-2 bg-primary-600 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-600/20">Atalhos</div>
                    <Link to="/reports" className="px-3 py-2 text-slate-500 hover:text-primary-600 text-xs font-black uppercase tracking-wider transition-colors">Relatórios</Link>
                    {isAdmin && <Link to="/settings" className="px-3 py-2 text-slate-500 hover:text-primary-600 text-xs font-black uppercase tracking-wider transition-colors">Configurações</Link>}
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <div key={card.label} className="bg-white group hover:shadow-2xl hover:shadow-slate-200/50 border border-slate-100 p-8 rounded-[2.5rem] flex items-start justify-between animate-in slide-in-from-bottom-4 duration-500 shadow-sm transition-all" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
                            <p className="text-3xl font-black text-slate-900 transition-transform group-hover:scale-105 origin-left duration-300">{card.value}</p>
                        </div>
                        <div className={`${card.bg} ${card.border} p-4 rounded-2xl border transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-sm`}>
                            <card.icon className={`h-6 w-6 ${card.color}`} strokeWidth={2.5} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Sales with Table Finish */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col shadow-sm">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <h2 className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-[0.2em]"><TrendingUp size={16} className="text-primary-600" /> Fluxo de Vendas recentes</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">Últimas 5</span>
                    </div>
                    <div className="p-4 space-y-1">
                        {data.recentSales?.length > 0 ? data.recentSales.map((sale: any) => (
                            <div key={sale.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300"><ShoppingCart size={20} /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{sale.personName}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(sale.soldAt).toLocaleDateString('pt-BR')} · {sale.installmentCount} parcelas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-black text-emerald-600">R$ {Number(sale.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <span className="text-[9px] text-emerald-600/60 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">Concluída</span>
                                </div>
                            </div>
                        )) : <div className="text-center py-16 text-slate-300 flex flex-col items-center gap-3"><ShoppingCart size={40} className="opacity-20" /><p className="text-sm font-black uppercase tracking-widest opacity-40">Nenhuma venda registrada</p></div>}
                    </div>
                </div>

                {/* Upcoming Installments with Timeline Feel */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col shadow-sm">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <h2 className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-[0.2em]"><Clock size={16} className="text-amber-500" /> Vencimentos Próximos</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">Próximos 30 dias</span>
                    </div>
                    <div className="p-4 space-y-1">
                        {data.upcomingInstallments?.length > 0 ? data.upcomingInstallments.map((inst: any) => (
                            <div key={inst.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-300"><Calendar size={20} /></div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{inst.sale?.personName}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Parcela {inst.number} · Vence em {new Date(inst.dueDate).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-base font-black text-amber-600">R$ {Number(inst.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        <span className="text-[9px] text-amber-600/60 font-black uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/50">Pendente</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:translate-x-1 group-hover:text-amber-500 group-hover:bg-white group-hover:shadow-md transition-all border border-transparent group-hover:border-slate-100"><ArrowRight size={18} /></div>
                                </div>
                            </div>
                        )) : <div className="text-center py-16 text-slate-300 flex flex-col items-center gap-3"><Clock size={40} className="opacity-20" /><p className="text-sm font-black uppercase tracking-widest opacity-40">Nenhuma parcela pendente</p></div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
