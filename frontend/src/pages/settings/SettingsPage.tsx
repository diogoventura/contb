import { useState, useEffect } from 'react';
import { settingsApi, whatsappApi } from '../../api';
import { Settings, Bell, Building, Save, Smartphone, CheckCircle, AlertTriangle, X, Loader2, QrCode } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('notifications');
    const [wsStatus, setWsStatus] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [companyForm, setCompanyForm] = useState({
        company_name: '',
        company_cnpj: '',
        company_address: '',
        company_phone: ''
    });

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [s, ws] = await Promise.all([
                settingsApi.getAll(),
                whatsappApi.getStatus()
            ]);
            setSettings(s.data);
            setWsStatus(ws.data);

            const form: any = {};
            s.data.forEach((item: any) => {
                if (item.key.startsWith('company_')) {
                    form[item.key] = item.value;
                }
            });
            setCompanyForm((prev: any) => ({ ...prev, ...form }));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadSettings(); }, []);

    const getVal = (key: string) => settings.find((s: any) => s.key === key)?.value || '';

    const handleSaveSetting = async (key: string, value: string) => {
        setSaving(true);
        try {
            await settingsApi.save(key, value);
            await loadSettings();
        } catch (e) { alert('Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    const handleSaveCompany = async () => {
        setSaving(true);
        try {
            await Promise.all(
                Object.entries(companyForm).map(([key, value]) => settingsApi.save(key, value))
            );
            await loadSettings();
            alert('Dados da empresa atualizados com sucesso!');
        } catch (e) { alert('Erro ao salvar dados da empresa.'); }
        finally { setSaving(false); }
    };

    const fetchQr = async () => {
        try {
            const res = await whatsappApi.getQr();
            setQrCode(res.data.qr);
        } catch (e) {
            console.error('Erro ao buscar QR Code', e);
        }
    };

    useEffect(() => {
        let interval: any;
        if (wsStatus && !wsStatus.isReady) {
            fetchQr();
            interval = setInterval(async () => {
                const res = await whatsappApi.getStatus();
                const status = res.data;
                setWsStatus(status);
                if (status.isReady) {
                    clearInterval(interval);
                    setQrCode(null);
                } else if (!status.hasQR && !qrCode) {
                    fetchQr();
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [wsStatus?.isReady]);

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" /></div>;

    const tabs = [
        { id: 'notifications', name: 'Notificações', icon: Bell },
        { id: 'company', name: 'Empresa', icon: Building },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Configurações</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Gerencie as preferências globais e integrações da plataforma.</p>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-slate-50 border border-slate-100 rounded-[2rem] w-fit shadow-sm">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
                        <tab.icon size={20} /> {tab.name}
                    </button>
                ))}
            </div>

            {/* Tab Content: Notifications */}
            {activeTab === 'notifications' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest">
                            <div className="p-3 bg-primary-50 rounded-2xl text-primary-600 border border-primary-100"><Bell size={24} /></div>
                            Tempo de Aviso de Pagamento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lembrar antes do vencimento (Dias)</label>
                                <div className="flex gap-4">
                                    <input type="number" defaultValue={getVal('reminder_days_before') || '1'} id="reminder_before"
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-primary-100/50 focus:outline-none focus:bg-white focus:border-primary-200 transition-all shadow-inner" />
                                    <button onClick={() => handleSaveSetting('reminder_days_before', (document.getElementById('reminder_before') as HTMLInputElement).value)}
                                        className="px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95">Definir</button>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1 flex items-center gap-2 mt-2"><CheckCircle size={12} className="text-primary-500" /> Enviará lembrete automático X dias antes.</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Aviso após vencimento (Intervalo)</label>
                                <div className="flex gap-4">
                                    <input type="number" defaultValue={getVal('reminder_interval_after') || '3'} id="reminder_after"
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-primary-100/50 focus:outline-none focus:bg-white focus:border-primary-200 transition-all shadow-inner" />
                                    <button onClick={() => handleSaveSetting('reminder_interval_after', (document.getElementById('reminder_after') as HTMLInputElement).value)}
                                        className="px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95">Definir</button>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1 flex items-center gap-2 mt-2"><CheckCircle size={12} className="text-primary-500" /> Repetirá o aviso a cada X dias de atraso.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                        <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest relative z-10">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100"><Smartphone size={24} /></div>
                            Status da Integração WhatsApp
                        </h3>

                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center gap-6 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-emerald-100 transition-all duration-300">
                                <div className={`h-20 w-20 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg ${wsStatus?.isReady ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                                    {wsStatus?.isReady ? <CheckCircle size={40} /> : <AlertTriangle size={40} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900 text-xl tracking-tight">{wsStatus?.isReady ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}</p>
                                    <p className="text-sm text-slate-500 font-medium">As notificações automáticas dependem desta conexão ativa e estável.</p>
                                </div>
                                {wsStatus?.isReady && (
                                    <button onClick={async () => { await whatsappApi.logout(); loadSettings(); }} className="px-8 py-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
                                        Desconectar
                                    </button>
                                )}
                            </div>

                            {!wsStatus?.isReady && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-white rounded-[2rem] border border-slate-100 animate-in slide-in-from-top-6 duration-500 shadow-xl shadow-slate-200/50">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 border border-primary-100 shrink-0 mt-1"><QrCode size={20} /></div>
                                            <div className="space-y-3">
                                                <p className="text-lg font-black text-slate-900 tracking-tight">Como conectar?</p>
                                                <ul className="text-xs text-slate-500 space-y-3 font-medium leading-relaxed">
                                                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900 shrink-0">1</span> Abra o WhatsApp no seu telemóvel</li>
                                                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900 shrink-0">2</span> Toque em Dispositivos Conectados</li>
                                                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900 shrink-0">3</span> Clique em Conectar um dispositivo</li>
                                                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900 shrink-0">4</span> Aponte a câmara para o código ao lado</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center md:justify-end">
                                        <div className="bg-slate-50 p-4 rounded-[2.5rem] aspect-square w-64 flex items-center justify-center relative shadow-inner border border-slate-100 group">
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-[2.5rem]" />
                                            {qrCode ? (
                                                <div className="bg-white p-3 rounded-2xl shadow-xl transition-transform hover:scale-105 duration-300">
                                                    <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <Loader2 className="animate-spin" size={40} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Gerando QR Code...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'company' && (
                <div className="bg-white p-10 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600" />

                    <h3 className="text-sm font-black text-slate-900 mb-10 flex items-center gap-3 uppercase tracking-widest">
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 shadow-sm"><Building size={24} /></div>
                        Perfil da Empresa
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { key: 'company_name', label: 'Razão Social / Nome Fantasia', placeholder: 'Ex: SV Gestão de Vendas' },
                            { key: 'company_cnpj', label: 'CNPJ / CPF', placeholder: '00.000.000/0001-00' },
                            { key: 'company_address', label: 'Endereço Comercial Completo', placeholder: 'Logradouro, Nº, Bairro, Cidade - UF' },
                            { key: 'company_phone', label: 'Telefone para Boletos / Contato', placeholder: '+55 11 9999-9999' },
                        ].map((field) => (
                            <div key={field.key} className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                <input value={(companyForm as any)[field.key]} onChange={e => setCompanyForm({ ...companyForm, [field.key]: e.target.value })} placeholder={field.placeholder}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-4 focus:ring-primary-100/50 focus:outline-none focus:bg-white focus:border-primary-200 transition-all text-sm shadow-inner" />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end pt-10 mt-10 border-t border-slate-50">
                        <button onClick={handleSaveCompany} disabled={saving}
                            className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl shadow-slate-900/20 active:scale-95 disabled:opacity-50">
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
