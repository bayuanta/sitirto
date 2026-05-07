'use client';

import { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, History, Banknote,
    FileText, Calendar, User, CheckCircle2, Printer,
    AlertCircle, Loader2, X, Trash2, Receipt,
    ChevronDown, ChevronUp, LayoutDashboard, CheckSquare, Square, ArrowUpCircle, Store
} from 'lucide-react';
import Link from 'next/link';
import {
    getUndepositedSummary,
    getUndepositedDetails,
    getUnifiedSetoranData,
    createDeposit,
    deleteDeposit,
    UndepositedSummary,
    UndepositedDetail,
    DepositHistory
} from './actions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function SetoranPage() {
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<'air' | 'sr'>('air');

    // Data State
    const [summary, setSummary] = useState<UndepositedSummary>({
        total_amount: 0,
        transaction_amount: 0,
        installation_amount: 0,
        transaction_count: 0,
        installation_count: 0,
        total_count: 0
    });
    const [details, setDetails] = useState<UndepositedDetail[]>([]);
    const [history, setHistory] = useState<DepositHistory[]>([]);

    // UI State
    const [showDetails, setShowDetails] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // --- COMPUTED VALUES ---
    const filteredDetails = details.filter(item => 
        activeTab === 'air' ? item.type === 'transaction' : item.type === 'installation'
    );
    
    const filteredHistory = history.filter(item => 
        item.type === activeTab || item.type === 'mixed'
    );

    const selectedTotal = filteredDetails
        .filter(item => selectedIds.has(item.id))
        .reduce((sum, item) => sum + item.amount, 0);

    const selectedCount = selectedIds.size;

    // --- LOAD DATA ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { summary, history, details } = await getUnifiedSetoranData();
            setSummary(summary);
            setHistory(history);
            setDetails(details);
            
            // Auto-select based on current tab
            const initialFiltered = details.filter(d => activeTab === 'air' ? d.type === 'transaction' : d.type === 'installation');
            setSelectedIds(new Set(initialFiltered.map(d => d.id)));
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---
    const handleTabChange = (tab: 'air' | 'sr') => {
        setActiveTab(tab);
        const newFiltered = details.filter(d => tab === 'air' ? d.type === 'transaction' : d.type === 'installation');
        setSelectedIds(new Set(newFiltered.map(d => d.id)));
    };

    const handleDeposit = async () => {
        if (selectedIds.size === 0) {
            toast.error('Pilih minimal satu transaksi untuk disetor');
            return;
        }

        setSubmitting(true);
        try {
            const isAir = activeTab === 'air';
            const transactionIds = isAir ? Array.from(selectedIds) : [];
            const installationIds = !isAir ? Array.from(selectedIds) : [];
            const prefix = isAir ? '[AIR]' : '[SR]';

            const result = await createDeposit(
                'Admin',
                `${prefix} Setoran ${selectedCount} transaksi`,
                '', // evidenceUrl
                transactionIds,
                installationIds
            );

            if (result.success) {
                toast.success('Setoran berhasil!');
                loadData();
            } else {
                toast.error(result.message || 'Gagal menyetor');
            }
        } catch (error) {
            console.error('Error creating deposit:', error);
            toast.error('Terjadi kesalahan sistem');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus setoran ini?')) return;

        setDeleting(id);
        try {
            const result = await deleteDeposit(id);
            if (result.success) {
                toast.success('Setoran berhasil dihapus');
                loadData();
            } else {
                toast.error(result.message || 'Gagal menghapus');
            }
        } catch (error) {
            console.error('Error deleting deposit:', error);
            toast.error('Terjadi kesalahan sistem');
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleTransaction = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleToggleAll = () => {
        if (selectedIds.size === filteredDetails.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredDetails.map(d => d.id)));
        }
    };

    // --- HELPERS ---
    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return format(date, 'd MMM yyyy', { locale: id });
        } catch {
            return '-';
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return format(date, 'HH:mm', { locale: id });
        } catch {
            return '-';
        }
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col h-auto md:h-[calc(100vh-10rem)] w-full gap-4 pb-10 md:pb-0">
            {/* TABS */}
            <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                    variant={activeTab === 'air' ? 'default' : 'outline'} 
                    onClick={() => handleTabChange('air')}
                    className="rounded-full font-bold px-6 shadow-sm w-full sm:w-auto text-xs sm:text-sm h-10 sm:h-11"
                >
                    <Wallet className="w-4 h-4 mr-2" /> Setoran Tagihan Air
                </Button>
                <Button 
                    variant={activeTab === 'sr' ? 'default' : 'outline'} 
                    onClick={() => handleTabChange('sr')}
                    className="rounded-full font-bold px-6 shadow-sm w-full sm:w-auto text-xs sm:text-sm h-10 sm:h-11"
                >
                    <Store className="w-4 h-4 mr-2" /> Setoran Pasang Baru (SR)
                </Button>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-4 h-full min-h-0">
                {/* LEFT COLUMN (60%) - RIWAYAT SETORAN */}
                <div className="col-span-12 md:col-span-7 h-auto md:h-full flex flex-col min-h-0 order-2 md:order-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
                        {/* HEADER */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <History className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Riwayat Setoran {activeTab === 'air' ? 'Air' : 'SR'}</h3>
                                    <p className="text-xs text-slate-500 font-medium">Daftar setoran ke bendahara</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                <span className="text-xs font-black text-indigo-700">{filteredHistory.length} Total</span>
                            </div>
                        </div>

                        {/* LIST */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 max-h-[400px] md:max-h-none">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-sm font-medium">Memuat data...</p>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
                                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                                        <History className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800">Belum Ada Riwayat</h4>
                                    <p className="text-slate-500 text-sm mt-1">Setoran akan muncul di sini setelah disetor</p>
                                </div>
                            ) : (
                                filteredHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3 flex-1">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                    <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-black text-slate-800">{item.collector_name}</span>
                                                        <span className="text-xs text-slate-300">•</span>
                                                        <span className="text-xs font-semibold text-slate-600">{formatDate(item.deposit_date)}</span>
                                                    </div>
                                                    <p className="text-2xl font-black text-emerald-600 font-mono tracking-tight mb-2">
                                                        {formatRupiah(item.total_cash)}
                                                    </p>
                                                    {item.notes && (
                                                        <p className="text-xs text-slate-600 italic bg-slate-50 px-2 py-1 rounded inline-block">
                                                            💬 "{item.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                    {formatTime(item.created_at)}
                                                </span>
                                                <div className="flex items-center gap-1 mt-auto">
                                                    <Link
                                                        href={`/print-setoran/${item.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                                        title="Cetak Setoran"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={deleting === item.id}
                                                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                                                        title="Hapus Setoran"
                                                    >
                                                        {deleting === item.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-center text-slate-400 font-medium h-8 flex items-center justify-center">
                            Total: {filteredHistory.length} setoran
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (40%) - DASHBOARD/CASH ON HAND */}
                <div className="col-span-12 md:col-span-5 h-auto md:h-full flex flex-col min-h-0 order-1 md:order-2">
                    {(activeTab === 'air' ? summary.transaction_amount : summary.installation_amount) === 0 ? (
                        // DASHBOARD STATS
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center p-6 h-full text-center space-y-4">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner">
                                <Wallet className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-800">Setoran {activeTab === 'air' ? 'Tagihan Air' : 'Pasang Baru'}</h2>
                                <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                                    Kelola uang tunai dan riwayat setoran ke bendahara
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-6">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Setoran</p>
                                    <p className="text-xl font-black text-slate-800 mt-0.5">{filteredHistory.length}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tunai Tersedia</p>
                                    <p className="text-base font-black text-emerald-600 mt-0.5">
                                        {formatRupiah(activeTab === 'air' ? summary.transaction_amount : summary.installation_amount)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // CASH ON HAND PANEL
                        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 flex flex-col h-auto md:h-full overflow-hidden ring-4 ring-slate-50/50 mb-4 md:mb-0">
                            {/* HEADER */}
                            <div className="bg-indigo-50/80 border-b border-indigo-100 px-4 py-3 flex items-center justify-between shrink-0 h-14">
                                <div className="flex items-center gap-2 text-indigo-800">
                                    <Wallet className="w-4 h-4" />
                                    <span className="font-bold text-xs uppercase tracking-wider">Cash on Hand - {activeTab === 'air' ? 'Air' : 'SR'}</span>
                                </div>
                            </div>

                            {/* BODY */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* SUMMARY CARD */}
                                <div className="bg-slate-800 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Banknote className="w-16 h-16 -mr-2 -mt-2 transform rotate-12" />
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        Total Dipilih ({selectedCount} dari {filteredDetails.length})
                                    </p>
                                    <div className="text-3xl font-black font-mono tracking-tight">
                                        {formatRupiah(selectedTotal)}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-slate-400 text-[9px] font-bold uppercase">Total Tersedia</p>
                                            <p className="text-lg font-black mt-0.5">{formatRupiah(activeTab === 'air' ? summary.transaction_amount : summary.installation_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-[9px] font-bold uppercase">Total Transaksi</p>
                                            <p className="text-lg font-black mt-0.5">{activeTab === 'air' ? summary.transaction_count : summary.installation_count}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* TRANSACTION DETAILS - EXPANDABLE */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    {/* HEADER - CLICKABLE */}
                                    <button
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Receipt className="w-4 h-4 text-slate-600" />
                                            <span className="text-sm font-bold text-slate-700">Detail Transaksi</span>
                                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                {filteredDetails.length}
                                            </span>
                                        </div>
                                        {showDetails ? (
                                            <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>

                                    {/* DETAILS LIST */}
                                    {showDetails && (
                                        <div className="bg-white">
                                            {filteredDetails.length === 0 ? (
                                                <div className="p-4 text-center text-slate-400 text-sm">
                                                    Tidak ada transaksi
                                                </div>
                                            ) : (
                                                <>
                                                    {/* SELECT ALL HEADER */}
                                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                        <button
                                                            onClick={handleToggleAll}
                                                            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                                                        >
                                                            {selectedIds.size === filteredDetails.length ? (
                                                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                            ) : (
                                                                <Square className="w-4 h-4" />
                                                            )}
                                                            Pilih Semua
                                                        </button>
                                                        <span className="text-xs font-bold text-slate-400">
                                                            {selectedCount}/{filteredDetails.length}
                                                        </span>
                                                    </div>

                                                    {/* TRANSACTION LIST */}
                                                    <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-100">
                                                        {filteredDetails.map((item) => {
                                                            const isSelected = selectedIds.has(item.id);
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    onClick={() => handleToggleTransaction(item.id)}
                                                                    className={cn(
                                                                        "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                                                                        isSelected && "bg-indigo-50/30"
                                                                    )}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        {/* CHECKBOX */}
                                                                        <div className="pt-0.5">
                                                                            {isSelected ? (
                                                                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                                            ) : (
                                                                                <Square className="w-4 h-4 text-slate-300" />
                                                                            )}
                                                                        </div>

                                                                        {/* CONTENT */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-sm font-bold text-slate-800 truncate">
                                                                                    {item.customer_name}
                                                                                </span>
                                                                                {item.type === 'transaction' ? (
                                                                                    <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                                                                        Air
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                                                                                        SR
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-slate-500 font-medium">
                                                                                {formatDate(item.date)} • {formatTime(item.date)}
                                                                            </p>
                                                                        </div>

                                                                        {/* AMOUNT */}
                                                                        <div className="text-right shrink-0">
                                                                            <p className="text-base font-black text-emerald-600 font-mono">
                                                                                {formatRupiah(item.amount)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                                <Button
                                    size="lg"
                                    className="w-full h-12 text-sm font-black tracking-wide shadow-xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                                    onClick={handleDeposit}
                                    disabled={submitting || selectedIds.size === 0}
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <ArrowUpCircle className="w-5 h-5" />
                                            SETOR SEKARANG
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
