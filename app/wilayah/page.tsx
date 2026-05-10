"use client";

import { useState, useEffect } from "react";
import {
    Map,
    MapPin,
    Search,
    Plus,
    MoreHorizontal,
    Users,
    Target,
    Edit2,
    Trash2,
    Activity,
    Home,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// --- TYPES ---
type Area = {
    id: number;
    name: string;
    code: string;
    // Optional stats for UI compatibility (since DB might not have them yet)
    totalSr?: number;
    target?: number;
    status?: string;
    activeRate?: number;
};

export default function AreasPage() {
    // State
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formTarget, setFormTarget] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEditClick = (area: Area) => {
        setEditingId(area.id);
        setFormName(area.name);
        setFormCode(area.code);
        setFormTarget(area.target || 0);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus wilayah ini?")) return;
        try {
            const { error } = await supabase.from('areas').delete().eq('id', id);
            if (error) throw error;
            toast.success("Wilayah berhasil dihapus");
            fetchAreas();
        } catch (error: any) {
            console.error("Error deleting area:", error);
            toast.error(error.message || "Gagal menghapus wilayah");
        }
    };

    // FETCH DATA
    const fetchAreas = async () => {
        setLoading(true);
        try {
            // 1. Fetch areas
            const { data: areasData, error: areasError } = await supabase
                .from('areas')
                .select('*')
                .order('name', { ascending: true });

            if (areasError) throw areasError;

            // 2. Fetch customer status per area
            const { data: customerData, error: countsError } = await supabase
                .from('customers')
                .select('area_id, status');

            if (countsError) throw countsError;

            // 3. Process counts and active status in JS
            const areaStatsMap = (customerData || []).reduce((acc: any, curr: any) => {
                if (!acc[curr.area_id]) {
                    acc[curr.area_id] = { total: 0, active: 0 };
                }
                acc[curr.area_id].total += 1;
                if (curr.status === 'active') {
                    acc[curr.area_id].active += 1;
                }
                return acc;
            }, {});

            // Map DB data to UI format
            const formattedData = (areasData || []).map((item: any) => {
                const stats = areaStatsMap[item.id] || { total: 0, active: 0 };
                const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
                
                return {
                    id: item.id,
                    name: item.name,
                    code: item.code,
                    totalSr: stats.total,
                    target: item.target || 0,
                    status: "Aktif",
                    activeRate: activeRate
                };
            });

            setAreas(formattedData);
        } catch (error) {
            console.error("Error fetching areas:", error);
            toast.error("Gagal memuat data wilayah: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    // CREATE DATA
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName || !formCode) {
            toast.error("Nama dan Kode wilayah wajib diisi");
            return;
        }

        setIsSubmitting(true);
        try {
            let error;
            if (editingId) {
                const res = await supabase.from('areas').update({ 
                    name: formName, 
                    code: formCode,
                    target: formTarget 
                }).eq('id', editingId);
                error = res.error;
            } else {
                const res = await supabase.from('areas').insert([{ 
                    name: formName, 
                    code: formCode,
                    target: formTarget 
                }]);
                error = res.error;
            }

            if (error) throw error;

            toast.success(editingId ? "Wilayah berhasil diupdate" : "Wilayah berhasil ditambahkan");
            setIsDialogOpen(false);
            setFormName("");
            setFormCode("");
            fetchAreas(); // Refresh data
        } catch (error: any) {
            console.error("Error creating area:", error);
            toast.error(error.message || "Gagal menambah wilayah");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter Logic
    const filteredAreas = areas.filter(area =>
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calc Summary
    const totalWilayah = areas.length;
    // Only sum if properties exist
    const totalPelanggan = areas.reduce((acc, curr) => acc + (curr.totalSr || 0), 0);
    const totalTarget = areas.reduce((acc, curr) => acc + (curr.target || 0), 0);

    return (
        <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm p-6 min-h-[80vh] flex flex-col">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Wilayah</h1>
                    <p className="text-xs text-slate-500 font-medium">Kelola cakupan area distribusi air</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setFormName("");
                        setFormCode("");
                        setFormTarget(0);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setEditingId(null); setFormName(""); setFormCode(""); setFormTarget(0); }} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 shadow-md shadow-indigo-100 transition-all">
                            <Plus className="mr-2 h-3.5 w-3.5" /> Tambah Wilayah
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[20px] p-6">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Wilayah" : "Tambah Wilayah Baru"}</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                {editingId ? "Perbarui informasi nama, kode, dan target untuk wilayah ini." : "Masukkan detail wilayah baru untuk mulai mengelola pelanggan di area tersebut."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs font-bold text-slate-600">Nama Wilayah</Label>
                                <Input
                                    id="name"
                                    name="area-name"
                                    placeholder="Contoh: Dusun I - Krajan"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="rounded-lg bg-slate-50"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code" className="text-xs font-bold text-slate-600">Kode Wilayah</Label>
                                <Input
                                    id="code"
                                    name="area-code"
                                    placeholder="Contoh: D-01"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value)}
                                    className="rounded-lg bg-slate-50"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="target" className="text-xs font-bold text-slate-600">Target Pelanggan (SR)</Label>
                                <Input
                                    id="target"
                                    name="area-target"
                                    type="number"
                                    placeholder="Contoh: 100"
                                    value={formTarget}
                                    onChange={(e) => setFormTarget(parseInt(e.target.value) || 0)}
                                    className="rounded-lg bg-slate-50"
                                    autoComplete="off"
                                />
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isSubmitting} className="rounded-full w-full bg-indigo-600 hover:bg-indigo-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Wilayah
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    id="area-search"
                    name="area-search"
                    placeholder="Cari nama wilayah atau kode..."
                    className="pl-10 h-10 rounded-full bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500 font-medium text-xs placeholder:text-slate-400 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Top Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-slate-50/50 border-slate-100/80 rounded-[24px] p-6 flex flex-col items-center text-center shadow-none hover:bg-slate-100/50 transition-all">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50 mb-4">
                        <Map className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Total Wilayah</p>
                        {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : <p className="text-3xl font-black text-slate-900 tracking-tight">{totalWilayah}</p>}
                    </div>
                </Card>

                <Card className="bg-slate-50/50 border-slate-100/80 rounded-[24px] p-6 flex flex-col items-center text-center shadow-none hover:bg-slate-100/50 transition-all">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50 mb-4">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Total Pelanggan</p>
                        {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : <p className="text-3xl font-black text-slate-900 tracking-tight">{totalPelanggan}</p>}
                    </div>
                </Card>

                <Card className="bg-slate-50/50 border-slate-100/80 rounded-[24px] p-6 flex flex-col items-center text-center shadow-none hover:bg-slate-100/50 transition-all">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50 mb-4">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Total Target</p>
                        {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : <p className="text-3xl font-black text-slate-900 tracking-tight">{totalTarget}</p>}
                    </div>
                </Card>
            </div>

            {/* List Header */}
            <div className="hidden md:flex px-4 py-2 bg-slate-50/50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <div className="flex-1">Info Wilayah</div>
                <div className="w-32 text-center">Pelanggan</div>
                <div className="w-32 text-center">Status Aktif</div>
                <div className="w-24 text-right">Aksi</div>
            </div>

            {/* Data List (Stack) */}
            <div className="space-y-1">
                {loading ? (
                    // Skeleton Loading
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-4 px-4 border-b border-slate-50">
                            <div className="flex gap-4 flex-1">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredAreas.length === 0 ? (
                    <div className="text-center py-20">
                        <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium text-sm">Wilayah tidak ditemukan</p>
                    </div>
                ) : (
                    filteredAreas.map((area) => (
                        <div
                            key={area.id}
                            className="group flex flex-col md:flex-row items-start md:items-center justify-between py-4 px-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 gap-4 md:gap-0"
                        >
                            {/* Kiri: Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">{area.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 rounded-md text-[10px]">
                                            {area.code}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tengah: Stats */}
                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-center">
                                {/* Only show stats if they exist, otherwise show simplified view or placeholder */}
                                <div className="w-32 flex justify-center">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full h-7 px-3 gap-1.5 font-bold shadow-none">
                                        <Users className="h-3.5 w-3.5" /> {(area.totalSr || 0)} SR
                                    </Badge>
                                </div>
                                <div className="w-32 flex justify-center">
                                    <Badge variant="outline" className={cn(
                                        "rounded-full h-7 px-3 gap-1.5 font-bold bg-white",
                                        (area.activeRate || 0) > 90 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"
                                    )}>
                                        <Activity className="h-3.5 w-3.5" /> {(area.activeRate || 0)}% Aktif
                                    </Badge>
                                </div>
                            </div>

                            {/* Kanan: Aksi */}
                            <div className="flex items-center justify-end gap-1 w-full md:w-24 mt-2 md:mt-0">
                                <Button onClick={() => handleEditClick(area)} size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleDeleteClick(area.id)} size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                {/* Mobile Dropdown (Optional if space limited) */}
                                <div className="md:hidden">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Detail</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
