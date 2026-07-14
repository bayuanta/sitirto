"use client";

import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Loader2,
    Banknote,
    CreditCard,
    Receipt,
    CheckCircle2,
    User,
    Wallet,
    Store,
    ArrowLeft,
    AlertCircle,
    X
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast"; // Disabling broken import
import { cn } from "@/lib/utils";
import { searchCustomers, getUnpaidBills, processPayment, getTodayStats, getAreas } from './actions';

// --- TYPES ---
type Area = {
    id: number;
    name: string;
};

type Customer = {
    id: number;
    nama: string;
    alamat: string;
    no_pelanggan: string;
    credit_balance: number;
    wilayah: string;
};

// Aligning with 'actions.ts' Bill type
type Bill = {
    id: number;
    month: number;
    year: number;
    meter_last: number;
    meter_current: number;
    usage: number;
    water_cost: number;
    maintenance_snapshot: number;
    rate_snapshot: number;
    bill_amount: number;
    paid_amount: number;
    remaining: number;
    status: string;
};

type PaymentMethod = 'cash' | 'transfer';

export default function PembayaranPage() {
    // const { toast } = useToast();

    // --- STATE: GLOBAL ---
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [stats, setStats] = useState({ transaction_count: 0, total_cash: 0, total_transfer: 0 }); // Updated to match TodayStats

    // --- STATE: AREA FILTERING ---
    const [areas, setAreas] = useState<Area[]>([]);
    const [selectedArea, setSelectedArea] = useState<number | 'all'>('all');

    // --- STATE: SEARCH MODE ---
    const [searchTerm, setSearchTerm] = useState('');

    // --- STATE: TRANSACTION MODE ---
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
    const [loadingBills, setLoadingBills] = useState(false);
    const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);

    // --- STATE: PAYMENT PANEL ---
    const [cashAmount, setCashAmount] = useState('');
    const [useDeposit, setUseDeposit] = useState(false);
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [processing, setProcessing] = useState(false);

    // --- INITIAL LOAD ---
    useEffect(() => {
        // Initial load for stats and areas
        loadStats();
        loadAreas();
    }, []);

    // Effect to auto-search when typing OR changing area
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Search if term exists OR area is selected (if 'all' and no term, we might wait for typing, or show all? Let's show all if needed)
            // If user selects an area, usually they expect to see customers there. 
            // So if selectedArea != 'all', we search.
            if (searchTerm || selectedArea !== 'all') {
                refreshData(searchTerm, selectedArea);
            } else {
                setCustomers([]); // Clear if empty and no filter
                setLoadingCustomers(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedArea]);

    const loadAreas = async () => {
        try {
            const data = await getAreas();
            setAreas(data);
        } catch (error) {
            console.error("Failed to load areas", error);
        }
    };

    const refreshData = async (query = '', area: number | 'all' = 'all') => {
        setLoadingCustomers(true);
        try {
            // Using searchCustomers directly instead of fetching all
            const data = await searchCustomers(query, area);
            setCustomers(data);
        } catch (error) {
            console.error("Error loading customers", error);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await getTodayStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats", error);
        }
    };

    // --- SEARCH LOGIC ---
    // Removed filteredCustomers useMemo as search is now handled by refreshData

    // --- TRANSACTION LOGIC ---
    const handleSelectCustomer = async (customer: Customer) => {
        setSelectedCustomer(customer);
        setLoadingBills(true);
        setUnpaidBills([]);
        setSelectedBillIds([]); // Reset selection
        setCashAmount(''); // Reset input
        setUseDeposit(false);

        try {
            const bills = await getUnpaidBills(customer.id);
            setUnpaidBills(bills);
            // Auto select disabled per user request
            // setSelectedBillIds(bills.map(b => b.id)); 
        } catch (error) {
            console.error("Gagal memuat tagihan", error);
        } finally {
            setLoadingBills(false);
        }
    };

    const handleBackToSearch = () => {
        setSelectedCustomer(null);
        setUnpaidBills([]);
        loadStats(); // Refresh stats when returning to dashboard
        setSearchTerm(''); // Clear search term
        setCustomers([]); // Clear customer list
    };

    const handleBillToggle = (id: number) => {
        setSelectedBillIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // --- CALCULATION LOGIC ---
    const totalSelected = useMemo(() => {
        return unpaidBills
            .filter(b => selectedBillIds.includes(b.id))
            .reduce((sum, b) => sum + b.remaining, 0); // Use .remaining for logic check, though bill_amount is fine if unpaid
    }, [unpaidBills, selectedBillIds]);

    const depositUsedAmount = useSelectedDepositAmount();

    function useSelectedDepositAmount() {
        if (!selectedCustomer || !useDeposit) return 0;
        // Gunakan deposit maksimal sebesar total tagihan atau sisa saldo
        return Math.min(selectedCustomer.credit_balance, totalSelected);
    }

    const remainingToPay = Math.max(0, totalSelected - depositUsedAmount);

    // Parse cash amount safely
    const cashNum = parseFloat(cashAmount) || 0;
    const change = cashNum - remainingToPay;
    const isEnough = cashNum >= remainingToPay;

    // --- ACTION LOGIC ---
    const handleSubmitPayment = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        
        if (!selectedCustomer) return;
        if (selectedBillIds.length === 0) {
            alert("Silakan pilih minimal satu tagihan untuk dibayar.");
            return;
        }

        // Use the typed amount for both methods
        const finalAmount = cashNum;
        
        if (finalAmount <= 0 && !useDeposit) {
            alert("Jumlah pembayaran tidak valid. Masukkan jumlah uang atau gunakan deposit.");
            return;
        }

        setProcessing(true);
        try {
            // Correct argument passing
            const result = await processPayment(
                selectedCustomer.id,
                selectedBillIds,
                finalAmount,
                method,
                "Pembayaran via Web Admin",
                useDeposit
            );

            if (result.success) {
                const totalPaidFormatted = formatCurrency(method === 'cash' ? cashNum : remainingToPay);
                if (confirm(`Pembayaran Berhasil!\nApakah Anda ingin mencetak struk sekarang?`)) {
                    window.open(`/print/${result.txId}?format=thermal58`, '_blank');
                }

                // Update local constraints
                loadStats();

                // Refresh list if needed or go back
                // Just clear selection and reload bills
                const remainingBills = await getUnpaidBills(selectedCustomer.id);
                if (remainingBills.length > 0) {
                    setUnpaidBills(remainingBills);
                    setSelectedBillIds(remainingBills.map(b => b.id));
                    setCashAmount('');

                    // We need to re-fetch customer credit balance to update the UI
                    // A simple hack: just deduct visually or refetch customer (search again)
                    // Let's refetch single customer details if we had that action, or just search again
                    const updatedSearch = await searchCustomers(selectedCustomer.nama);
                    const updatedCust = updatedSearch.find(c => c.id === selectedCustomer.id);
                    if (updatedCust) setSelectedCustomer(updatedCust);

                } else {
                    handleBackToSearch();
                }
            } else {
                alert(`Gagal: ${result.error}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan sistem.");
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    // --- HELPERS ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getMonthName = (month: number) => {
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        return months[month - 1] || "";
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col h-auto md:h-[calc(100vh-10rem)] w-full gap-4 pb-10 md:pb-0">
            {/* Note: Removed fixed positioning to respect Master Layout */}

            <div className="flex-1 grid grid-cols-12 gap-4 h-full min-h-0">
                {/* =========================================================================================
                LEFT COLUMN (60%) - MAIN CONTENT
                SWITCHES: SEARCH LIST <-> BILL TABLE
               ========================================================================================= */}
                <div className="col-span-12 md:col-span-7 h-[500px] md:h-full flex flex-col min-h-0">
                    {!selectedCustomer ? (
                        // --- MODE 1: SEARCH & LIST ---
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
                            {/* SEARCH HEADER */}
                            <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                                <Label htmlFor="pembayaran-search" className="sr-only">Cari Pelanggan</Label>
                                <Search className="w-5 h-5 text-slate-400" />
                                <input
                                    id="pembayaran-search"
                                    name="pembayaran-search"
                                    type="text"
                                    placeholder="Cari pelanggan..."
                                    className="flex-1 h-9 text-base font-medium outline-none text-slate-700 placeholder:text-slate-300"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* FILTER WILAYAH - DROPDOWN (Fixed height to prevent CLS) */}
                            <div className="px-3 py-2 border-b border-slate-50 min-h-[53px] flex items-center">
                                {areas.length > 0 ? (
                                    <div className="relative w-full animate-in fade-in duration-300">
                                        <Label htmlFor="pembayaran-wilayah-filter" className="sr-only">Filter Wilayah</Label>
                                        <select
                                            id="pembayaran-wilayah-filter"
                                            name="pembayaran-wilayah-filter"
                                            value={selectedArea}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedArea(val === 'all' ? 'all' : Number(val));
                                            }}
                                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="all">Semua Wilayah</option>
                                            {areas.map(area => (
                                                <option key={area.id} value={area.id}>{area.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                            <ArrowLeft className="w-3.5 h-3.5 -rotate-90" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-9 bg-slate-100/50 animate-pulse rounded-lg" />
                                )}
                            </div>

                            {/* LIST CUSTOMER */}
                            <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200">
                                {loadingCustomers ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                        <p className="text-xs font-medium">Memuat data...</p>
                                    </div>
                                ) : customers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center p-6 opacity-50">
                                        <div className="bg-slate-50 p-3 rounded-full mb-3">
                                            <Search className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">
                                            {searchTerm ? "Data tidak ditemukan" : "Ketik nama/ID pelanggan"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {customers.map((c) => (
                                            <div
                                                key={c.id}
                                                onClick={() => handleSelectCustomer(c)}
                                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                            {c.nama.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{c.nama}</h4>
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">{c.no_pelanggan}</span>
                                                                {c.wilayah && <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{c.wilayah}</span>}
                                                                <span className="truncate max-w-[150px]">{c.alamat || "-"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {c.credit_balance > 0 && (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 flex gap-1 items-center mb-1 text-[10px] px-1.5 h-5">
                                                                <Wallet className="w-3 h-3" />
                                                                {formatCurrency(c.credit_balance)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* FOOTER LIST */}
                            <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-center text-slate-400 font-medium h-8 flex items-center justify-center">
                                Result: {customers.length}
                            </div>
                        </div>
                    ) : (
                        // --- MODE 2: TRANSACTION TABLE ---
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden animate-in fade-in duration-500 relative">
                            {/* HEADER BACK */}
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white z-10 h-16 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleBackToSearch}
                                        className="rounded-full hover:bg-slate-100 -ml-2 w-8 h-8"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                                    </Button>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight">{selectedCustomer.nama}</h3>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                            <span className="bg-indigo-50 text-indigo-700 px-1.5 rounded">{selectedCustomer.wilayah}</span>
                                            <span className="truncate max-w-[200px]">{selectedCustomer.alamat}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID PELANGGAN</p>
                                    <p className="font-mono font-bold text-slate-600 text-sm">{selectedCustomer.no_pelanggan}</p>
                                </div>
                            </div>

                            {/* BILL TABLE LIST */}
                            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                                {loadingBills ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
                                        <p className="text-slate-500 font-medium animate-pulse">Memuat tagihan...</p>
                                    </div>
                                ) : unpaidBills.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-60">
                                        <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800">Tidak Ada Tagihan</h4>
                                        <p className="text-slate-500">Pelanggan ini tidak memiliki tagihan tertunggak.</p>
                                        <Button variant="outline" className="mt-4" onClick={handleBackToSearch}>Kembali</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pb-24 md:pb-0">
                                        {/* PB-24 for mobile scrolling clearance if needed, though split view should handle it */}

                                        {/* SELECT ALL HEADER */}
                                        <div className="flex items-center justify-between px-2 pb-1">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="select-all"
                                                    checked={selectedBillIds.length === unpaidBills.length && unpaidBills.length > 0}
                                                    onCheckedChange={(c) => {
                                                        if (c) setSelectedBillIds(unpaidBills.map(b => b.id));
                                                        else setSelectedBillIds([]);
                                                    }}
                                                    className="border-slate-300 data-[state=checked]:bg-indigo-600 w-4 h-4"
                                                />
                                                <label htmlFor="select-all" className="text-[11px] font-bold text-slate-500 cursor-pointer">
                                                    Pilih Semua ({unpaidBills.length})
                                                </label>
                                            </div>
                                        </div>

                                        {unpaidBills.map((bill) => {
                                            const isSelected = selectedBillIds.includes(bill.id);
                                            return (
                                                <div
                                                    key={bill.id}
                                                    onClick={() => handleBillToggle(bill.id)}
                                                    className={cn(
                                                        "bg-white border rounded-xl p-0 overflow-hidden transition-all shadow-sm hover:shadow-md cursor-pointer group",
                                                        isSelected ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-indigo-200"
                                                    )}
                                                >
                                                    <div className="flex">
                                                        {/* LEFT STRIP */}
                                                        <div className={cn(
                                                            "w-1",
                                                            isSelected ? "bg-indigo-500" : "bg-transparent group-hover:bg-indigo-200"
                                                        )} />

                                                        {/* CONTENT */}
                                                        <div className="flex-1 px-3 py-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">

                                                            {/* CHECKBOX & MONTH */}
                                                            <div className="flex items-center gap-3 min-w-[120px]">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => handleBillToggle(bill.id)}
                                                                    className="border-slate-300 data-[state=checked]:bg-indigo-600 w-4 h-4"
                                                                />
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-tight">
                                                                        {getMonthName(bill.month)} <span className="font-normal text-slate-500">{bill.year}</span>
                                                                    </h4>
                                                                    <Badge variant="secondary" className="text-[9px] md:text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 h-4 mt-0.5">
                                                                        {bill.usage} m³
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-row items-center justify-between md:contents gap-2 border-t md:border-0 pt-2 md:pt-0">
                                                                {/* METER READINGS */}
                                                                <div className="flex flex-col items-start min-w-[70px]">
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Meter</span>
                                                                    <div className="text-[10px] md:text-[11px] font-mono text-slate-700 flex items-center gap-1">
                                                                        <span>{bill.meter_last}</span>
                                                                        <ArrowLeft className="w-2.5 h-2.5 text-slate-300 rotate-180" />
                                                                        <span className="font-bold text-slate-900">{bill.meter_current}</span>
                                                                    </div>
                                                                </div>

                                                                {/* DETAILS - HIDDEN ON MOBILE */}
                                                                <div className="hidden md:flex flex-1 flex-col gap-0.5 text-[10px] text-slate-600">
                                                                    <div className="flex justify-between w-full max-w-[160px]">
                                                                        <span>Air:</span>
                                                                        <span className="font-medium">{formatCurrency(bill.water_cost)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between w-full max-w-[160px]">
                                                                        <span>Beban:</span>
                                                                        <span className="font-medium">{formatCurrency(bill.maintenance_snapshot)}</span>
                                                                    </div>
                                                                </div>

                                                                {/* AMOUNT */}
                                                                <div className="text-right min-w-[90px]">
                                                                    <p className="text-sm md:text-base font-black text-emerald-600 font-mono tracking-tight">
                                                                        {formatCurrency(bill.remaining)}
                                                                    </p>
                                                                    {bill.status === 'partial' && (
                                                                        <p className="text-[8px] md:text-[9px] text-amber-500 font-bold">SISA</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* =========================================================================================
                RIGHT COLUMN (40%) - SECONDARY AREA
                SWITCHES: DASHBOARD <-> PAYMENT PANEL
               ========================================================================================= */}
                <div className="col-span-12 md:col-span-5 h-auto md:h-full flex flex-col min-h-0">
                    {!selectedCustomer ? (
                        // --- MODE 1: DASHBOARD STATS ---
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center p-6 h-full text-center space-y-4 animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner">
                                <Store className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-800">Selamat Datang, Admin!</h2>
                                <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                                    Siap melayani pembayaran? Pilih pelanggan di sebelah kiri untuk memulai transaksi.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-6">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Transaksi Hari Ini</p>
                                    <p className="text-xl font-black text-slate-800 mt-0.5">{stats.transaction_count}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Masuk</p>
                                    <p className="text-base font-black text-emerald-600 mt-0.5 truncate" title={formatCurrency(stats.total_cash + stats.total_transfer)}>
                                        {new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short", style: "currency", currency: "IDR" }).format(stats.total_cash + stats.total_transfer)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- MODE 2: PAYMENT EXECUTION PANEL ---
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden animate-in fade-in duration-500 relative ring-1 ring-slate-200">
                            {/* HEADER: DEPOSIT INFO (TIDIED UP) */}
                            <div className="bg-indigo-600 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
                                <div className="flex items-center gap-2 text-indigo-100">
                                    <div className="p-1 bg-white/10 rounded-lg">
                                        <Wallet className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-black text-[10px] uppercase tracking-widest">Saldo Deposit</span>
                                </div>
                                <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                    <span className="font-mono font-black text-white text-sm">
                                        {formatCurrency(selectedCustomer.credit_balance)}
                                    </span>
                                </div>
                            </div>
                            {/* BODY: SCROLLABLE IF NEEDED */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">                                {/* SUMMARY CARD (TOTAL TAGIHAN) */}
                                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
                                                {formatCurrency(totalSelected)}
                                            </h4>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                            <Receipt className="w-5 h-5 text-indigo-500" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-3 border-t border-slate-100">
                                        <span>Jumlah Item</span>
                                        <span className="bg-slate-200 px-2 py-0.5 rounded-full text-slate-700">{selectedBillIds.length} Tagihan</span>
                                    </div>

                                    {useDeposit && depositUsedAmount > 0 && (
                                        <div className="mt-2 flex justify-between items-center text-[11px] font-bold text-indigo-600">
                                            <span>Potongan Deposit</span>
                                            <span>-{formatCurrency(depositUsedAmount)}</span>
                                        </div>
                                    )}
                                </div>


                                {/* PAYMENT INPUTS */}
                                <div className="space-y-4">
                                    {/* DEPOSIT TOGGLE */}
                                    {selectedCustomer.credit_balance > 0 && (
                                        <div
                                            onClick={() => setUseDeposit(!useDeposit)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none",
                                                useDeposit ? "bg-indigo-50 border-indigo-500 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <Checkbox checked={useDeposit} onCheckedChange={(c) => setUseDeposit(!!c)} className="border-slate-300 data-[state=checked]:bg-indigo-600 w-5 h-5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-slate-700">Gunakan Deposit</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Otomatis potong saldo deposit</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* CASH INPUT */}
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 shadow-inner">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label htmlFor="payment_cash_amount" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Jumlah {method === 'cash' ? 'Uang Tunai' : 'Transfer'}
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() => setCashAmount(remainingToPay.toString())}
                                                className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-all uppercase"
                                            >
                                                {method === 'cash' ? 'Uang Pas' : 'Sesuai Tagihan'}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                                            <Input
                                                id="payment_cash_amount"
                                                name="payment_cash_amount"
                                                type="number"
                                                value={cashAmount}
                                                onChange={(e) => setCashAmount(e.target.value)}
                                                placeholder="0"
                                                className="h-12 pl-10 text-xl font-black text-slate-900 bg-white border-0 focus:ring-2 focus:ring-indigo-500 rounded-xl shadow-sm"
                                                autoComplete="off"
                                            />
                                        </div>

                                        {/* CHANGE DISPLAY */}
                                        {cashNum > 0 && (
                                            <div className="mt-3 flex justify-between items-center px-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {change > 0 
                                                        ? "LEBIH BAYAR (DEPOSIT)" 
                                                        : (change === 0 ? (method === 'cash' ? "UANG PAS" : "PAS") : "SISA KURANG")}
                                                </span>
                                                <span className={cn(
                                                    "font-mono font-black text-sm",
                                                    change > 0 ? "text-indigo-600" : (change === 0 ? "text-emerald-600" : "text-rose-500")
                                                )}>
                                                    {formatCurrency(Math.abs(change))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                                {/* METHOD TOGGLE */}
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl relative z-30">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setMethod('cash');
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-2 h-11 rounded-xl text-[11px] font-black transition-all active:scale-95",
                                            method === 'cash' 
                                                ? "bg-white text-indigo-700 shadow-md ring-1 ring-black/5" 
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <Banknote className="w-4 h-4" /> TUNAI
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setMethod('transfer');
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-2 h-11 rounded-xl text-[11px] font-black transition-all active:scale-95",
                                            method === 'transfer' 
                                                ? "bg-white text-indigo-700 shadow-md ring-1 ring-black/5" 
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <CreditCard className="w-4 h-4" /> TRANSFER
                                    </button>
                                </div>

                                <Button
                                    type="button"
                                    size="lg"
                                    className="w-full h-14 text-sm font-black tracking-widest shadow-2xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 rounded-2xl active:scale-[0.97] transition-all gap-3 relative z-30"
                                    onClick={(e) => handleSubmitPayment(e)}
                                    disabled={processing || selectedBillIds.length === 0 || (method === 'cash' && cashNum <= 0 && !useDeposit)}
                                >
                                    {processing ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>MEMPROSES...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Receipt className="w-6 h-6" />
                                            PROSES BAYAR
                                        </>
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
