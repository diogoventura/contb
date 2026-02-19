import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package, AlertTriangle, Eye, DollarSign, History, TrendingUp, BarChart3, Info, Database } from 'lucide-react';
import { productsApi, api } from '../../api';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: '', description: '', sku: '', unitPrice: '', costPrice: '', quantity: '', minStock: '' });
    const [search, setSearch] = useState('');
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState('');

    const load = () => {
        setLoading(true);
        productsApi.getAll(1, 100).then(r => setProducts(r.data.products)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', description: '', sku: '', unitPrice: '', costPrice: '', quantity: '', minStock: '' }); setShowModal(true); };
    const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, description: p.description || '', sku: p.sku || '', unitPrice: String(p.unitPrice), costPrice: String(p.costPrice || 0), quantity: String(p.quantity), minStock: String(p.minStock) }); setShowModal(true); };
    const openDetails = (p: any) => { setSelectedProduct(p); setShowDetailModal(true); };

    const handleSave = async () => {
        const data = { ...form, unitPrice: parseFloat(form.unitPrice), costPrice: parseFloat(form.costPrice), quantity: parseInt(form.quantity), minStock: parseInt(form.minStock) };
        if (editing) await productsApi.update(editing.id, data);
        else await productsApi.create(data);
        setShowModal(false); load();
    };

    const handleDelete = async (id: number) => { if (!confirm('Remover produto?')) return; await productsApi.delete(String(id)); load(); };

    const handleBulkSave = async () => {
        try {
            const items = JSON.parse(bulkText);
            if (!Array.isArray(items)) throw new Error('O conteúdo deve ser um array JSON');
            await api.post('/products/bulk', { items });
            setShowBulkModal(false);
            setBulkText('');
            load();
            alert('Produtos inseridos com sucesso!');
        } catch (e) {
            alert('Erro ao processar JSON: ' + (e as Error).message);
        }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Produtos</h2>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-600 transition-colors" size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar produtos..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-64 transition-all shadow-sm" />
                    </div>
                    <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-xs uppercase tracking-widest shadow-sm group">
                        <Database size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                        Inclusão em Massa
                    </button>
                    <button onClick={openCreate} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 transition-all"><Plus size={18} /> Novo Produto</button>
                </div>
            </div>

            {loading ? <div className="flex justify-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>
                : filtered.length === 0 ? <div className="glass-card p-20 text-center bg-white border-dashed border-2 border-slate-200 shadow-sm"><Package size={48} className="mx-auto text-slate-400 mb-4" /><p className="text-slate-500 text-lg font-medium">Nenhum produto encontrado</p></div>
                    : (
                        <div className="glass-card overflow-hidden border border-white shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-5">Produto</th>
                                        <th className="px-6 py-5">SKU</th>
                                        <th className="px-6 py-5">Preço</th>
                                        <th className="px-6 py-5">Estoque</th>
                                        <th className="px-6 py-5 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-primary-50 rounded-xl border border-primary-100"><Package size={18} className="text-primary-600" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{p.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1 uppercase tracking-wider">{p.description || 'Sem descrição'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500 font-mono font-medium">{p.sku || '---'}</td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-black text-emerald-600">R$ {Number(p.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Custo: R$ {Number(p.costPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${p.quantity <= p.minStock ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                        {p.quantity} UN
                                                    </span>
                                                    {p.quantity <= p.minStock && <AlertTriangle size={14} className="text-red-500" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openDetails(p)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Visualizar"><Eye size={18} /></button>
                                                    <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Editar"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Remover"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

            {/* Product Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
                    <div className="glass-card w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-300 bg-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-900 tracking-tight">{editing ? 'Editar' : 'Novo'} Produto</h3><button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-slate-600 bg-slate-100 rounded-xl"><X size={24} /></button></div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome do Produto *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome comercial" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">SKU / Referência</label>
                                    <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Ex: BIKE-001" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Descrição</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm h-24 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Preço Venda (R$)</label>
                                    <input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Custo (R$)</label>
                                    <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Estoque Inicial</label>
                                    <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Aviso Mínimo</label>
                                    <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm" />
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl active:scale-95 transition-all">Salvar Produto</button>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {showDetailModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowDetailModal(false)}>
                    <div className="glass-card w-full max-w-4xl p-8 space-y-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto bg-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                                <div className="h-16 w-16 rounded-3xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 rotate-3 transition-transform hover:rotate-0 shadow-sm"><Package size={32} /></div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedProduct.name}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.25em]">SKU: {selectedProduct.sku || 'NÃO DEFINIDO'} · ID: #{selectedProduct.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 text-slate-500 hover:text-slate-600 bg-slate-100 rounded-xl"><X size={24} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><DollarSign size={14} className="text-emerald-500" /> Preço de Venda</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">R$ {Number(selectedProduct.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-primary-600" /> Margem de Lucro</p>
                                <p className="text-2xl font-black text-emerald-600 tracking-tight">{selectedProduct.costPrice > 0 ? (((selectedProduct.unitPrice - selectedProduct.costPrice) / selectedProduct.costPrice) * 100).toFixed(1) : '---'}%</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} className="text-purple-500" /> Disponibilidade</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{selectedProduct.quantity} <span className="text-xs font-bold text-slate-500 uppercase">UN</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2"><Info size={14} className="text-primary-600" /> Especificações</h4>
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Custo de Aquisição</p>
                                            <p className="text-sm font-bold text-slate-900">R$ {Number(selectedProduct.costPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estoque de Alerta (Mínimo)</p>
                                            <p className="text-sm font-bold text-slate-900">{selectedProduct.minStock} UN</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status do Catálogo</p>
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase">Ativo para Venda</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2"><History size={14} className="text-amber-500" /> Descrição do Produto</h4>
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 min-h-[160px]">
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedProduct.description || 'Nenhuma descrição técnica disponível para este produto.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowBulkModal(false)}>
                    <div className="glass-card w-full max-w-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300 bg-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Inclusão em Massa</h3>
                                <p className="text-xs text-slate-500 font-medium">Cole o JSON contendo o array de produtos.</p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="p-2 text-slate-500 hover:text-slate-600 bg-slate-100 rounded-xl"><X size={24} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exemplo de Formato:</p>
                                <pre className="text-[10px] text-slate-600 font-mono">
                                    {`[\n  { "name": "Produto A", "sku": "SKU-001", "unitPrice": 100, "quantity": 10 },\n  { "name": "Produto B", "sku": "SKU-002", "unitPrice": 250, "quantity": 5 }\n]`}
                                </pre>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">JSON dos Produtos</label>
                                <textarea
                                    value={bulkText}
                                    onChange={e => setBulkText(e.target.value)}
                                    placeholder="Paste JSON here..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm h-64 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setShowBulkModal(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-bold text-sm">Cancelar</button>
                            <button onClick={handleBulkSave} className="flex-2 px-10 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm shadow-xl shadow-slate-200">Processar Inclusão</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
