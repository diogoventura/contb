import { useState, useEffect } from 'react';
import { consortiumsApi } from '../../api';
import { Plus, Edit2, Trash2, X, Users, Handshake, ChevronDown, ChevronUp, Phone, Mail, FileText, AlertCircle, Eye, CheckCircle2, Clock, Info, Calendar, DollarSign, History, Bell, TrendingUp, Package, ShoppingBag, CreditCard, User, Hash } from 'lucide-react';

export default function ConsortiumsPage() {
    const [consortiums, setConsortiums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedConsortium, setSelectedConsortium] = useState<any>(null);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: '', description: '', totalValue: '', monthlyValue: '', totalSlots: '', startDate: '', endDate: '', reminderDaysBefore: '', reminderIntervalAfter: '' });
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [showParticipantModal, setShowParticipantModal] = useState(false);
    const [participantForm, setParticipantForm] = useState({ name: '', phone: '', email: '', document: '' });
    const [activeConsortiumId, setActiveConsortiumId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
    const [participantDetails, setParticipantDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [activeTab, setActiveTab] = useState<'timeline' | 'purchases' | 'installments'>('timeline');

    const load = () => {
        setLoading(true);
        consortiumsApi.getAll(1, 100).then(r => setConsortiums(r.data.consortiums)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', description: '', totalValue: '', monthlyValue: '', totalSlots: '', startDate: '', endDate: '', reminderDaysBefore: '', reminderIntervalAfter: '' }); setError(null); setShowModal(true); };
    const openEdit = (c: any) => {
        setEditing(c);
        setForm({
            name: c.name,
            description: c.description || '',
            totalValue: String(c.totalValue),
            monthlyValue: String(c.monthlyValue),
            totalSlots: String(c.totalSlots),
            startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
            endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
            reminderDaysBefore: c.reminderDaysBefore !== null ? String(c.reminderDaysBefore) : '',
            reminderIntervalAfter: c.reminderIntervalAfter !== null ? String(c.reminderIntervalAfter) : ''
        });
        setError(null);
        setShowModal(true);
    };
    const openDetails = (c: any) => { setSelectedConsortium(c); setShowDetailModal(true); };

    const handleSave = async () => {
        try {
            setError(null);
            const data = {
                ...form,
                totalValue: parseFloat(form.totalValue),
                monthlyValue: parseFloat(form.monthlyValue),
                totalSlots: parseInt(form.totalSlots),
                reminderDaysBefore: form.reminderDaysBefore === '' ? null : parseInt(form.reminderDaysBefore),
                reminderIntervalAfter: form.reminderIntervalAfter === '' ? null : parseInt(form.reminderIntervalAfter),
            };
            if (editing) await consortiumsApi.update(editing.id, data);
            else await consortiumsApi.create(data);
            setShowModal(false); load();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao realizar esta operação');
        }
    };

    const handleDelete = async (id: number) => { if (!confirm('Remover consórcio?')) return; await consortiumsApi.delete(String(id)); load(); };

    const toggleExpand = async (id: number) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        const r = await consortiumsApi.getParticipants(String(id));
        setParticipants(r.data);
    };

    const openAddParticipant = (consortium: any) => {
        if (consortium._count.participants >= consortium.totalSlots) {
            alert('Este consórcio já atingiu o limite de participantes!');
            return;
        }
        setActiveConsortiumId(consortium.id);
        setParticipantForm({ name: '', phone: '', email: '', document: '' });
        setError(null);
        setShowParticipantModal(true);
    };

    const handleAddParticipant = async () => {
        if (!activeConsortiumId) return;
        try {
            setError(null);
            await consortiumsApi.addParticipant(String(activeConsortiumId), participantForm);
            setShowParticipantModal(false);
            const r = await consortiumsApi.getParticipants(String(activeConsortiumId));
            setParticipants(r.data);
            load();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao adicionar participante');
        }
    };

    const handleStatusParticipant = async (p: any, newStatus: string) => {
        await consortiumsApi.updateParticipant(String(p.id), { status: newStatus });
        const r = await consortiumsApi.getParticipants(String(expandedId || activeConsortiumId));
        setParticipants(r.data);
    };

    const handleRemoveParticipant = async (id: number) => {
        if (!confirm('Remover participante?')) return;
        await consortiumsApi.removeParticipant(String(id));
        if (expandedId) {
            const r = await consortiumsApi.getParticipants(String(expandedId));
            setParticipants(r.data);
            load();
        }
    };

    const openParticipantDetails = async (participant: any) => {
        setSelectedParticipant(participant);
        setShowDetailsModal(true);
        setLoadingDetails(true);
        setActiveTab('timeline');
        setParticipantDetails(null);
        try {
            const r = await consortiumsApi.getParticipantDetails(String(participant.id));
            setParticipantDetails(r.data);
        } catch (e) { console.error(e); }
        finally { setLoadingDetails(false); }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        if (!confirm(`Deseja alterar o status para ${translateStatus(newStatus)}?`)) return;
        try {
            await consortiumsApi.update(String(id), { status: newStatus });
            load();
            setShowDetailModal(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao atualizar status');
        }
    };

    const translateStatus = (s: string) => {
        switch (s) {
            case 'active': return 'Ativo';
            case 'finished': return 'Concluído';
            case 'cancelled': return 'Cancelado';
            case 'pending': return 'Pendente';
            case 'paid': return 'Pago';
            default: return s;
        }
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'active':
            case 'paid':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'finished':
                return 'bg-primary-500/10 text-primary-400 border-primary-500/20';
            case 'cancelled':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    const instStatusColor = (s: string) => {
        if (s === 'paid') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
        if (s === 'overdue') return 'bg-red-50 text-red-600 border border-red-100';
        return 'bg-amber-50 text-amber-600 border border-amber-100';
    };

    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    // Build timeline events from sales
    const buildTimeline = (sales: any[]) => {
        const events: { date: Date; label: string; sub: string; color: string; icon: any }[] = [];
        for (const sale of sales) {
            events.push({ date: new Date(sale.soldAt), label: `Venda #${sale.id}`, sub: `R$ ${fmt(Number(sale.totalAmount))}`, color: 'bg-primary-600', icon: ShoppingBag });
            for (const inst of sale.installments) {
                if (inst.status === 'paid' && inst.paidAt) {
                    events.push({ date: new Date(inst.paidAt), label: `Parcela ${inst.number}x paga`, sub: `R$ ${fmt(Number(inst.amount))} · Venda #${sale.id}`, color: 'bg-emerald-500', icon: CheckCircle2 });
                }
            }
        }
        return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Consórcios</h2>
                <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 transition-all"><Plus size={18} /> Novo Consórcio</button>
            </div>

            {loading ? <div className="flex justify-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>
                : consortiums.length === 0 ? <div className="glass-card p-20 text-center bg-white border-dashed border-2 border-slate-200 shadow-sm"><Handshake size={48} className="mx-auto text-slate-400 mb-4" /><p className="text-slate-500 text-lg font-medium">Nenhum consórcio registrado</p></div>
                    : (
                        <div className="grid gap-4">
                            {consortiums.map(c => {
                                const slotsLeft = c.totalSlots - (c._count?.participants || 0);
                                return (
                                    <div key={c.id} className={`glass-card overflow-hidden transition-all duration-300 border border-white shadow-sm ${expandedId === c.id ? 'ring-2 ring-primary-500/10' : 'hover:shadow-md'}`}>
                                        <div className="p-5 flex items-center justify-between cursor-pointer group" onClick={() => toggleExpand(c.id)}>
                                            <div className="flex items-center gap-5">
                                                <div className="bg-primary-50 p-3 rounded-2xl border border-primary-100 group-hover:bg-primary-100 transition-all"><Handshake size={24} className="text-primary-600" /></div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-lg font-black text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight">{c.name}</p>
                                                        <button onClick={(e) => { e.stopPropagation(); openDetails(c); }} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Visualizar Detalhes"><Eye size={16} /></button>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-500 flex items-center gap-3 uppercase tracking-[0.15em] mt-1">
                                                        <span className="text-emerald-600 font-black">R$ {Number(c.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        <span className="text-slate-200">·</span>
                                                        <span className={slotsLeft === 0 ? 'text-red-600 font-black' : 'text-slate-500'}>{slotsLeft} vagas restantes</span>
                                                        <span className="text-slate-200">·</span>
                                                        <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> {c._count?.participants || 0} inscritos</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${statusColor(c.status)}`}>{translateStatus(c.status)}</span>
                                                <div className="flex items-center border-l border-slate-100 pl-4 gap-1">
                                                    <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                                                    <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                                    <div className="ml-2 bg-slate-50 p-1.5 rounded-full ring-1 ring-slate-100">
                                                        {expandedId === c.id ? <ChevronUp size={16} className="text-primary-600" /> : <ChevronDown size={16} className="text-slate-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedId === c.id && (
                                            <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center justify-between mb-4 mt-2">
                                                    <h4 className="text-[10px] font-black text-slate-500 flex items-center gap-2 tracking-[0.2em] uppercase"><Users size={14} className="text-primary-500" /> Participantes do Grupo</h4>
                                                    {slotsLeft > 0 && c.status === 'active' && (
                                                        <button onClick={() => openAddParticipant(c)} className="text-[10px] px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-black uppercase tracking-widest shadow-md">+ Adicionar</button>
                                                    )}
                                                </div>
                                                {participants.length === 0 ? <p className="text-sm text-slate-500 text-center py-10 font-medium">Nenhum participante registrado neste grupo</p> : (
                                                    <div className="grid gap-2">
                                                        {participants.map(p => (
                                                            <div key={p.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-4 hover:border-primary-100 transition-all group/p shadow-sm hover:shadow-md">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="text-xs font-black text-primary-600 bg-primary-50 w-10 h-10 rounded-2xl flex items-center justify-center border border-primary-100">#{p.slotNumber}</div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p
                                                                                onClick={() => openParticipantDetails(p)}
                                                                                className="text-sm font-bold text-slate-900 cursor-pointer hover:text-primary-600 transition-colors underline-offset-2 hover:underline"
                                                                            >{p.name}</p>
                                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                                                                                {p.status === 'paid' ? 'Pago' : 'Pendente'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 mt-1">
                                                                            {p.phone && <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-tight"><Phone size={10} className="text-slate-400" /> {p.phone}</span>}
                                                                            {p.email && <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-tight"><Mail size={10} className="text-slate-400" /> {p.email}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 md:opacity-0 group-hover/p:opacity-100 transition-opacity">
                                                                    <button onClick={() => openParticipantDetails(p)} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Ver Detalhes">
                                                                        <History size={18} />
                                                                    </button>
                                                                    <button onClick={() => handleStatusParticipant(p, p.status === 'paid' ? 'active' : 'paid')} className={`p-2 rounded-xl transition-all ${p.status === 'paid' ? 'text-amber-500 hover:bg-amber-50 rounded-xl' : 'text-emerald-500 hover:bg-emerald-50 rounded-xl'}`} title={p.status === 'paid' ? 'Reverter para Pendente' : 'Marcar como Pago'}>
                                                                        {p.status === 'paid' ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                                                                    </button>
                                                                    <button onClick={() => handleRemoveParticipant(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

            {/* Consortium Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
                    <div className="glass-card w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-300 bg-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-900 tracking-tight">{editing ? 'Editar' : 'Novo'} Consórcio</h3><button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-slate-600 bg-slate-100 rounded-xl"><X size={24} /></button></div>
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 animate-pulse">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome do Consórcio *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Grupo Premium A" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Descrição</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm h-24 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Valor Total (R$) *</label>
                                    <input type="number" step="0.01" value={form.totalValue} onChange={e => setForm({ ...form, totalValue: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Valor Mensal (R$) *</label>
                                    <input type="number" step="0.01" value={form.monthlyValue} onChange={e => setForm({ ...form, monthlyValue: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Vagas Totais *</label>
                                <input type="number" value={form.totalSlots} onChange={e => setForm({ ...form, totalSlots: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                {editing && <p className="text-[10px] text-slate-600 ml-1 font-bold italic uppercase tracking-tighter mt-1">Mínimo: {editing._count.participants} inscritos hoje</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Calendar size={14} /> Data Início
                                    </label>
                                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Calendar size={14} /> Data Fim
                                    </label>
                                    <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Bell size={14} /> Configuração de Lembretes (Opcional - Sobrescreve Global)
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Lembrar Antes (Dias)</label>
                                        <input type="number" placeholder="Ex: 1" value={form.reminderDaysBefore} onChange={e => setForm({ ...form, reminderDaysBefore: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Aviso Atraso (Intervalo)</label>
                                        <input type="number" placeholder="Ex: 3" value={form.reminderIntervalAfter} onChange={e => setForm({ ...form, reminderIntervalAfter: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20">Salvar Consórcio</button>
                    </div>
                </div>
            )}

            {/* Consortium Detail Modal */}
            {showDetailModal && selectedConsortium && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setShowDetailModal(false)}>
                    <div className="glass-card w-full max-w-4xl p-8 space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto bg-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                                <div className="h-16 w-16 rounded-3xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 rotate-3 transition-transform hover:rotate-0"><Handshake size={32} /></div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedConsortium.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.25em]">Cód: #{selectedConsortium.id}</p>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusColor(selectedConsortium.status)}`}>{translateStatus(selectedConsortium.status)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedConsortium.status === 'active' && (
                                    <>
                                        <button onClick={() => handleUpdateStatus(selectedConsortium.id, 'finished')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600/30 transition-all"><CheckCircle2 size={16} /> Concluir</button>
                                        <button onClick={() => handleUpdateStatus(selectedConsortium.id, 'cancelled')} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600/30 transition-all"><X size={16} /> Cancelar</button>
                                    </>
                                )}
                                {selectedConsortium.status !== 'active' && (
                                    <button onClick={() => handleUpdateStatus(selectedConsortium.id, 'active')} className="flex items-center gap-2 px-4 py-2 bg-primary-600/20 text-primary-400 border border-primary-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600/30 transition-all">Reativar</button>
                                )}
                                <button onClick={() => setShowDetailModal(false)} className="p-2 text-slate-500 hover:text-slate-600 bg-slate-100 rounded-xl ml-2"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><DollarSign size={14} className="text-emerald-500" /> Valor do Grupo</p>
                                <p className="text-2xl font-black text-slate-900">R$ {Number(selectedConsortium.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Info size={14} className="text-primary-600" /> Parcela Mensal</p>
                                <p className="text-2xl font-black text-slate-900">R$ {Number(selectedConsortium.monthlyValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Users size={14} className="text-purple-600" /> Ocupação</p>
                                <p className="text-2xl font-black text-slate-900">{selectedConsortium._count?.participants || 0} / {selectedConsortium.totalSlots} <span className="text-xs font-bold text-slate-500 uppercase">Vagas</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2"><Calendar size={14} className="text-primary-500" /> Cronograma Previsto</h4>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Início das Atividades</p>
                                            <p className="text-sm font-bold text-slate-900">{selectedConsortium.startDate ? new Date(selectedConsortium.startDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Encerramento Previsto</p>
                                            <p className="text-sm font-bold text-slate-900">{selectedConsortium.endDate ? new Date(selectedConsortium.endDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
                                        </div>
                                        <div className="h-px bg-slate-100" />
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Duração do Ciclo</p>
                                            <p className="text-sm font-bold text-slate-900 tracking-tight">{(selectedConsortium.totalValue / selectedConsortium.monthlyValue).toFixed(0)} Meses</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2"><FileText size={14} className="text-amber-500" /> Notas Técnicas</h4>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 min-h-[160px]">
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedConsortium.description || 'Nenhuma observação técnica disponível para este grupo de consórcio.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Participant Modal */}
            {showParticipantModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-300" onClick={() => setShowParticipantModal(false)}>
                    <div className="glass-card w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300 bg-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-900 tracking-tight">Novo Participante</h3><button onClick={() => setShowParticipantModal(false)} className="p-2 text-slate-500 hover:text-slate-600 bg-slate-100 rounded-xl"><X size={24} /></button></div>
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 animate-pulse">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome Completo *</label>
                                <input value={participantForm.name} onChange={e => setParticipantForm({ ...participantForm, name: e.target.value })} placeholder="Ex: Diogo Almeida" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">WhatsApp</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input value={participantForm.phone} onChange={e => setParticipantForm({ ...participantForm, phone: e.target.value })} placeholder="(00) 00000-0000" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input value={participantForm.email} onChange={e => setParticipantForm({ ...participantForm, email: e.target.value })} placeholder="email@contb.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">CPF / CNPJ</label>
                                <div className="relative">
                                    <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input value={participantForm.document} onChange={e => setParticipantForm({ ...participantForm, document: e.target.value })} placeholder="000.000.000-00" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                            </div>
                        </div>
                        <button onClick={handleAddParticipant} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl active:scale-95">Efetivar Inscrição</button>
                    </div>
                </div>
            )}

            {/* ===== PARTICIPANT DETAILS MODAL ===== */}
            {showDetailsModal && selectedParticipant && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setShowDetailsModal(false)}>
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                                    <User size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedParticipant.name}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            <Hash size={10} /> Vaga {selectedParticipant.slotNumber}
                                        </span>
                                        {selectedParticipant.phone && <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold"><Phone size={10} /> {selectedParticipant.phone}</span>}
                                        {selectedParticipant.email && <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold"><Mail size={10} /> {selectedParticipant.email}</span>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
                                <X size={22} />
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="flex-1 flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
                            </div>
                        ) : participantDetails ? (
                            <>
                                {/* Financial Summary Cards */}
                                <div className="grid grid-cols-3 gap-4 px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
                                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center"><TrendingUp size={14} className="text-primary-600" /></div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Comprado</p>
                                        </div>
                                        <p className="text-xl font-black text-slate-900">R$ {fmt(participantDetails.summary.totalPurchased)}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 size={14} className="text-emerald-600" /></div>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Total Pago</p>
                                        </div>
                                        <p className="text-xl font-black text-emerald-700">R$ {fmt(participantDetails.summary.totalPaid)}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Clock size={14} className="text-amber-600" /></div>
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Pendente</p>
                                        </div>
                                        <p className="text-xl font-black text-amber-700">R$ {fmt(participantDetails.summary.totalPending)}</p>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-0 border-b border-slate-100 px-8 flex-shrink-0">
                                    {([
                                        { key: 'timeline', label: 'Linha do Tempo', icon: History },
                                        { key: 'purchases', label: 'Compras', icon: ShoppingBag },
                                        { key: 'installments', label: 'Parcelas', icon: CreditCard },
                                    ] as const).map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`flex items-center gap-2 px-5 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <tab.icon size={14} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto px-8 py-6">

                                    {/* Timeline Tab */}
                                    {activeTab === 'timeline' && (() => {
                                        const events = buildTimeline(participantDetails.sales);
                                        return events.length === 0 ? (
                                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <History size={40} className="mx-auto text-slate-200 mb-3" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum evento registrado</p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                                                <div className="space-y-4 pl-10">
                                                    {events.map((ev, i) => (
                                                        <div key={i} className="relative">
                                                            <div className={`absolute -left-[2.35rem] top-1 w-5 h-5 rounded-full ${ev.color} flex items-center justify-center shadow-sm`}>
                                                                <ev.icon size={10} className="text-white" />
                                                            </div>
                                                            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm hover:shadow-md transition-all">
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-sm font-bold text-slate-800">{ev.label}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase">{ev.date.toLocaleDateString('pt-BR')}</p>
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-medium mt-0.5">{ev.sub}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Purchases Tab */}
                                    {activeTab === 'purchases' && (
                                        participantDetails.sales.length === 0 ? (
                                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <ShoppingBag size={40} className="mx-auto text-slate-200 mb-3" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma compra encontrada</p>
                                                <p className="text-slate-300 text-xs mt-1">Vincule compras usando o mesmo telefone ou email do participante</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {participantDetails.sales.map((sale: any) => (
                                                    <div key={sale.id} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:border-primary-100 transition-all">
                                                        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                                                            <div>
                                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Venda #{sale.id} · {new Date(sale.soldAt).toLocaleDateString('pt-BR')}</p>
                                                                <p className="text-lg font-black text-slate-900 mt-0.5">R$ {fmt(Number(sale.totalAmount))}</p>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${sale.status === 'active' ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                                {sale.status === 'active' ? 'Em Aberto' : 'Finalizada'}
                                                            </span>
                                                        </div>
                                                        {sale.saleItems.length > 0 && (
                                                            <div className="px-5 py-3 space-y-2">
                                                                {sale.saleItems.map((item: any) => (
                                                                    <div key={item.id} className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <Package size={12} className="text-slate-400" />
                                                                            <span className="text-xs font-semibold text-slate-700">{item.product?.name || 'Produto'}</span>
                                                                            <span className="text-[10px] text-slate-400">×{item.quantity}</span>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-slate-600">R$ {fmt(Number(item.subtotal))}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {/* Installments Tab */}
                                    {activeTab === 'installments' && (() => {
                                        const allInstallments = participantDetails.sales.flatMap((s: any) =>
                                            s.installments.map((i: any) => ({ ...i, saleId: s.id }))
                                        ).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                                        return allInstallments.length === 0 ? (
                                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <CreditCard size={40} className="mx-auto text-slate-200 mb-3" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma parcela encontrada</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {allInstallments.map((inst: any) => (
                                                    <div key={inst.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{inst.number}x</div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">R$ {fmt(Number(inst.amount))}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Vecto: {new Date(inst.dueDate).toLocaleDateString('pt-BR')} · Venda #{inst.saleId}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {inst.paidAt && <p className="text-[9px] font-bold text-slate-400 uppercase hidden sm:block">Pago em {new Date(inst.paidAt).toLocaleDateString('pt-BR')}</p>}
                                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${instStatusColor(inst.status)}`}>
                                                                {inst.status === 'paid' ? 'Pago' : inst.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center py-20 text-center">
                                <div>
                                    <AlertCircle size={40} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Erro ao carregar detalhes</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
