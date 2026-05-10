"use client";

import { useEffect, useState } from "react";
import {
    Home,
    Store,
    Heart,
    Plus,
    Edit,
    Droplets,
    Coins,
    History,
    Loader2,
    CalendarClock,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getRates, updateRate, createRate, getRateHistory, deleteRate, type Rate, type RateHistory } from "./actions";

export default function RatesPage() {
    const [rates, setRates] = useState<Rate[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [rateHistory, setRateHistory] = useState<RateHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load Data
    const loadRates = async () => {
        setLoading(true);
        const data = await getRates();
        setRates(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRates();
    }, []);

    // Format IDR
    const formatIDR = (val: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

    // Handle Submit (Create/Edit)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        let res;
        if (isEditMode && selectedRate) {
            formData.append("id", selectedRate.id.toString());
            res = await updateRate(formData);
        } else {
            res = await createRate(formData);
        }

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(isEditMode ? "Tarif berhasil diperbarui" : "Tarif baru berhasil dibuat");
            setIsDialogOpen(false);
            loadRates();
        }
        setIsSubmitting(false);
    };

    // Handle Delete
    const handleDeleteClick = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus tarif ini?\n\nPeringatan: Menghapus tarif akan gagal jika ada pelanggan yang sedang menggunakan golongan ini!")) return;
        
        setIsSubmitting(true);
        const res = await deleteRate(id);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Tarif berhasil dihapus");
            loadRates();
        }
        setIsSubmitting(false);
    };

    // Open History
    const openHistory = async (rate: Rate) => {
        setSelectedRate(rate);
        setHistoryOpen(true);
        setLoadingHistory(true);
        const history = await getRateHistory(rate.id);
        setRateHistory(history);
        setLoadingHistory(false);
    };

    return (
        <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm p-6 min-h-[80vh] flex flex-col">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Tarif & Golongan</h1>
                    <p className="text-xs text-slate-500 font-medium">Kelola harga dasar (Flat) dan biaya pemeliharaan</p>
                </div>

                <Button
                    onClick={() => { setIsEditMode(false); setSelectedRate(null); setIsDialogOpen(true); }}
                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 shadow-md shadow-indigo-100 transition-all"
                >
                    <Plus className="mr-2 h-3.5 w-3.5" /> Tambah Golongan
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[20px]" />)}
                </div>
            ) : rates.length === 0 ? (
                <div className="text-center py-20 text-slate-400">Belum ada data tarif.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rates.map((rate) => (
                        <div
                            key={rate.id}
                            className="group flex flex-col bg-white border border-slate-200 rounded-[20px] p-6 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Droplets className="h-24 w-24 text-indigo-600" />
                            </div>

                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 w-fit">
                                    <Home className="h-6 w-6" />
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="rounded-full border-slate-200 text-slate-400 font-bold px-3">
                                        {rate.code}
                                    </Badge>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1 relative z-10">{rate.name}</h3>
                            <p className="text-xs text-slate-500 relative z-10">Tarif Flat (Tetap)</p>

                            {/* Effective Period */}
                            {rate.effective_from && (
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold relative z-10">
                                    <CalendarClock className="h-3 w-3" />
                                    <span>
                                        Berlaku: {new Date(rate.effective_from).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {rate.effective_to
                                            ? ` - ${new Date(rate.effective_to).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                            : ' - Selamanya'
                                        }
                                    </span>
                                </div>
                            )}

                            <div className="border-b border-dashed border-slate-200 my-5 relative z-10" />

                            {/* Main Price */}
                            <div className="mb-6 relative z-10">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Droplets className="h-3 w-3" /> Harga Air Per Meter
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-800 tracking-tight">
                                        {formatIDR(rate.flat_rate)}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">/ m³</span>
                                </div>
                            </div>

                            {/* Maintenance Fee */}
                            <div className="bg-slate-50 rounded-2xl p-4 mb-6 ring-1 ring-slate-100 relative z-10">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Coins className="h-3 w-3" /> Biaya Pemeliharaan
                                </p>
                                <p className="font-bold text-slate-700">
                                    {formatIDR(rate.maintenance_fee)} <span className="text-xs font-normal text-slate-400">/ bulan</span>
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex gap-2 relative z-10">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-full border-slate-200 hover:border-indigo-600 hover:text-indigo-600 font-bold"
                                    onClick={() => { setIsEditMode(true); setSelectedRate(rate); setIsDialogOpen(true); }}
                                >
                                    <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Hapus Tarif"
                                    onClick={() => handleDeleteClick(rate.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Riwayat Perubahan"
                                    onClick={() => openHistory(rate)}
                                >
                                    <History className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- DIALOG FORM (Create/Edit) --- */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[20px] p-6">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit Tarif" : "Tambah Golongan Baru"}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {isEditMode ? "Perbarui detail tarif air dan biaya pemeliharaan untuk golongan ini." : "Buat golongan tarif baru dengan menentukan harga air per meter kubik dan biaya beban."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4" key={selectedRate?.id || "new"}>
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold text-slate-600">Nama Golongan</Label>
                            <Input id="name" name="name" defaultValue={selectedRate?.name} placeholder="Contoh: Rumah Tangga" className="rounded-lg bg-slate-50" required autoComplete="off" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code" className="text-xs font-bold text-slate-600">Kode (Unik)</Label>
                            <Input id="code" name="code" defaultValue={selectedRate?.code} placeholder="Contoh: R1" className="rounded-lg bg-slate-50" required disabled={isEditMode} autoComplete="off" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="flat_rate" className="text-xs font-bold text-slate-600">Tarif Air / m³</Label>
                                <Input id="flat_rate" name="flat_rate" type="number" defaultValue={selectedRate?.flat_rate} placeholder="0" className="rounded-lg bg-slate-50" required autoComplete="off" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="maintenance_fee" className="text-xs font-bold text-slate-600">Biaya Pemeliharaan</Label>
                                <Input id="maintenance_fee" name="maintenance_fee" type="number" defaultValue={selectedRate?.maintenance_fee} placeholder="0" className="rounded-lg bg-slate-50" required autoComplete="off" />
                            </div>
                        </div>

                        {/* EFFECTIVE DATES */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="effective_from" className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <CalendarClock className="h-3 w-3" />
                                    Berlaku Dari
                                </Label>
                                <Input
                                    id="effective_from"
                                    name="effective_from"
                                    type="date"
                                    defaultValue={selectedRate?.effective_from ? new Date(selectedRate.effective_from).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                    className="rounded-lg bg-slate-50"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="effective_to" className="text-xs font-bold text-slate-600">
                                    Berlaku Sampai
                                </Label>
                                <Input
                                    id="effective_to"
                                    name="effective_to"
                                    type="date"
                                    className="rounded-lg bg-slate-50"
                                    defaultValue={selectedRate?.effective_to ? new Date(selectedRate.effective_to).toISOString().split('T')[0] : ""}
                                    placeholder="Opsional"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 text-[10px] text-blue-700 flex gap-2 items-start border border-blue-100">
                            <CalendarClock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <p>Kosongkan "Berlaku Sampai" jika tarif berlaku selamanya (tidak ada batas waktu).</p>
                        </div>

                        {isEditMode && (
                            <div className="bg-amber-50 rounded-lg p-3 text-[10px] text-amber-700 flex gap-2 items-start border border-amber-100">
                                <History className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <p>Perubahan tarif akan disimpan ke riwayat. Tagihan yang sudah tercetak TIDAK akan berubah.</p>
                            </div>
                        )}

                        <DialogFooter className="mt-2">
                            <Button type="submit" disabled={isSubmitting} className="rounded-full w-full bg-indigo-600 hover:bg-indigo-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Tarif
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- DIALOG HISTORY --- */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[24px] p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="bg-white p-6 md:p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <History className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block font-bold text-xl text-slate-900 tracking-tight">Riwayat Tarif</span>
                                    <span className="block text-xs text-slate-500 font-medium mt-0.5">Log perubahan harga & golongan</span>
                                </div>
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Menampilkan daftar perubahan tarif dan biaya pemeliharaan dari waktu ke waktu untuk golongan yang dipilih.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

                            {/* ITEM 1: CURRENT / ACTIVE */}
                            {selectedRate && (
                                <div className="relative">
                                    {/* Timeline Connector */}
                                    {rateHistory.length > 0 && (
                                        <div className="absolute left-6 top-10 bottom-[-20px] w-[2px] bg-indigo-100 z-0" />
                                    )}

                                    <div className="relative z-10 bg-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm shadow-indigo-200 text-[10px] h-5 px-2 rounded-full font-bold uppercase tracking-wider">
                                                Aktif
                                            </Badge>
                                            <div className="text-right">
                                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">Periode</p>
                                                <p className="text-xs font-bold text-indigo-900">Sekarang</p>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 mb-1">Tarif {new Date().getFullYear()}</h3>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <p className="text-3xl font-black text-indigo-600 tracking-tight">
                                                {formatIDR(selectedRate.flat_rate)}
                                            </p>
                                            <span className="text-sm font-bold text-indigo-400">/ m³</span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 border-t border-indigo-200/60 mt-2">
                                            <Coins className="h-3.5 w-3.5 text-indigo-500" />
                                            <p className="text-xs font-medium text-indigo-700">
                                                Biaya Pemeliharaan: <span className="font-bold">{formatIDR(selectedRate.maintenance_fee)}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ITEM 2: HISTORY LIST */}
                            {loadingHistory ? (
                                <div className="pl-4 space-y-4 pt-4">
                                    {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl opacity-50" />)}
                                </div>
                            ) : rateHistory.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-xs italic">
                                    Belum ada catatan sejarah perubahan sebelumnya.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {rateHistory.map((hist, idx) => (
                                        <div key={hist.id} className="relative group">
                                            {/* Timeline Connector */}
                                            {idx !== rateHistory.length - 1 && (
                                                <div className="absolute left-6 top-10 bottom-[-20px] w-[2px] bg-slate-100 z-0" />
                                            )}

                                            <div className="relative z-10 bg-slate-50 border border-slate-100 opacity-70 group-hover:opacity-100 rounded-2xl p-5 transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <Badge variant="outline" className="bg-slate-200/50 text-slate-500 border-slate-200 text-[10px] h-5 px-2 rounded-full font-bold uppercase tracking-wider">
                                                        Arsip
                                                    </Badge>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Berlaku</p>
                                                        <p className="text-xs font-bold text-slate-500">
                                                            {new Date(hist.effective_from).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            {' - '}
                                                            {hist.effective_to
                                                                ? new Date(hist.effective_to).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                : 'Selamanya'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <h3 className="text-sm font-bold text-slate-700 mb-1">Tarif Lama</h3>
                                                <div className="flex items-baseline gap-1 mb-1">
                                                    <p className="text-xl font-bold text-slate-500 tracking-tight">
                                                        {formatIDR(hist.flat_rate)}
                                                    </p>
                                                    <span className="text-xs font-bold text-slate-400">/ m³</span>
                                                </div>

                                                <div className="text-xs text-slate-400 font-medium">
                                                    Pemeliharaan: {formatIDR(hist.maintenance_fee)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
