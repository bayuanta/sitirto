'use client';

import { useState, useEffect } from "react";
import { Search, Loader2, X, AlertCircle, CheckCircle2, CreditCard, ArrowRight, Phone, History, Info, Wallet, Smartphone, Printer } from "lucide-react";
import { checkBill, type BillDetails } from "@/app/landing-actions";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function MobileCekTagihan() {
    const [connNumber, setConnNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BillDetails | null>(null);
    const [isPaymentMockupOpen, setIsPaymentMockupOpen] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [selectedBills, setSelectedBills] = useState<number[]>([]);
    const [paymentMode, setPaymentMode] = useState<'total' | 'partial'>('total');
    const [partialAmount, setPartialAmount] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'cek' | 'riwayat' | 'bantuan'>('cek');
    const [selectedHistoryYear, setSelectedHistoryYear] = useState<string>("Semua");

    // Load saved connection number on mount
    useEffect(() => {
        const saved = localStorage.getItem("saved_connection_number");
        if (saved) {
            setConnNumber(saved);
            setRememberMe(true);
        }
    }, []);

    const handleCheck = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!connNumber.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        // Save if remember me is checked
        if (rememberMe) {
            localStorage.setItem("saved_connection_number", connNumber);
        } else {
            localStorage.removeItem("saved_connection_number");
        }

        const res = await checkBill(connNumber);

        if (res.success && res.data) {
            setResult(res.data);
        } else {
            setError(res.error || "Nomor pelanggan tidak ditemukan.");
        }
        setLoading(false);
    };

    // Reset selection when new data is loaded
    useEffect(() => {
        if (result && result.unpaidBills.length > 0) {
            setSelectedBills(result.unpaidBills.map((_, i) => i));
            setPaymentMode('total');
        }
    }, [result]);

    const toggleBillSelection = (index: number) => {
        setSelectedBills(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
        setPaymentMode('total');
    };

    const calculateSelectedTotal = () => {
        if (!result) return 0;
        return result.unpaidBills
            .filter((_, idx) => selectedBills.includes(idx))
            .reduce((sum, bill) => sum + bill.amount, 0);
    };

    const currentTotal = paymentMode === 'total' ? calculateSelectedTotal() : partialAmount;

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-48">
            {/* Header / Branding */}
            <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight leading-tight">PAMSIMAS</h1>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Tirtowening Portal</p>
                        </div>
                    </div>
                    <Link href="https://wa.me/6285867714590" target="_blank">
                        <Button variant="ghost" size="icon" className="rounded-full text-emerald-600 hover:bg-emerald-50">
                            <Phone className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-6 pt-8 space-y-8">
                {activeTab === 'cek' ? (
                    <>
                        {/* Search Card */}
                        <section className="space-y-4">
                            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
                                <h2 className="text-xl font-bold mb-1">Cek Tagihan Air</h2>
                                <p className="text-slate-500 text-sm mb-6">Masukkan nomor sambungan rumah Anda</p>
                                
                                <form onSubmit={(e) => handleCheck(e)} className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            id="connection-number"
                                            name="connection-number"
                                            value={connNumber}
                                            onChange={(e) => setConnNumber(e.target.value.toUpperCase())}
                                            placeholder="Contoh: SR-001"
                                            className="h-16 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-lg font-bold placeholder:font-normal placeholder:text-slate-400"
                                        />
                                        {connNumber && (
                                            <button 
                                                type="button"
                                                onClick={() => setConnNumber("")}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 px-1">
                                        <input 
                                            type="checkbox" 
                                            id="remember" 
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="remember" className="text-sm font-medium text-slate-600">Simpan nomor di HP ini</label>
                                    </div>

                                    <Button 
                                        type="submit"
                                        disabled={loading || !connNumber}
                                        className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Periksa Tagihan <ArrowRight className="w-5 h-5" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </section>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-red-50 border border-red-100 p-6 rounded-3xl flex flex-col items-center text-center gap-3"
                                >
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <p className="text-red-900 font-bold">{error}</p>
                                    <p className="text-red-600/70 text-xs">Pastikan nomor ID yang Anda masukkan sudah benar.</p>
                                </motion.div>
                            )}

                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6 pb-10"
                                >
                                    {/* Customer Info Card */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                                        <div className="relative z-10">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Nama Pelanggan</p>
                                            <h3 className="text-2xl font-black mb-4">{result.customerName}</h3>
                                            
                                            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">No. Sambungan</p>
                                                    <p className="font-mono font-bold text-blue-400">{result.customerNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                                                    {result.unpaidBills.length > 0 ? (
                                                        <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 border-amber-500/30">Ada Tagihan</Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">Lunas</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bills List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="font-bold flex items-center gap-2 text-slate-800">
                                                Pilih Tagihan 
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{result.unpaidBills.length}</span>
                                            </h3>
                                            <button 
                                                onClick={() => {
                                                    if (selectedBills.length === result.unpaidBills.length) setSelectedBills([]);
                                                    else setSelectedBills(result.unpaidBills.map((_, i) => i));
                                                }}
                                                className="text-xs text-blue-600 font-bold"
                                            >
                                                {selectedBills.length === result.unpaidBills.length ? "Hapus" : "Pilih Semua"}
                                            </button>
                                        </div>

                                        {result.unpaidBills.length > 0 ? (
                                            <div className="space-y-3">
                                                {result.unpaidBills.map((bill, idx) => (
                                                    <motion.div 
                                                        key={idx}
                                                        onClick={() => toggleBillSelection(idx)}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className={`p-5 rounded-3xl border transition-all flex justify-between items-center shadow-sm cursor-pointer active:scale-[0.98] ${
                                                            selectedBills.includes(idx) 
                                                                ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10" 
                                                                : "bg-white border-slate-100"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                                                selectedBills.includes(idx) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200"
                                                            }`}>
                                                                {selectedBills.includes(idx) && <CheckCircle2 className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <p className={`font-bold transition-colors ${selectedBills.includes(idx) ? "text-blue-900" : "text-slate-700"}`}>{bill.period}</p>
                                                                <p className="text-[10px] font-medium text-slate-400">Pemakaian: {bill.usage} m³</p>
                                                            </div>
                                                        </div>
                                                        <p className={`font-black transition-colors ${selectedBills.includes(idx) ? "text-blue-600" : "text-slate-400"}`}>
                                                            {formatPrice(bill.amount)}
                                                        </p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2rem] text-center">
                                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                                </div>
                                                <h4 className="text-xl font-bold text-emerald-900 mb-1">Tagihan Lunas</h4>
                                                <p className="text-emerald-600 text-sm">Terima kasih atas partisipasi Anda membayar tepat waktu.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Partial Payment Option */}
                                    {result.unpaidBills.length > 0 && (
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${paymentMode === 'partial' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                                                        <Wallet className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm">Bayar Nominal Lain?</h4>
                                                        <p className="text-[10px] text-slate-400">Gunakan jika ingin menyicil</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        if (paymentMode === 'partial') {
                                                            setPaymentMode('total');
                                                        } else {
                                                            setPaymentMode('partial');
                                                            setPartialAmount(calculateSelectedTotal());
                                                        }
                                                    }}
                                                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                                                        paymentMode === 'partial' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    {paymentMode === 'partial' ? "Aktif" : "Coba"}
                                                </button>
                                            </div>
                                            
                                            <AnimatePresence>
                                                {paymentMode === 'partial' && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pt-2 space-y-4">
                                                            <div className="relative">
                                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">Rp</span>
                                                                <Input 
                                                                    id="partial-amount"
                                                                    name="partial-amount"
                                                                    type="number"
                                                                    value={partialAmount || ""}
                                                                    onChange={(e) => setPartialAmount(Number(e.target.value))}
                                                                    className="h-16 pl-14 pr-6 rounded-2xl bg-slate-50 font-black text-xl border-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {[20000, 50000, 100000].map(val => (
                                                                    <button 
                                                                        key={val}
                                                                        onClick={() => setPartialAmount(val)}
                                                                        className="flex-1 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                                                                    >
                                                                        {val/1000}K
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : activeTab === 'riwayat' ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-bold">Riwayat Pembayaran</h2>
                                <History className="w-5 h-5 text-blue-600" />
                            </div>

                            {/* Year Filter Pills */}
                            {result && result.paidBills.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
                                    {["Semua", ...Array.from(new Set(result.paidBills.map(b => new Date(b.paidAt).getFullYear().toString()))).sort((a,b) => b.localeCompare(a))].map(year => (
                                        <button
                                            key={year}
                                            onClick={() => setSelectedHistoryYear(year)}
                                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
                                                selectedHistoryYear === year 
                                                    ? "bg-blue-600 text-white border-blue-600" 
                                                    : "bg-white text-slate-500 border-slate-100"
                                            }`}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!result ? (
                            <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                                <p className="text-slate-500 text-sm">Silakan cek tagihan Anda terlebih dahulu untuk melihat riwayat.</p>
                                <Button onClick={() => setActiveTab('cek')} variant="outline" className="rounded-xl">Cek Tagihan Sekarang</Button>
                            </div>
                        ) : result.paidBills.length === 0 ? (
                            <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <Search className="w-8 h-8" />
                                </div>
                                <p className="text-slate-500 text-sm">Belum ada riwayat pembayaran untuk nomor pelanggan ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-20">
                                {result.paidBills
                                    .filter(b => selectedHistoryYear === "Semua" || new Date(b.paidAt).getFullYear().toString() === selectedHistoryYear)
                                    .map((bill, idx) => (
                                    <motion.div 
                                        key={bill.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{bill.period}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(bill.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">LUNAS</Badge>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Bayar</p>
                                                <p className="font-black text-slate-900">{formatPrice(bill.amount)}</p>
                                            </div>
                                            <Button 
                                                onClick={() => window.open(`/print/${bill.id}?format=thermal`, '_blank')}
                                                size="sm" 
                                                className="bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-100 rounded-xl px-4 h-10 transition-all"
                                            >
                                                <Printer className="w-4 h-4 mr-2" /> Struk
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[2rem] text-center space-y-6 shadow-xl shadow-slate-200/50"
                    >
                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto text-emerald-600">
                            <Phone className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Butuh Bantuan?</h2>
                            <p className="text-slate-500 text-sm">Jika ada kendala pembayaran atau perbedaan data, silakan hubungi admin kami.</p>
                        </div>
                        <Link href="https://wa.me/6285867714590" target="_blank" className="block">
                            <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-200">
                                <Phone className="w-6 h-6" /> Hubungi via WhatsApp
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </main>

            {/* Sticky Bottom Total & Action */}
            <AnimatePresence>
                {activeTab === 'cek' && result && result.unpaidBills.length > 0 && (
                    <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-[76px] inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-6 z-40 max-w-lg mx-auto rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.1)]"
                    >
                        <div className="flex justify-between items-center gap-6">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    {paymentMode === 'total' ? `Bayar (${selectedBills.length} Bln)` : "Nominal Cicilan"}
                                </p>
                                <p className={`text-2xl font-black transition-all ${
                                    currentTotal > 0 ? "text-slate-900" : "text-slate-300"
                                }`}>
                                    {formatPrice(currentTotal)}
                                </p>
                            </div>
                            <Button 
                                onClick={() => setIsPaymentMockupOpen(true)}
                                disabled={currentTotal <= 0}
                                className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
                            >
                                Bayar
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Options Simulation Modal */}
            <AnimatePresence>
                {isPaymentMockupOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPaymentMockupOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden"></div>
                            
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">Pilih Pembayaran</h3>
                                <button onClick={() => setIsPaymentMockupOpen(false)} className="p-2 bg-slate-100 rounded-full">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 flex items-center justify-between group cursor-pointer hover:border-blue-500 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Smartphone className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold">QRIS (GoPay, OVO, Dana)</p>
                                            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Instan & Otomatis</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-blue-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-transparent flex items-center justify-between group cursor-pointer hover:border-blue-500 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Wallet className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Transfer Bank (VA)</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">BCA, Mandiri, BNI, BRI</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                                <p className="text-xs text-slate-400 mb-4 italic">Ini adalah simulasi tampilan Payment Gateway.</p>
                                <Button 
                                    onClick={() => setIsPaymentMockupOpen(false)}
                                    variant="outline" 
                                    className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-bold"
                                >
                                    Batalkan Pembayaran
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Nav Mock (Mobile App Feel) */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40 max-w-lg mx-auto sm:rounded-t-3xl sm:shadow-2xl">
                <button 
                    onClick={() => setActiveTab('cek')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'cek' ? "text-blue-600 scale-110" : "text-slate-400 opacity-60"}`}
                >
                    <Search className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Cek Tagihan</span>
                </button>
                <button 
                    onClick={() => setActiveTab('riwayat')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'riwayat' ? "text-blue-600 scale-110" : "text-slate-400 opacity-60"}`}
                >
                    <History className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Riwayat Saya</span>
                </button>
                <button 
                    onClick={() => setActiveTab('bantuan')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'bantuan' ? "text-blue-600 scale-110" : "text-slate-400 opacity-60"}`}
                >
                    <Phone className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Bantuan</span>
                </button>
            </div>
        </div>
    );
}
