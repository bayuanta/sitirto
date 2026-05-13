'use client';

import { useState, useEffect } from "react";
import { Search, Loader2, X, AlertCircle, CheckCircle2, CreditCard, ArrowRight, Phone, History, Info, Wallet, Smartphone } from "lucide-react";
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

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
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
                {/* Search Card */}
                <section className="space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
                        <h2 className="text-xl font-bold mb-1">Cek Tagihan Air</h2>
                        <p className="text-slate-500 text-sm mb-6">Masukkan nomor sambungan rumah Anda</p>
                        
                        <form onSubmit={handleCheck} className="space-y-4">
                            <div className="relative">
                                <Input
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
                                    <h3 className="font-bold flex items-center gap-2">
                                        Rincian Tagihan 
                                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{result.unpaidBills.length}</span>
                                    </h3>
                                    {result.unpaidBills.length > 0 && (
                                        <p className="text-xs text-blue-600 font-bold">Belum Terbayar</p>
                                    )}
                                </div>

                                {result.unpaidBills.length > 0 ? (
                                    <div className="space-y-3">
                                        {result.unpaidBills.map((bill, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                        <History className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{bill.period}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">Pemakaian: {bill.usage} m³</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-red-500">{formatPrice(bill.amount)}</p>
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

                            {/* Total & Action */}
                            {result.unpaidBills.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-blue-500/10 border-2 border-blue-50 space-y-6"
                                >
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Bayar</p>
                                            <p className="text-3xl font-black text-slate-900 leading-none">{formatPrice(result.totalAmount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode</p>
                                            <p className="text-sm font-bold text-blue-600 flex items-center gap-1">Online <CreditCard className="w-3 h-3" /></p>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={() => setIsPaymentMockupOpen(true)}
                                        className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold transition-all active:scale-95 shadow-xl shadow-slate-200"
                                    >
                                        Bayar Sekarang
                                    </Button>
                                    
                                    <p className="text-[10px] text-center text-slate-400 px-4">
                                        <Info className="w-3 h-3 inline mr-1" /> Pembayaran akan diproses secara otomatis dan status tagihan langsung berubah menjadi lunas.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

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
                                            < smartphone className="w-6 h-6 text-blue-600" />
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
                <div className="flex flex-col items-center gap-1 text-blue-600">
                    <History className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Cek Tagihan</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-400">
                    <History className="w-6 h-6 opacity-50" />
                    <span className="text-[10px] font-bold">Riwayat Saya</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Phone className="w-6 h-6 opacity-50" />
                    <span className="text-[10px] font-bold">Bantuan</span>
                </div>
            </div>
        </div>
    );
}
