'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
    Search, Calendar, Download, Filter,
    Droplets, Home, Wallet, CreditCard,
    Banknote, RefreshCcw, TrendingUp, ChevronDown,
    ChevronUp, Loader2, Trash2, AlertTriangle, Printer
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import {
    getWaterBillTransactions,
    getInstallationPayments,
    deleteWaterTransaction,
    deleteInstallationPayment,
    WaterBillTransaction,
    InstallationPayment,
    AllocationDetail
} from './actions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// import { toast } from 'sonner'; // Removed for now, using alert as fallback

type TabType = 'water' | 'installation';

export default function RiwayatPage() {
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('water');

    // Water bill state
    const [waterTransactions, setWaterTransactions] = useState<WaterBillTransaction[]>([]);
    const [waterSummary, setWaterSummary] = useState({ total_amount: 0, count: 0 });

    // Installation payment state
    const [installationPayments, setInstallationPayments] = useState<InstallationPayment[]>([]);
    const [installationSummary, setInstallationSummary] = useState({ total_amount: 0, count: 0 });

    // Expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Delete State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, type: TabType } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter State
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
        end: new Date().toISOString().split('T')[0]
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'transfer'>('all');

    // --- FETCH DATA ---
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'water') {
                const res = await getWaterBillTransactions(
                    dateRange.start,
                    dateRange.end,
                    searchTerm,
                    methodFilter
                );
                setWaterTransactions(res.data);
                setWaterSummary(res.summary);
            } else {
                const res = await getInstallationPayments(
                    dateRange.start,
                    dateRange.end,
                    searchTerm,
                    methodFilter
                );
                setInstallationPayments(res.data);
                setInstallationSummary(res.summary);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    }, [dateRange, activeTab, searchTerm, methodFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadData]);

    // --- ACTIONS ---
    const confirmDelete = (id: number, type: TabType) => {
        setItemToDelete({ id, type });
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            let res;
            if (itemToDelete.type === 'water') {
                res = await deleteWaterTransaction(itemToDelete.id);
            } else {
                res = await deleteInstallationPayment(itemToDelete.id);
            }

            if (res.success) {
                // Refresh data
                loadData();
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
                // Optionally show success toast here if toast component exists
                // alert(res.message); 
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Gagal menghapus data.");
        } finally {
            setIsDeleting(false);
        }
    };

    // --- HELPERS ---
    const formatRupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), 'dd MMM yyyy', { locale: id });
    };

    const formatTime = (dateStr: string) => {
        return format(new Date(dateStr), 'HH:mm', { locale: id });
    };

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const currentSummary = activeTab === 'water' ? waterSummary : installationSummary;

    return (
        <div className="flex flex-col h-auto md:h-[calc(100vh-theme(spacing.8))] w-full gap-4 pb-20 md:pb-0">

            {/* 1. HEADER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch shrink-0">

                {/* Title Panel */}
                <div className="md:col-span-2">
                    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm rounded-2xl p-6 h-full flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute -left-4 -top-4 h-24 w-24 bg-indigo-100/40 rounded-full blur-2xl"></div>
                        <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-purple-100/30 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
                                    <RefreshCcw className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                    Riwayat Transaksi
                                </h1>
                            </div>
                            <p className="text-slate-600 text-sm font-medium ml-15">
                                Pantau riwayat pembayaran air dan biaya pasang baru secara lengkap.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Panel */}
                <div className="md:col-span-1">
                    <div className="bg-white border border-indigo-100 shadow-sm rounded-2xl p-4 flex items-center justify-between relative overflow-hidden h-full">
                        <div className="absolute right-0 top-0 h-full w-20 bg-indigo-50/50 -skew-x-12 transform translate-x-8"></div>

                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Total {activeTab === 'water' ? 'Pembayaran Air' : 'Pembayaran SR'}
                            </p>
                            <div className="text-2xl font-black text-indigo-700">
                                {formatRupiah(currentSummary.total_amount)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {currentSummary.count} transaksi
                            </p>
                        </div>

                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 relative z-10 shadow-sm">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TOOLBAR */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center shrink-0">

                {/* Tab Navigation */}
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full xl:w-auto">
                    <button
                        onClick={() => setActiveTab('water')}
                        className={cn(
                            "flex-1 xl:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'water'
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:bg-slate-200/50'
                        )}
                    >
                        <Droplets className="h-4 w-4" />
                        Pembayaran Air
                    </button>
                    <button
                        onClick={() => setActiveTab('installation')}
                        className={cn(
                            "flex-1 xl:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'installation'
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:bg-slate-200/50'
                        )}
                    >
                        <Home className="h-4 w-4" />
                        Pembayaran SR
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">

                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 w-full md:w-auto">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <Label htmlFor="start-date-input" className="sr-only">Tanggal Mulai</Label>
                        <input
                            id="start-date-input"
                            name="start-date"
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none w-24"
                        />
                        <span className="text-slate-300">-</span>
                        <Label htmlFor="end-date-input" className="sr-only">Tanggal Selesai</Label>
                        <input
                            id="end-date-input"
                            name="end-date"
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none w-24"
                        />
                    </div>

                    {/* Method Filter */}
                    <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setMethodFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all",
                                methodFilter === 'all' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                            )}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setMethodFilter('cash')}
                            className={cn(
                                "px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all",
                                methodFilter === 'cash' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                            )}
                        >
                            Tunai
                        </button>
                        <button
                            onClick={() => setMethodFilter('transfer')}
                            className={cn(
                                "px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all",
                                methodFilter === 'transfer' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                            )}
                        >
                            Transfer
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Label htmlFor="history-search-input" className="sr-only">Cari Riwayat</Label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            id="history-search-input"
                            name="history-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari Nama / ID..."
                            className="pl-9 pr-4 h-10 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Export */}
                    <button className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors" title="Export CSV">
                        <Download className="h-4 w-4" />
                    </button>

                </div>
            </div>

            {/* 3. DATA TABLE */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px] md:min-h-0">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    {activeTab === 'water' ? (
                        <WaterBillTable
                            transactions={waterTransactions}
                            loading={loading}
                            expandedRows={expandedRows}
                            toggleRow={toggleRow}
                            onDelete={(id) => confirmDelete(id, 'water')}
                            formatRupiah={formatRupiah}
                            formatDate={formatDate}
                            formatTime={formatTime}
                        />
                    ) : (
                        <InstallationTable
                            payments={installationPayments}
                            loading={loading}
                            onDelete={(id) => confirmDelete(id, 'installation')}
                            formatRupiah={formatRupiah}
                            formatDate={formatDate}
                            formatTime={formatTime}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                    <span>Menampilkan {activeTab === 'water' ? waterTransactions.length : installationPayments.length} baris</span>
                    <span>Data Real-time</span>
                </div>
            </div>

            {/* DELETE CONFIRMATION DIALOG */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan <b>membatalkan status pembayaran</b> (menjadi belum lunas) dan <b>mengembalikan saldo pelanggan</b> jika ada.
                            <br /><br />
                            Data yang dihapus tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            {isDeleting ? "Menghapus..." : "Hapus Transaksi"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ============================================
// WATER BILL TABLE COMPONENT
// ============================================

function WaterBillTable({
    transactions,
    loading,
    expandedRows,
    toggleRow,
    onDelete,
    formatRupiah,
    formatDate,
    formatTime
}: {
    transactions: WaterBillTransaction[];
    loading: boolean;
    expandedRows: Set<number>;
    toggleRow: (id: number) => void;
    onDelete: (id: number) => void;
    formatRupiah: (n: number) => string;
    formatDate: (s: string) => string;
    formatTime: (s: string) => string;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-medium text-slate-400">Memuat data pembayaran air...</p>
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                        <Filter className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-600">Tidak ada pembayaran air</p>
                    <p className="text-sm text-slate-400">Coba ubah filter tanggal atau kata kunci pencarian.</p>
                </div>
            </div>
        );
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                    <Fragment key={tx.id}>
                        <tr className="hover:bg-indigo-50/30 transition-colors group">
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">{formatDate(tx.created_at)}</span>
                                    <span className="text-xs text-slate-400 font-mono mt-0.5">{formatTime(tx.created_at)}</span>
                                    <span className="text-[10px] text-slate-300 font-mono mt-1">#{tx.id}</span>
                                </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex flex-col max-w-[200px]">
                                    <span className="text-sm font-semibold text-slate-700 truncate">{tx.customer_name}</span>
                                    <span className="text-xs text-slate-500 truncate">{tx.customer_address}</span>
                                </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="text-xs text-slate-600">
                                    {tx.allocation_details.length > 0 ? (
                                        <span className="font-medium">{tx.allocation_details.length} bulan dibayar</span>
                                    ) : (
                                        <span className="text-slate-400 italic">Tidak ada detail</span>
                                    )}
                                </div>
                                {(tx.applied_credit > 0 || tx.new_credit > 0) && (
                                    <div className="flex gap-2 mt-1">
                                        {tx.applied_credit > 0 && (
                                            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">
                                                Kredit: {formatRupiah(tx.applied_credit)}
                                            </span>
                                        )}
                                        {tx.new_credit > 0 && (
                                            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">
                                                Sisa: {formatRupiah(tx.new_credit)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 align-top">
                                <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase",
                                    tx.method === 'cash'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-blue-100 text-blue-700'
                                )}>
                                    {tx.method === 'cash' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                                    {tx.method === 'cash' ? 'Tunai' : 'Transfer'}
                                </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-right align-top">
                                <span className="text-lg font-black text-emerald-600 tracking-tight">
                                    {formatRupiah(tx.total_amount)}
                                </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex items-center gap-2">
                                    {tx.allocation_details.length > 0 && (
                                        <button
                                            onClick={() => toggleRow(tx.id)}
                                            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Lihat Detail"
                                        >
                                            {expandedRows.has(tx.id) ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.open(`/print/${tx.id}?format=thermal58`, '_blank')}
                                        className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Cetak Struk"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(tx.id)}
                                        className="p-2 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Hapus Transaksi"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {expandedRows.has(tx.id) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 bg-slate-50/50">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Rincian Pembayaran:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {tx.allocation_details.map((detail: AllocationDetail, idx: number) => (
                                                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">
                                                            {detail.year && detail.month ? format(new Date(detail.year, detail.month - 1), 'MMMM yyyy', { locale: id }) : 'Transaksi Lainnya'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">Record #{detail.record_id}</p>
                                                    </div>
                                                    <span className="text-sm font-black text-indigo-600">
                                                        {formatRupiah(detail.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </Fragment>
                ))}
            </tbody>
        </table>
    );
}

// ============================================
// INSTALLATION TABLE COMPONENT
// ============================================

function InstallationTable({
    payments,
    loading,
    onDelete,
    formatRupiah,
    formatDate,
    formatTime
}: {
    payments: InstallationPayment[];
    loading: boolean;
    onDelete: (id: number) => void;
    formatRupiah: (n: number) => string;
    formatDate: (s: string) => string;
    formatTime: (s: string) => string;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-medium text-slate-400">Memuat data pembayaran SR...</p>
                </div>
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                        <Filter className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-600">Tidak ada pembayaran SR</p>
                    <p className="text-sm text-slate-400">Coba ubah filter tanggal atau kata kunci pencarian.</p>
                </div>
            </div>
        );
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cicilan</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Sisa</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => {
                    const progress = payment.total_fee > 0 ? (payment.paid_amount / payment.total_fee) * 100 : 0;

                    return (
                        <tr key={payment.id} className="hover:bg-indigo-50/30 transition-colors group">
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">{formatDate(payment.payment_date)}</span>
                                    <span className="text-xs text-slate-400 font-mono mt-0.5">{formatTime(payment.payment_date)}</span>
                                    <span className="text-[10px] text-slate-300 font-mono mt-1">#{payment.id}</span>
                                </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex flex-col max-w-[200px]">
                                    <span className="text-sm font-semibold text-slate-700 truncate">{payment.customer_name}</span>
                                    <span className="text-xs text-slate-500 truncate">{payment.customer_address}</span>
                                </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-indigo-600">{formatRupiah(payment.amount)}</span>
                                    <span className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit mt-1",
                                        payment.method === 'cash'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-blue-100 text-blue-700'
                                    )}>
                                        {payment.method === 'cash' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                                        {payment.method === 'cash' ? 'Tunai' : 'Transfer'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex flex-col gap-2">
                                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        {formatRupiah(payment.paid_amount)} / {formatRupiah(payment.total_fee)}
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <span className={cn(
                                    "inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase",
                                    payment.status === 'paid' && 'bg-green-100 text-green-700',
                                    payment.status === 'partial' && 'bg-amber-100 text-amber-700',
                                    payment.status === 'pending' && 'bg-slate-100 text-slate-600'
                                )}>
                                    {payment.status === 'paid' ? 'Lunas' : payment.status === 'partial' ? 'Cicilan' : 'Pending'}
                                </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-right align-top">
                                <span className="text-lg font-black text-slate-700 tracking-tight">
                                    {formatRupiah(payment.remaining_amount)}
                                </span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 align-top">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.open(`/print-sr/${payment.id}`, '_blank')}
                                        className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Cetak Kwitansi"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(payment.id)}
                                        className="p-2 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Hapus Pembayaran"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
