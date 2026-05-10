"use client";

import { useState } from "react";
import { Search, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { checkBill, type BillDetails } from "@/app/landing-actions";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BillChecker() {
    const [isOpen, setIsOpen] = useState(false);
    const [connNumber, setConnNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BillDetails | null>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connNumber.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        // Open modal immediately to show loading state if not already open
        if (!isOpen) setIsOpen(true);

        const res = await checkBill(connNumber);

        if (res.success && res.data) {
            setResult(res.data);
        } else {
            setError(res.error || "Terjadi kesalahan.");
        }
        setLoading(false);
    };

    const reset = () => {
        setResult(null);
        setError(null);
        setConnNumber("");
        setIsOpen(false);
    };

    return (
        <>
            {/* Input Form (Always Visible or in Hero) */}
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl flex gap-2">
                <Input
                    id="bill-conn-number"
                    name="bill-conn-number"
                    placeholder="Masukkan Nomor Pelanggan (Contoh: SR-001)"
                    className="bg-white/90 border-transparent focus:bg-white h-12 text-slate-800 placeholder:text-slate-400"
                    value={connNumber}
                    onChange={(e) => setConnNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheck(e)}
                />
                <Button
                    onClick={handleCheck}
                    disabled={loading}
                    className="h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cek"}
                </Button>
            </div>

            {/* Result Modal / Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={reset}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900">Info Tagihan Air</h3>
                                <button onClick={reset} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                                        <p>Sedang mencari data...</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                            <AlertCircle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-2">Data Tidak Ditemukan</h4>
                                        <p className="text-slate-500 max-w-xs">{error}</p>
                                        <Button onClick={() => setError(null)} variant="outline" className="mt-6">Coba Lagi</Button>
                                    </div>
                                ) : result ? (
                                    <div className="space-y-6">
                                        {/* Customer Info */}
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Pelanggan</p>
                                                    <p className="font-bold text-slate-900 text-base">{result.customerName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">No. Sambungan</p>
                                                    <p className="font-mono font-bold text-slate-900 text-base">{result.customerNumber}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Alamat</p>
                                                    <p className="text-slate-700 font-medium">{result.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bills List */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                Rincian Tagihan
                                                {result.unpaidBills.length === 0 && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Lunas</Badge>}
                                            </h4>

                                            {result.unpaidBills.length > 0 ? (
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {result.unpaidBills.map((bill, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors bg-white">
                                                            <div>
                                                                <p className="font-bold text-slate-800">{bill.period}</p>
                                                                <p className="text-xs text-slate-500">Pemakaian: {bill.usage} m³</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-red-600">
                                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(bill.amount)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                                                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                                    <p className="text-slate-900 font-medium">Tidak ada tagihan tertunggak.</p>
                                                    <p className="text-slate-500 text-xs">Terima kasih sudah membayar tepat waktu.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Total */}
                                        {result.unpaidBills.length > 0 && (
                                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                                <p className="text-slate-500 font-medium">Total Tagihan</p>
                                                <p className="text-2xl font-black text-slate-900">
                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(result.totalAmount)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
