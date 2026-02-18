import { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, Calendar, ChevronDown, ChevronUp, FileText, CheckCircle2, Clock, Trash2, X, AlertCircle, Eye, User, Phone, Mail, Package, Bell, Handshake } from 'lucide-react';
import { salesApi, productsApi, consortiumsApi } from '../../api';

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);
    const [sendingBulk, setSendingBulk] = useState(false);
    const [consortiums, setConsortiums] = useState<any[]>([]);

    const [form, setForm] = useState({
        personName: '', personPhone: '', personEmail: '', personDocument: '',
        totalAmount: 0, installmentCount: 1, notes: '', items: [] as any[],
        consortiumId: '', reminderDaysBefore: '', reminderIntervalAfter: ''
    });

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [sRes, pRes, cRes] = await Promise.all([
                salesApi.getAll(1, 100),
                productsApi.getAll(1, 100),
                consortiumsApi.getAll(1, 100)
            ]);
            setSales(sRes.data.sales);
            setProducts(pRes.data.products);
            setConsortiums(cRes.data.consortiums);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', quantity: 1, unitPrice: 0 }] });
    const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    const updateItem = (idx: number, field: string, value: any) => {
        const newItems = [...form.items];
        newItems[idx][field] = value;
        if (field === 'productId') {
            const p = products.find(prod => String(prod.id) === String(value));
            if (p) newItems[idx].unitPrice = p.unitPrice;
        }
        setForm({ ...form, items: newItems, totalAmount: newItems.reduce((acc, curr) => acc + (Number(curr.unitPrice) * Number(curr.quantity)), 0) });
    };

    const handleSave = async () => {
        try {
            setError(null);
            if (form.items.length === 0) throw new Error('Adicione pelo menos um item');
            const data = {
                ...form,
                consortiumId: form.consortiumId ? parseInt(form.consortiumId) : undefined,
                reminderDaysBefore: form.reminderDaysBefore ? parseInt(form.reminderDaysBefore) : undefined,
                reminderIntervalAfter: form.reminderIntervalAfter ? parseInt(form.reminderIntervalAfter) : undefined,
            };
            await salesApi.create(data);
            setShowModal(false);
            load();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Erro ao salvar venda');
        }
    };

    const handlePayInstallment = async (id: number) => {
        if (!confirm('Confirmar pagamento desta parcela?')) return;
        await salesApi.payInstallment(String(id));
        load();
    };

    const handleGenerateBoleto = async (id: number) => {
        const res = await salesApi.generateBoleto(String(id));
        alert('Boleto gerado com sucesso!');
        load();
        window.open(res.data.boletoUrl, '_blank');
    };

    const openDetails = (sale: any) => {
        setSelectedSale(sale);
        setShowDetailModal(true);
    };

    const toggleSelection = (id: number) => {
        setSelectedInstallments(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkNotify = async () => {
        if (selectedInstallments.length === 0) return;
        setSendingBulk(true);
        try {
            await salesApi.bulkNotify(selectedInstallments);
            alert('Lembretes enviados com sucesso!');
            setSelectedInstallments([]);
        } catch (err) { alert('Erro ao enviar lembretes.'); }
        finally { setSendingBulk(false); }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        if (!confirm(`Deseja alterar o status para ${translateStatus(newStatus)}?`)) return;
        try {
            await salesApi.update(String(id), { status: newStatus });
            load();
            setShowDetailModal(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao atualizar status');
        }
    };

    const translateStatus = (s: string) => {
        switch (s) {
            case 'active': return 'Ativa';
            case 'finished': return 'Finalizada';
            case 'cancelled': return 'Cancelada';
            case 'paid': return 'Paga';
            default: return s;
        }
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'active':
            case 'paid':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'finished':
                return 'bg-primary-50 text-primary-600 border-primary-100';
            case 'cancelled':
                return 'bg-red-50 text-red-600 border-red-100';
            default:
                return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vendas</h2>
                <div className="flex items-center gap-3">
                    {selectedInstallments.length > 0 && (
                        <button onClick={handleBulkNotify} disabled={sendingBulk}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                            {sendingBulk ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Phone size={18} />}
                            Notificar {selectedInstallments.length} {selectedInstallments.length === 1 ? 'pendência' : 'pendências'}
                        </button>
                    )}
                    <button onClick={() => { setForm({ personName: '', personPhone: '', personEmail: '', personDocument: '', totalAmount: 0, installmentCount: 1, notes: '', items: [], consortiumId: '', reminderDaysBefore: '', reminderIntervalAfter: '' }); setError(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20 active:scale-95">
                        <Plus size={18} /> Nova Venda
                    </button>
                </div>
            </div>

            {loading ? <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>
                : sales.length === 0 ? <div className="glass-card p-20 text-center bg-white border-dashed border-2 border-slate-200 shadow-sm"><ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-400 font-bold">Nenhuma venda realizada</p></div>
                    : (
                        <div className="grid gap-4">
                            {sales.map(s => (
                                <div key={s.id} className={`glass-card overflow-hidden group border transition-all duration-300 bg-white shadow-sm ${expandedId === s.id ? 'ring-2 ring-primary-100 border-primary-200' : 'border-slate-100 hover:border-primary-100 hover:shadow-md'}`}>
                                    <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                                        <div className="flex items-center gap-5">
                                            <div className="bg-primary-50 p-3.5 rounded-2xl border border-primary-100 group-hover:bg-primary-100 transition-all"><ShoppingCart size={24} className="text-primary-600" /></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-lg font-black text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight">{s.personName}</p>
                                                    <button onClick={(e) => { e.stopPropagation(); openDetails(s); }} className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors" title="Ver detalhes"><Eye size={18} /></button>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> {new Date(s.soldAt).toLocaleDateString('pt-BR')}</span>
                                                    <span className="text-slate-200">/</span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border shadow-sm ${statusColor(String(s.status))}`}>{translateStatus(String(s.status))}</span>
                                                    <span className="text-slate-200">/</span>
                                                    <span className="text-slate-500">{s.installmentCount} parcelas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xl font-black text-emerald-600 tracking-tighter">R$ {Number(s.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-full border border-slate-100">
                                                {expandedId === s.id ? <ChevronUp size={20} className="text-primary-600" /> : <ChevronDown size={20} className="text-slate-300" />}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedId === s.id && (
                                        <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-slate-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] animate-in slide-in-from-top-2 duration-300">
                                            {/* Items Section */}
                                            <div className="mb-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Package size={14} className="text-primary-600" /> Itens Comprados</h4>
                                                <div className="space-y-2">
                                                    {s.saleItems?.map((item: any) => (
                                                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-[10px] font-black text-primary-600 border border-primary-100">{item.quantity}x</div>
                                                                <p className="text-sm font-bold text-slate-900">{item.product?.name}</p>
                                                            </div>
                                                            <p className="text-sm font-black text-emerald-600">R$ {Number(item.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Installments Section */}
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FileText size={14} className="text-amber-500" /> Cronograma de Pagamento</h4>
                                                <div className="grid gap-2">
                                                    {s.installments?.map((inst: any) => (
                                                        <div key={inst.id} className={`flex items-center justify-between bg-white rounded-xl p-4 border transition-all shadow-sm ${selectedInstallments.includes(inst.id) ? 'border-primary-200 bg-primary-50/30 ring-1 ring-primary-100' : 'border-slate-100 hover:bg-slate-50'}`}>
                                                            <div className="flex items-center gap-4">
                                                                {inst.status !== 'paid' && (
                                                                    <div onClick={(e) => { e.stopPropagation(); toggleSelection(inst.id); }}
                                                                        className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${selectedInstallments.includes(inst.id) ? 'bg-primary-600 border-primary-600 shadow-md shadow-primary-200' : 'bg-white border-slate-200 hover:border-primary-400'}`}>
                                                                        {selectedInstallments.includes(inst.id) && <div className="w-3 h-3 bg-white rounded-sm" />}
                                                                    </div>
                                                                )}
                                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">{inst.number}/{s.installmentCount}</div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900">R$ {Number(inst.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Vencimento: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${inst.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                                    {inst.status === 'paid' ? 'Pago' : 'Pendente'}
                                                                </span>
                                                                {inst.status !== 'paid' && (
                                                                    <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                                                                        <button onClick={() => handlePayInstallment(inst.id)} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-emerald-100" title="Marcar como Pago"><CheckCircle2 size={18} /></button>
                                                                        <button onClick={() => handleGenerateBoleto(inst.id)} className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-primary-100" title="Gerar Boleto"><FileText size={18} /></button>
                                                                    </div>
                                                                )}
                                                                {inst.boletoUrl && (
                                                                    <button onClick={() => window.open(inst.boletoUrl, '_blank')} className="p-2.5 text-accent-600 hover:bg-accent-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-accent-100" title="Ver Boleto"><Eye size={18} /></button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

            {/* Nova Venda Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
                    <div className="bg-white w-full max-w-2xl p-8 rounded-3xl space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nova Venda</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Preencha os dados do cliente e produtos</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2.5 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:rotate-90"><X size={24} /></button>
                        </div>
                        {error && (<div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"><AlertCircle size={18} /> {error}</div>)}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente *</label>
                                <div className="relative group">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                    <input value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} placeholder="Nome completo do cliente" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100/50 focus:bg-white focus:border-primary-200 transition-all text-sm shadow-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                <div className="relative group">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                    <input value={form.personPhone} onChange={e => setForm({ ...form, personPhone: e.target.value })} placeholder="(00) 00000-0000" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100/50 focus:bg-white focus:border-primary-200 transition-all text-sm shadow-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative group">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                    <input value={form.personEmail} onChange={e => setForm({ ...form, personEmail: e.target.value })} placeholder="email@exemplo.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100/50 focus:bg-white focus:border-primary-200 transition-all text-sm shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Package size={14} className="text-primary-600" /> Produtos e Itens</h4>
                                <button onClick={addItem} className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 transition-all shadow-sm">+ Adicionar Item</button>
                            </div>
                            <div className="space-y-3">
                                {form.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex-1 min-w-[200px] space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Produto</label>
                                            <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:ring-4 focus:ring-primary-100/50 transition-all">
                                                <option value="">Selecionar produto...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>)}
                                            </select>
                                        </div>
                                        <div className="w-24 space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd</label>
                                            <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:ring-4 focus:ring-primary-100/50 transition-all" />
                                        </div>
                                        <div className="w-36 space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Unitário</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span>
                                                <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} className="w-full pl-8 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:ring-4 focus:ring-primary-100/50 transition-all" />
                                            </div>
                                        </div>
                                        <button onClick={() => removeItem(idx)} className="p-3 text-slate-300 hover:text-red-500 bg-white border border-slate-200 rounded-xl transition-all shadow-sm hover:border-red-100"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Handshake size={14} className="text-primary-600" /> Vincular a Consórcio (Opcional)
                                </label>
                                <select value={form.consortiumId} onChange={e => setForm({ ...form, consortiumId: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100/50 transition-all text-sm shadow-sm">
                                    <option value="">Nenhum consórcio vinculado</option>
                                    {consortiums.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Parcelas</label>
                                <input type="number" min="1" max="120" value={form.installmentCount} onChange={e => setForm({ ...form, installmentCount: parseInt(e.target.value) })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100/50 transition-all text-sm shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total da Venda</label>
                                <div className="w-full px-6 py-4 bg-white border-2 border-primary-500 rounded-2xl text-primary-600 font-black text-2xl shadow-lg shadow-primary-500/5 flex items-center justify-center">
                                    R$ {form.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Bell size={14} className="text-amber-500" /> Configuração de Lembretes (Sobrescreve Global/Consórcio)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-2">Lembrar Antes (Dias)</label>
                                    <input type="number" placeholder="Ex: 1" value={form.reminderDaysBefore} onChange={e => setForm({ ...form, reminderDaysBefore: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-2">Aviso Atraso (Intervalo)</label>
                                    <input type="number" placeholder="Ex: 3" value={form.reminderIntervalAfter} onChange={e => setForm({ ...form, reminderIntervalAfter: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-sm" />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSave} className="w-full py-5 bg-primary-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-500 hover:shadow-2xl hover:shadow-primary-500/30 active:scale-[0.98] transition-all shadow-xl shadow-primary-500/20">Finalizar Venda</button>
                    </div>
                </div>
            )}

            {/* Venda Detail Modal */}
            {showDetailModal && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-white w-full max-w-4xl p-8 rounded-3xl space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Detalhes da Venda</h3>
                                <div className="flex items-center gap-4">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ID: #{selectedSale.id} · Realizada em {new Date(selectedSale.soldAt).toLocaleDateString('pt-BR')}</p>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm ${statusColor(selectedSale.status)}`}>{translateStatus(selectedSale.status)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedSale.status === 'active' && (
                                    <>
                                        <button onClick={() => handleUpdateStatus(selectedSale.id, 'finished')} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:shadow-lg transition-all active:scale-95"><CheckCircle2 size={18} /> Finalizar</button>
                                        <button onClick={() => handleUpdateStatus(selectedSale.id, 'cancelled')} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:shadow-lg transition-all active:scale-95"><X size={18} /> Cancelar</button>
                                    </>
                                )}
                                {selectedSale.status !== 'active' && (
                                    <button onClick={() => handleUpdateStatus(selectedSale.id, 'active')} className="flex items-center gap-6 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-500 transition-all active:scale-95">Reabrir Venda</button>
                                )}
                                <button onClick={() => setShowDetailModal(false)} className="p-2.5 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:rotate-90 ml-3"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><User size={14} className="text-primary-600" /> Informações do Cliente</h4>
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5 shadow-sm">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</p>
                                                <p className="text-base font-black text-slate-900 tracking-tight">{selectedSale.personName}</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp</p>
                                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-200/50"><Phone size={14} className="text-emerald-500" /> {selectedSale.personPhone || 'Não informado'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">E-mail</p>
                                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-200/50"><Mail size={14} className="text-primary-500" /> {selectedSale.personEmail || 'Não informado'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Documento/CPF</p>
                                                <p className="text-sm font-black text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200/50"> {selectedSale.personDocument || 'Não informado'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Package size={14} className="text-orange-500" /> Itens da Venda</h4>
                                        <div className="space-y-3">
                                            {selectedSale.saleItems?.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all group">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{item.product?.name}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} un. × R$ {Number(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <p className="text-sm font-black text-emerald-600">R$ {Number(item.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">Observações</h4>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 min-h-[100px] leading-relaxed shadow-inner">
                                        {selectedSale.notes || 'Nenhuma observação registrada para esta venda.'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Clock size={14} className="text-primary-600" /> Resumo Financeiro</h4>
                                <div className="bg-primary-600 p-8 rounded-[2.5rem] shadow-2xl shadow-primary-500/30 text-white space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Valor Liquído Total</p>
                                        <p className="text-4xl font-black tracking-tighter">R$ {Number(selectedSale.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="h-px bg-white/20 w-full relative z-10" />
                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Parcelamento</p>
                                            <p className="text-sm font-black">{selectedSale.installmentCount}x Fixas</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Status</p>
                                            <p className="text-sm font-black uppercase tracking-widest">{translateStatus(selectedSale.status)}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 relative z-10">
                                        <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/20 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Valor Médio Parcela</span>
                                            <span className="text-base font-black">R$ {(Number(selectedSale.totalAmount) / selectedSale.installmentCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Pago</p>
                                    <p className="text-2xl font-black text-emerald-700">R$ {selectedSale.installments?.filter((i: any) => i.status === 'paid').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
