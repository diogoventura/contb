import { useState, useEffect } from 'react';
import { reportsApi } from '../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Wallet, Package, Handshake, Calendar, Download } from 'lucide-react';

export default function ReportsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            reportsApi.getSummary(),
            reportsApi.getSalesByMonth()
        ]).then(([summ, sales]) => {
            setSummary(summ.data);
            setSalesData(sales.data);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" /></div>;

    const cards = [
        { title: 'Receita Total', value: `R$ ${summary?.totalRevenue?.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'A Receber', value: `R$ ${summary?.pendingAmount?.toLocaleString('pt-BR')}`, icon: Wallet, color: 'text-primary-600', bg: 'bg-primary-50' },
        { title: 'Vendas Ativas', value: summary?.totalSales, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: 'Consórcios', value: summary?.activeConsortiums, icon: Handshake, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Relatórios Financeiros</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Análise detalhada de desempenho e saúde financeira.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95">
                    <Download size={18} /> Exportar PDF
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="glass-card p-6 flex items-center gap-5 group hover:shadow-lg transition-all border border-white bg-white shadow-sm">
                        <div className={`h-14 w-14 rounded-2xl ${card.bg} flex items-center justify-center ${card.color} shadow-sm group-hover:scale-110 transition-transform border border-slate-100`}>
                            <card.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
                            <p className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="glass-card p-8 space-y-6 bg-white border border-white shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                            <TrendingUp size={20} className="text-emerald-600" /> Fluxo de Vendas (6 Meses)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: '900' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Second Chart - Distribution or something else */}
                <div className="glass-card p-8 space-y-6 bg-white border border-white shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                            <Calendar size={20} className="text-primary-600" /> Comparativo Mensal
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="total" fill="#5B2424" radius={[8, 8, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 overflow-hidden relative bg-white border border-white shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
                <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Sugestões de Ação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 group hover:bg-white hover:shadow-sm transition-all">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Otimização</p>
                        <p className="text-sm text-slate-600 font-medium">Sua receita cresceu 12% este mês. Considere reabastecer produtos com estoque baixo.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 group hover:bg-white hover:shadow-sm transition-all">
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Cobrança</p>
                        <p className="text-sm text-slate-600 font-medium">Existem R$ {summary?.pendingAmount?.toLocaleString('pt-BR')} pendentes. Ative os avisos em massa para agilizar o recebimento.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 group hover:bg-white hover:shadow-sm transition-all">
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Integridade</p>
                        <p className="text-sm text-slate-600 font-medium">Todos os boletos gerados nas últimas 24h foram processados com sucesso pelo módulo Itaú.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
