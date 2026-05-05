"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import * as htmlToImage from 'html-to-image';
import { TagihanPelangganImageExport, BillForExport } from "@/components/TagihanPelangganImageExport";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus, LayoutDashboard, FileText, Clock, History, Loader2,
    Search,
    MessageCircle,
    MoreHorizontal,
    Phone,
    MapPin,
    X,
    CreditCard,
    Printer,
    CheckCircle2,
    Calendar,
    Droplets,
    Trash2,
    ChevronLeft,
    ChevronRight,
    User,
    Wallet,
    Hammer,
    Pencil,
    Power,
    PowerOff,
    AlertTriangle,
    Image as ImageIcon
} from "lucide-react";
import {
    getCustomers,
    getWilayahList,
    createCustomer,
    getCustomerInstallation,
    addInstallationPayment,
    getRatesList,
    updateCustomerRate,
    updateCustomer,
    getRateDetails,
    insertLegacyRecord,
    getMeterRecords,
    deleteMeterRecord,
    updateMeterRecord,
    getCustomerDetails,
    toggleCustomerStatus,
    deleteCustomer,
    reinstallCustomer,
    type Customer,
    type Wilayah,
    type InstallationFee,
    type CustomerDetails
} from "@/app/pelanggan/actions";
import { cn } from "@/lib/utils";

// --- TYPE DEFINITION ---
type CustomerData = Customer; // Alias to match previous code style if needed

export default function PelangganPage() {
    // State
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
    const [ratesList, setRatesList] = useState<{ id: number; name: string; code: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCustomerData, setEditingCustomerData] = useState<CustomerData | null>(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<number | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedInstallStatus, setSelectedInstallStatus] = useState<string>('all');

    // Drawer State
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
    const [installationFee, setInstallationFee] = useState<InstallationFee | null>(null);
    const [loadingFee, setLoadingFee] = useState(false);

    // Installment Payment State
    const [isPayInstallmentOpen, setIsPayInstallmentOpen] = useState(false);
    const [payAmount, setPayAmount] = useState("");
    const [isPaying, setIsPaying] = useState(false);

    // Search State (URL Sync)
    const searchParams = useSearchParams();
    const search = searchParams.get("q") || "";

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const [customerData, wilayahData, ratesData] = await Promise.all([
                getCustomers(search, selectedAreaId, selectedStatus, selectedInstallStatus),
                getWilayahList(),
                getRatesList()
            ]);
            setCustomers(customerData);
            setWilayahList(wilayahData);
            setRatesList(ratesData);
        } catch (error) {
            toast.error("Gagal memuat data pelanggan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [search, selectedAreaId, selectedStatus, selectedInstallStatus]);

    // Fetch Installation Fee when customer selected
    useEffect(() => {
        if (selectedCustomer?.installation_status !== 'none' && selectedCustomer?.id) {
            setLoadingFee(true);
            getCustomerInstallation(selectedCustomer.id).then(data => {
                setInstallationFee(data);
                setLoadingFee(false);
            });
        } else {
            setInstallationFee(null);
        }
    }, [selectedCustomer]);

    // Handle Create/Edit Submit
    const openEditForm = (customer: CustomerData) => {
        setIsEditMode(true);
        setEditingCustomerData(customer);
        setIsDialogOpen(true);
    };

    const openCreateForm = () => {
        setIsEditMode(false);
        setEditingCustomerData(null);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

        try {
            let res;
            if (isEditMode && editingCustomerData) {
                res = await updateCustomer(editingCustomerData.id, formData);
            } else {
                res = await createCustomer(formData);
            }

            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success(isEditMode ? "Pelanggan berhasil diupdate" : "Pelanggan berhasil ditambahkan");
                setIsDialogOpen(false);
                form.reset();
                loadData();
                if (isEditMode) {
                    setSelectedCustomer(null); // Close drawer to refresh view cleanly
                }
            }
        } catch (err) {
            toast.error("Terjadi kesalahan pada form submission");
        }
    };

    // Handle Pay Installment
    const handlePayInstallment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!installationFee) return;

        setIsPaying(true);
        const res = await addInstallationPayment(installationFee.id, parseInt(payAmount));

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Pembayaran cicilan berhasil!");
            setIsPayInstallmentOpen(false);
            setPayAmount("");
            // Refresh detail
            const updatedFee = await getCustomerInstallation(selectedCustomer!.id);
            setInstallationFee(updatedFee);
            loadData(); // Update status in list
        }
        setIsPaying(false);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
    };

    // --- TANSTACK TABLE SETUP ---
    const columns = useMemo<ColumnDef<CustomerData>[]>(
        () => [
            {
                id: "info",
                header: "Pelanggan",
                accessorFn: (row) => `${row.nama} ${row.no_pelanggan}`,
                cell: ({ row }) => {
                    const c = row.original;
                    return (
                        <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar className="h-10 w-10 border border-slate-100 bg-white">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.nama}`} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-xs">
                                    {c.nama.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-bold text-slate-900 max-w-[150px] truncate">{c.nama}</p>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 rounded-sm">ID: {c.no_pelanggan}</span>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "wilayah",
                header: "Wilayah",
                accessorFn: (row) => row.wilayah?.nama_wilayah || "",
                cell: ({ row }) => {
                    const region = row.original.wilayah?.nama_wilayah || "Belum ada";
                    return (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 w-48">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{region}</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.original.status || "active";
                    return (
                        <div className="w-28">
                            <Badge className={cn(
                                "rounded-full px-3 py-0.5 text-[10px] font-bold h-6 shadow-none border border-transparent",
                                status === "active" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                                status === "inactive" && "bg-rose-100 text-rose-700 hover:bg-rose-200",
                            )}>
                                {status === "active" ? "Aktif" : "Non-Aktif"}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                id: "biaya",
                header: "Biaya Pasang",
                cell: ({ row }) => {
                    const status = row.original.installation_status;
                    if (status === 'none' || status === 'paid') return null;
                    return (
                        <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                            {status === 'partial' ? 'Cicilan' : 'Belum Lunas'}
                        </Badge>
                    )
                }
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: customers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        initialState: { pagination: { pageSize: 8 } },
    });

    return (
        <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm p-6 min-h-[80vh] flex flex-col relative overflow-hidden">

            {/* --- HEADER TOOLBAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Pelanggan</h1>
                    <p className="text-xs text-slate-500 font-medium">Kelola {loading ? "..." : table.getFilteredRowModel().rows.length} pelanggan terdaftar</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateForm} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-5 shadow-indigo-100 shadow-lg">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-6 py-4" key={editingCustomerData?.id || "new"}>

                            {/* Data Diri */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <User className="h-3.5 w-3.5" /> Data Diri
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="no_pelanggan" className="text-xs font-bold text-slate-600">No. Sambungan (SR)</Label>
                                        <Input id="no_pelanggan" name={isEditMode ? undefined : "no_pelanggan"} defaultValue={editingCustomerData?.no_pelanggan} placeholder="Contoh: SR-001" className="rounded-full bg-slate-50 border-slate-200" required disabled={isEditMode} />
                                        {isEditMode && editingCustomerData && <input type="hidden" name="no_pelanggan" value={editingCustomerData.no_pelanggan} />}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="nama" className="text-xs font-bold text-slate-600">Nama Lengkap</Label>
                                        <Input id="nama" name="nama" defaultValue={editingCustomerData?.nama} placeholder="Nama Pelanggan" className="rounded-full bg-slate-50 border-slate-200" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="hp" className="text-xs font-bold text-slate-600">No. HP / WA</Label>
                                        <Input id="hp" name="hp" defaultValue={editingCustomerData?.hp} placeholder="08..." className="rounded-full bg-slate-50 border-slate-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wilayah" className="text-xs font-bold text-slate-600">Wilayah</Label>
                                        <Select name="wilayah_id" defaultValue={editingCustomerData?.wilayah_id?.toString()} required>
                                            <SelectTrigger className="rounded-full bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Wilayah" /></SelectTrigger>
                                            <SelectContent>
                                                {wilayahList.map((w) => (<SelectItem key={w.id} value={w.id.toString()}>{w.nama_wilayah}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rate" className="text-xs font-bold text-slate-600">Golongan Tarif</Label>
                                        <Select name="rate_id" defaultValue={(editingCustomerData as any)?.rate_id?.toString()} required>
                                            <SelectTrigger className="rounded-full bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Golongan" /></SelectTrigger>
                                            <SelectContent>
                                                {ratesList.map((r) => (<SelectItem key={r.id} value={r.id.toString()}>{r.name} - {r.code}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="meter_reading_group" className="text-xs font-bold text-slate-600">Kel. Catat Meter</Label>
                                        <Select name="meter_reading_group" defaultValue={editingCustomerData?.meter_reading_group || 'A'} required>
                                            <SelectTrigger className="rounded-full bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Kelompok" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A">Kelompok A</SelectItem>
                                                <SelectItem value="B">Kelompok B</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 grid gap-2">
                                        <Label htmlFor="alamat" className="text-xs font-bold text-slate-600">Alamat Lengkap</Label>
                                        <Input id="alamat" name="alamat" defaultValue={editingCustomerData?.alamat} placeholder="Jalan, RT/RW, Dusun" className="rounded-full bg-slate-50 border-slate-200" />
                                    </div>
                                </div>
                            </div>

                            {/* Biaya Pasang */}
                            {!isEditMode && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Hammer className="h-3.5 w-3.5" /> Biaya Pemasangan Baru
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="biaya_pasang" className="text-xs font-bold text-slate-600">Total Biaya Pasang (Rp)</Label>
                                            <Input id="biaya_pasang" name="biaya_pasang" type="number" placeholder="0" className="rounded-full bg-slate-50 border-slate-200" />
                                            <p className="text-[10px] text-slate-400">Kosongkan jika tidak ada biaya pasang.</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="dp_pasang" className="text-xs font-bold text-slate-600">Bayar Uang Muka (DP)</Label>
                                            <Input id="dp_pasang" name="dp_pasang" type="number" placeholder="0" className="rounded-full bg-slate-50 border-slate-200" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" className="rounded-full bg-indigo-600 hover:bg-indigo-700 w-full">Simpan Pelanggan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* --- SEARCH BAR & FILTERS --- */}
            {/* --- SEARCH BAR & FILTERS --- */}
            <div className="mb-6 sticky top-0 bg-white z-10 py-2">
                <div className="flex flex-col xl:flex-row gap-3">
                    {/* Search Bar - Main Priority */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari nama, ID, atau wilayah..."
                            className="pl-10 h-10 rounded-full bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500 font-medium text-xs placeholder:text-slate-400 w-full"
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </div>

                    {/* Filters Group - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xl:w-[600px]">
                        {/* Area Filter */}
                        <Select
                            value={String(selectedAreaId)}
                            onValueChange={(value) => setSelectedAreaId(value === 'all' ? 'all' : parseInt(value))}
                        >
                            <SelectTrigger className="h-10 rounded-full bg-slate-50 border-0 focus:ring-1 focus:ring-indigo-500 font-medium text-xs">
                                <SelectValue placeholder="Semua Wilayah" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        Semua Wilayah
                                    </div>
                                </SelectItem>
                                {wilayahList.map((area) => (
                                    <SelectItem key={area.id} value={area.id.toString()} className="text-xs font-medium">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                                            {area.nama_wilayah}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger className="h-10 rounded-full bg-slate-50 border-0 focus:ring-1 focus:ring-indigo-500 font-medium text-xs">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                                        Semua Status
                                    </div>
                                </SelectItem>
                                <SelectItem value="active" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        Aktif
                                    </div>
                                </SelectItem>
                                <SelectItem value="inactive" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <X className="h-3.5 w-3.5 text-slate-400" />
                                        Tidak Aktif
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Installation Fee Filter */}
                        <Select
                            value={selectedInstallStatus}
                            onValueChange={setSelectedInstallStatus}
                        >
                            <SelectTrigger className="h-10 rounded-full bg-slate-50 border-0 focus:ring-1 focus:ring-indigo-500 font-medium text-xs">
                                <SelectValue placeholder="Biaya Pasang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                                        Semua
                                    </div>
                                </SelectItem>
                                <SelectItem value="paid" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        Lunas
                                    </div>
                                </SelectItem>
                                <SelectItem value="unpaid" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        Belum Lunas
                                    </div>
                                </SelectItem>
                                <SelectItem value="none" className="text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <X className="h-3.5 w-3.5 text-slate-400" />
                                        Tidak Ada
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* --- TABLE HEADER (GRID) --- */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-5">Pelanggan</div>
                <div className="col-span-3">Wilayah</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Biaya Pasang</div>
            </div>

            {/* --- DATA LIST (GRID) --- */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-0">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 animate-pulse items-center">
                            <div className="col-span-5 flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full bg-slate-100" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32 bg-slate-100" />
                                    <Skeleton className="h-2 w-20 bg-slate-100" />
                                </div>
                            </div>
                            <div className="col-span-7">
                                <Skeleton className="h-4 w-full bg-slate-100" />
                            </div>
                        </div>
                    ))
                ) : table.getRowModel().rows.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mx-auto h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Tidak ada pelanggan ditemukan</p>
                    </div>
                ) : (
                    table.getRowModel().rows.map((row) => {
                        const c = row.original;
                        const isSelected = selectedCustomer?.id === c.id;

                        return (
                            <div
                                key={row.id}
                                onClick={() => setSelectedCustomer(c)}
                                className={cn(
                                    "grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 items-center transition-all cursor-pointer group",
                                    isSelected ? "bg-indigo-50/50 border-indigo-200" : "hover:bg-slate-50"
                                )}
                            >
                                {/* COLUMN 1: PELANGGAN (5) */}
                                <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border border-slate-100 bg-white shadow-sm shrink-0">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.nama}`} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-xs">
                                            {c.nama.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 truncate" title={c.nama}>{c.nama}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium">
                                                {c.no_pelanggan}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 2: WILAYAH (3) */}
                                <div className="hidden md:flex col-span-3 items-center gap-2 text-xs font-medium text-slate-600">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{c.wilayah?.nama_wilayah || "-"}</span>
                                </div>

                                {/* COLUMN 3: STATUS (2) */}
                                <div className="hidden md:block col-span-2">
                                    <Badge className={cn(
                                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold h-6 shadow-none border border-transparent min-w-[80px] justify-center",
                                        c.status === "active" && "bg-emerald-100 text-emerald-700",
                                        c.status === "inactive" && "bg-rose-100 text-rose-700",
                                    )}>
                                        {c.status === "active" ? "Aktif" : "Non-Aktif"}
                                    </Badge>
                                </div>

                                {/* COLUMN 4: BIAYA PASANG/AKSI (2) */}
                                <div className="hidden md:flex col-span-2 justify-end items-center gap-2">
                                    {c.installation_status && c.installation_status !== 'paid' && c.installation_status !== 'none' && (
                                        <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-700 bg-amber-50 h-6 px-2">
                                            {c.installation_status === 'partial' ? 'Cicilan' : 'Belum Lunas'}
                                        </Badge>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- PAGINATION FOOTER (Keep as is) --- */}
            <div className="mt-auto px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 w-8 p-0 rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 w-8 p-0 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            {/* --- SLIDE-OVER DRAWER --- */}
            {selectedCustomer && (
                <>
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 transition-opacity" onClick={() => setSelectedCustomer(null)} />
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">

                        <CustomerDrawerContent
                            customer={selectedCustomer}
                            installationFee={installationFee}
                            onPayInstallment={() => setIsPayInstallmentOpen(true)}
                            formatCurrency={formatCurrency}
                            onEditCustomer={() => openEditForm(selectedCustomer)}
                            onClose={() => setSelectedCustomer(null)}
                        />

                    </div>
                </>
            )}

            {/* --- PAY INSTALLMENT DIALOG --- */}
            <Dialog open={isPayInstallmentOpen} onOpenChange={setIsPayInstallmentOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>Bayar Cicilan Pasang</DialogTitle>
                    </DialogHeader>
                    {installationFee && (
                        <form onSubmit={handlePayInstallment} className="mt-4 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-slate-500">Sisa Tagihan Anda</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(installationFee.total_amount - installationFee.paid_amount)}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Jumlah Bayar</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="pl-10"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        required
                                        min={1000}
                                        max={installationFee.total_amount - installationFee.paid_amount}
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={isPaying} className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700">Bayar Sekarang</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}

// --- DRAWER CONTENT COMPONENT ---
function CustomerDrawerContent({ customer, installationFee, onPayInstallment, formatCurrency, onEditCustomer, onClose }: { customer: any, installationFee: any, onPayInstallment: () => void, formatCurrency: (v: number) => string, onEditCustomer: () => void, onClose?: () => void }) {
    const [activeTab, setActiveTab] = useState('overview');
    const router = useRouter();

    // Comprehensive Customer Details State
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    // Rate Edit State
    const [rates, setRates] = useState<{ id: number, name: string, code: string }[]>([]);
    const [isUpdatingRate, setIsUpdatingRate] = useState(false);

    // Meter Records State
    const [meterRecords, setMeterRecords] = useState<any[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);

    // Legacy Input State
    const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [legacyMonth, setLegacyMonth] = useState("1");
    const [legacyYear, setLegacyYear] = useState("2026");
    const [meterLast, setMeterLast] = useState("");
    const [meterCurrent, setMeterCurrent] = useState("");
    const [ratePerM3, setRatePerM3] = useState("");
    const [abonemen, setAbonemen] = useState("");
    const [isPaid, setIsPaid] = useState("unpaid");
    const [isSaving, setIsSaving] = useState(false);

    // Delete State
    const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Action Dialogs State
    const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false);
    const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
    const [isReinstallOpen, setIsReinstallOpen] = useState(false);
    const [reinstallFee, setReinstallFee] = useState("");
    const [reinstallMethod, setReinstallMethod] = useState<'cash' | 'transfer'>('cash');
    const [isProcessing, setIsProcessing] = useState(false);

    // Image Export State
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportMode, setExportMode] = useState<'single' | 'all'>('all');
    const [exportBill, setExportBill] = useState<BillForExport | undefined>(undefined);

    // Load comprehensive customer details
    useEffect(() => {
        if (customer?.id) {
            setLoadingDetails(true);
            getCustomerDetails(customer.id).then(details => {
                setCustomerDetails(details);
                setLoadingDetails(false);
            });
        }
    }, [customer?.id]);

    useEffect(() => {
        getRatesList().then(setRates);
    }, []);

    // Load meter records
    useEffect(() => {
        setLoadingRecords(true);
        getMeterRecords(customer.id).then((data) => {
            setMeterRecords(data);
            setLoadingRecords(false);
        });
    }, [customer.id]);

    // Load default rate when modal opens (only for new records)
    useEffect(() => {
        if (isLegacyModalOpen && !editingRecord && customer.rate_id) {
            getRateDetails(customer.rate_id).then((data) => {
                setRatePerM3(data.flat_rate.toString());
                setAbonemen(data.maintenance_fee.toString());
            });
        }
    }, [isLegacyModalOpen, editingRecord, customer.rate_id]);

    const handleRateChange = async (val: string) => {
        const newRateId = parseInt(val);
        setIsUpdatingRate(true);
        toast.loading("Mengupdate golongan...", { id: "update-rate" });

        const res = await updateCustomerRate(customer.id, newRateId);

        if (res.error) {
            toast.error(res.error, { id: "update-rate" });
        } else {
            toast.success("Golongan berhasil diubah!", { id: "update-rate" });
            // Optimization: We should reload page to see effect on bills if any, but request said simple update.
            // Since props 'customer' is from parent, we might not see immediate update unless we mutate it or refresh.
            // For now, let's refresh router.
            router.refresh();
        }
        setIsUpdatingRate(false);
    };

    const MOCK_BILLS = [
        { id: 1, month: 'Januari 2026', usage: 20, amount: 28500, status: 'unpaid' },
        { id: 2, month: 'Desember 2025', usage: 18, amount: 25000, status: 'paid' },
        { id: 3, month: 'November 2025', usage: 22, amount: 31000, status: 'paid' },
    ];

    // Image Export Handler
    const handleExportBillImage = async (mode: 'single' | 'all', bill?: BillForExport) => {
        setExportMode(mode);
        setExportBill(bill);
        // Wait for the off-screen component to update
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!exportRef.current) return;
        setIsExporting(true);
        toast.loading("Membuat gambar tagihan...", { id: 'img-export' });

        try {
            const dataUrl = await htmlToImage.toJpeg(exportRef.current, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                pixelRatio: 2
            });

            if (navigator?.share && typeof navigator.canShare === 'function') {
                const blob = await (await fetch(dataUrl)).blob();
                const billLabel = mode === 'single' && bill
                    ? `${bill.month}_${bill.year}`
                    : 'Semua';
                const file = new File([blob], `Tagihan_${customer.no_pelanggan}_${billLabel}.jpg`, { type: 'image/jpeg' });
                try {
                    await navigator.share({ files: [file], title: 'Tagihan Pamsimas' });
                } catch (e) {
                    // User cancelled share, fallback to download
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `Tagihan_${customer.no_pelanggan}_${billLabel}.jpg`;
                    link.click();
                }
            } else {
                const billLabel = mode === 'single' && bill ? `${bill.month}_${bill.year}` : 'Semua';
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `Tagihan_${customer.no_pelanggan}_${billLabel}.jpg`;
                link.click();
            }
            toast.success("Gambar tagihan berhasil dibuat!", { id: 'img-export' });
        } catch (err) {
            toast.error("Gagal membuat gambar tagihan", { id: 'img-export' });
        } finally {
            setIsExporting(false);
        }
    };

    const formatPhoneNumber = (phone: string | null | undefined) => {
        if (!phone) return "";
        let clean = phone.replace(/\D/g, '');
        if (clean.startsWith('0')) {
            clean = '62' + clean.slice(1);
        }
        return clean;
    };

    const sendWA = (text: string) => {
        const num = formatPhoneNumber(customer.hp);
        const encoded = encodeURIComponent(text);
        if (num) {
            window.open(`https://wa.me/${num}?text=${encoded}`, '_blank');
        } else {
            // Jika tidak ada nomor HP, buka URL WA biasa untuk di-forward manual
            window.open(`https://wa.me/?text=${encoded}`, '_blank');
        }
    };

    const shareTotalArrears = () => {
        if (!customerDetails) return;
        const total = formatCurrency(customerDetails.stats.total_arrears);
        const count = customerDetails.stats.total_bills;
        const text = `Halo Bapak/Ibu *${customer.nama}*,
Kami informasikan bahwa saat ini Anda memiliki tunggakan tagihan air Pamsimas Tirtowening.

*Total Tunggakan:* ${total}
*Jumlah:* ${count} bulan belum lunas

Mohon untuk segera melakukan pelunasan agar layanan tetap berjalan lancar. Terima kasih.`;
        sendWA(text);
    };

    const shareBillDetail = (bill: any) => {
        const text = `Halo Bapak/Ibu *${customer.nama}*,
Berikut adalah informasi tagihan air Pamsimas Tirtowening Anda:

*Bulan:* ${getMonthName(bill.month)} ${bill.year}
*Pemakaian:* ${bill.usage} m³
*Total Tagihan:* ${formatCurrency(bill.bill_amount)}
*Status:* ${bill.status === 'partial' ? 'Cicilan' : 'Belum Lunas'}
${bill.status === 'partial' ? `*Sisa Tagihan:* ${formatCurrency(bill.remaining)}\n` : ''}
Mohon untuk segera melakukan pembayaran. Terima kasih.`;
        sendWA(text);
    };

    const shareAllBillsBreakdown = () => {
        if (!customerDetails) return;
        const unpaidBills = customerDetails.bills.filter(b => b.status !== 'paid').sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
        
        let billsText = unpaidBills.map((b, i) => 
            `${i + 1}. ${getMonthName(b.month)} ${b.year}: ${b.usage} m³ - ${formatCurrency(b.remaining)}`
        ).join('\n');

        const total = formatCurrency(customerDetails.stats.total_arrears);
        const text = `Halo Bapak/Ibu *${customer.nama}*,
Berikut adalah rincian tagihan air Pamsimas Tirtowening Anda yang belum terlunasi:

${billsText}

*Total Keseluruhan: ${total}*

Mohon untuk segera melakukan pelunasan. Terima kasih.`;
        sendWA(text);
    };

    const handleLegacySave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            customerId: customer.id,
            month: parseInt(legacyMonth),
            year: parseInt(legacyYear),
            meterLast: parseInt(meterLast),
            meterCurrent: parseInt(meterCurrent),
            rateSnapshot: parseFloat(ratePerM3),
            maintenanceSnapshot: parseFloat(abonemen),
            isPaid: isPaid === 'paid'
        };

        const res = editingRecord
            ? await updateMeterRecord(editingRecord.id, payload)
            : await insertLegacyRecord(payload);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(editingRecord ? "Data berhasil diupdate!" : "Data historis berhasil disimpan!");
            setIsLegacyModalOpen(false);
            // Reset form
            setEditingRecord(null);
            setLegacyMonth("1");
            setLegacyYear("2026");
            setMeterLast("");
            setMeterCurrent("");
            setIsPaid("unpaid");
            // Reload records
            getMeterRecords(customer.id).then(setMeterRecords);
            getCustomerDetails(customer.id).then(details => {
                setCustomerDetails(details);
            });
            setActiveTab('bills');
            router.refresh();
        }
        setIsSaving(false);
    };

    const handleEditRecord = (record: any) => {
        setEditingRecord(record);
        setLegacyMonth(record.month.toString());
        setLegacyYear(record.year.toString());
        setMeterLast(record.meter_last.toString());
        setMeterCurrent(record.meter_current.toString());
        setRatePerM3(record.rate_snapshot.toString());
        setAbonemen(record.maintenance_snapshot.toString());
        setIsPaid(record.status === 'paid' ? 'paid' : 'unpaid');
        setIsLegacyModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteRecordId) return;

        setIsDeleting(true);
        const res = await deleteMeterRecord(deleteRecordId);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Data berhasil dihapus!");
            // Reload records
            getMeterRecords(customer.id).then(setMeterRecords);
            router.refresh();
        }

        setIsDeleting(false);
        setDeleteRecordId(null);
    };

    // Calculate usage and total preview
    const usage = meterCurrent && meterLast ? parseInt(meterCurrent) - parseInt(meterLast) : 0;
    const totalBill = usage > 0 && ratePerM3 && abonemen
        ? (usage * parseFloat(ratePerM3)) + parseFloat(abonemen)
        : 0;

    // Format month name
    const getMonthName = (month: number) => {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[month - 1] || '';
    };

    // === NEW ACTION HANDLERS ===
    const handleToggleStatus = async () => {
        if (!customerDetails) return;

        setIsProcessing(true);
        const newStatus = customerDetails.customer.status === 'active' ? 'inactive' : 'active';
        const res = await toggleCustomerStatus(customer.id, newStatus);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`Pelanggan berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}!`);
            // Reload details
            getCustomerDetails(customer.id).then(setCustomerDetails);
            router.refresh();
        }

        setIsProcessing(false);
        setIsToggleStatusOpen(false);
    };

    const handleDeleteCustomer = async () => {
        setIsProcessing(true);
        const res = await deleteCustomer(customer.id);

        if (res.error) {
            toast.error(res.error);
            setIsProcessing(false);
        } else {
            toast.success("Pelanggan berhasil dihapus!");
            setIsProcessing(false);
            setIsDeleteCustomerOpen(false);
            // Close drawer and refresh list
            router.refresh();
            window.location.reload(); // Force reload to close drawer
        }
    };

    const handleReinstall = async (e: React.FormEvent) => {
        e.preventDefault();

        const fee = parseFloat(reinstallFee) || 0;
        if (fee < 0) {
            toast.error("Biaya tidak valid");
            return;
        }

        setIsProcessing(true);
        const res = await reinstallCustomer(customer.id, fee, reinstallMethod);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Pelanggan berhasil diaktifkan kembali!");
            // Reload details
            getCustomerDetails(customer.id).then(setCustomerDetails);
            router.refresh();
            setReinstallFee("");
        }

        setIsProcessing(false);
        setIsReinstallOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Off-screen export component */}
            <TagihanPelangganImageExport
                ref={exportRef}
                customer={{
                    nama: customer.nama,
                    no_pelanggan: customer.no_pelanggan,
                    alamat: customer.alamat,
                    wilayah: customer.wilayah?.nama_wilayah
                }}
                bills={customerDetails?.bills || []}
                mode={exportMode}
                selectedBill={exportBill}
            />

            {/* STICKY HEADER */}
            <div className="bg-white px-4 pt-4 pb-0 shadow-sm border-b border-slate-100 z-10 sticky top-0">
                {/* Top row: back button + avatar + info + edit button */}
                <div className="flex items-center gap-3 mb-4">
                    {/* Back/Close button - visible on mobile only */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="sm:hidden flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    )}
                    <Avatar className="h-12 w-12 shrink-0 border-2 border-white shadow-sm bg-slate-100">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.nama}`} />
                        <AvatarFallback className="bg-indigo-600 text-white text-base font-bold">{customer.nama?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-slate-900 leading-tight truncate">{customer.nama}</h2>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-md font-mono text-[10px] border border-slate-200">
                                {customer.no_pelanggan}
                            </Badge>
                            <Badge className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold h-5 shadow-none border border-transparent",
                                (customer.status || "active") === "active" && "bg-emerald-100 text-emerald-700",
                                (customer.status || "active") === "inactive" && "bg-rose-100 text-rose-700",
                            )}>
                                {customer.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                            </Badge>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onEditCustomer}
                        className="rounded-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-9 w-9 shrink-0"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>

                {/* TABS HEADER */}
                <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl mb-3">
                    {[
                        { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
                        { id: 'bills', label: 'Tagihan', icon: FileText },
                        { id: 'install', label: 'Pasang', icon: Hammer },
                        { id: 'history', label: 'Riwayat', icon: History },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-[10px] font-bold transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Legacy Input Button */}
                <div className="pb-3">
                    <Button
                        onClick={() => setIsLegacyModalOpen(true)}
                        variant="outline"
                        className="w-full rounded-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 font-bold text-xs h-9"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Input Data Lampau
                    </Button>
                </div>
            </div>

            {/* TAB CONTENT Area */}
            <div className="px-3 py-4 overflow-y-auto flex-1 custom-scrollbar">

                {/* 1. OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {loadingDetails ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            </div>
                        ) : customerDetails ? (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-md mb-2 inline-block font-bold">Total Tunggakan</div>
                                        <div className="text-xl font-black text-slate-800">{formatCurrency(customerDetails.stats.total_arrears)}</div>
                                        {customerDetails.stats.total_bills > 0 && (
                                            <p className="text-[10px] text-slate-500 mt-1">{customerDetails.stats.total_bills} tagihan belum lunas</p>
                                        )}
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md mb-2 inline-block font-bold">Rata-rata Pakai</div>
                                        <div className="text-xl font-black text-slate-800">{customerDetails.stats.avg_usage} m³</div>
                                        <p className="text-[10px] text-slate-500 mt-1">6 bulan terakhir</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-slate-500 py-8">Data tidak tersedia</div>
                        )}

                        {/* Info Grid */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" /> Informasi Pelanggan
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-xs text-slate-400 font-medium shrink-0">Alamat</p>
                                    <p className="text-xs font-bold text-slate-700 text-right">{customer.alamat || "-"}</p>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className="text-xs text-slate-400 font-medium shrink-0">No. HP</p>
                                    <p className="text-xs font-bold text-slate-700">{customer.hp || "-"}</p>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className="text-xs text-slate-400 font-medium shrink-0">Wilayah</p>
                                    <p className="text-xs font-bold text-slate-700">{customer.wilayah?.nama_wilayah || "-"}</p>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className="text-xs text-slate-400 font-medium shrink-0">Golongan</p>
                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                        {rates.length > 0 ? (
                                            <Select
                                                disabled={isUpdatingRate}
                                                value={(customer as any).rate_id?.toString() || "1"}
                                                onValueChange={handleRateChange}
                                            >
                                                <SelectTrigger className="h-7 text-xs font-bold bg-slate-50 border-slate-200 rounded-full px-3 focus:ring-indigo-500 w-auto max-w-[160px]">
                                                    <SelectValue placeholder="Pilih..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rates.map((r) => (
                                                        <SelectItem key={r.id} value={r.id.toString()} className="text-xs font-medium">
                                                            {r.name} ({r.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-700">{(customer as any).kategori || "Standard"}</p>
                                        )}
                                        {isUpdatingRate && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WA Buttons */}
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={() => sendWA(`Halo Bapak/Ibu ${customer.nama},`)}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 rounded-full shadow-lg shadow-emerald-100"
                            >
                                <MessageCircle className="mr-2 h-4 w-4" /> Chat via WhatsApp
                            </Button>
                            {customerDetails && customerDetails.stats.total_arrears > 0 && (
                                <Button
                                    onClick={shareTotalArrears}
                                    variant="outline"
                                    className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold h-11 rounded-full"
                                >
                                    <MessageCircle className="mr-2 h-4 w-4" /> Kirim Info Tagihan
                                </Button>
                            )}
                        </div>

                        {/* Share as Image */}
                        {customerDetails && customerDetails.stats.total_arrears > 0 && (
                            <Button
                                onClick={() => handleExportBillImage('all')}
                                disabled={isExporting}
                                variant="outline"
                                className="w-full h-11 rounded-full border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-bold text-sm"
                            >
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                Bagikan sebagai Gambar
                            </Button>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="space-y-3">
                            {/* Toggle Status Button */}
                            {customerDetails && (
                                <Button
                                    onClick={() => setIsToggleStatusOpen(true)}
                                    variant="outline"
                                    className={cn(
                                        "w-full h-11 rounded-full font-bold text-sm transition-all",
                                        customerDetails.customer.status === 'active'
                                            ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    )}
                                >
                                    {customerDetails.customer.status === 'active' ? (
                                        <><PowerOff className="mr-2 h-4 w-4" /> Nonaktifkan Pelanggan</>
                                    ) : (
                                        <><Power className="mr-2 h-4 w-4" /> Aktifkan Pelanggan</>
                                    )}
                                </Button>
                            )}

                            {/* Delete Button - Danger Zone */}
                            <Button
                                onClick={() => setIsDeleteCustomerOpen(true)}
                                variant="outline"
                                className="w-full h-11 rounded-full border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-sm transition-all"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus Pelanggan
                            </Button>
                        </div>
                    </div>
                )}

                {/* 2. BILLS */}
                {activeTab === 'bills' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {loadingDetails ? (
                            <div className="bg-white rounded-[20px] border border-slate-200 p-6 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                <p className="text-xs text-slate-500 mt-2">Memuat data...</p>
                            </div>
                        ) : !customerDetails || customerDetails.bills.length === 0 ? (
                            <div className="bg-white rounded-[20px] border border-slate-200 p-8 text-center">
                                <Droplets className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-slate-500">Belum ada data tagihan</p>
                                <p className="text-xs text-slate-400">Gunakan tombol "Input Data Lampau" untuk menambah data</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {customerDetails.stats.total_arrears > 0 && (
                                    <div className="flex justify-end">
                                        <Button 
                                            onClick={shareAllBillsBreakdown}
                                            variant="outline" 
                                            className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold h-8 px-3"
                                        >
                                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                            Kirim Rincian Tunggakan
                                        </Button>
                                    </div>
                                )}
                                <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden">
                                {customerDetails.bills.map((bill) => (
                                    <div
                                        key={bill.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group",
                                            bill.status === 'partial' && "bg-amber-50/30 hover:bg-amber-50/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center border font-bold text-xs",
                                                bill.status === 'paid' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                                                bill.status === 'partial' && "bg-amber-50 text-amber-600 border-amber-200",
                                                bill.status === 'unpaid' && "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                <Droplets className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{getMonthName(bill.month)} {bill.year}</p>
                                                <p className="text-xs text-slate-500">Pemakaian: <span className="font-bold text-slate-700">{bill.usage} m³</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-1">
                                                <p className="text-sm font-black text-slate-700">{formatCurrency(bill.bill_amount)}</p>
                                                {bill.status === 'partial' && (
                                                    <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                                                        Sisa: {formatCurrency(bill.remaining)}
                                                    </p>
                                                )}
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] mt-1 border-0 h-5 px-2",
                                                    bill.status === 'paid' && "bg-emerald-100 text-emerald-700",
                                                    bill.status === 'partial' && "bg-amber-100 text-amber-700",
                                                    bill.status === 'unpaid' && "bg-rose-100 text-rose-700"
                                                )}>
                                                    {bill.status === 'paid' ? 'Lunas' : bill.status === 'partial' ? 'Cicilan' : 'Belum Bayar'}
                                                </Badge>
                                            </div>
                                            {/* Dropdown Action Menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    {bill.status !== 'paid' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => shareBillDetail(bill)} className="text-emerald-700 font-medium cursor-pointer">
                                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                                Kirim via WhatsApp
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleExportBillImage('single', bill)} disabled={isExporting} className="text-indigo-700 font-medium cursor-pointer">
                                                                <ImageIcon className="h-4 w-4 mr-2" />
                                                                Simpan sebagai Foto
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleEditRecord(bill)} className="font-medium cursor-pointer">
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit Tagihan
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDeleteRecordId(bill.id)} className="text-rose-600 font-medium cursor-pointer focus:text-rose-600 focus:bg-rose-50">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Hapus Tagihan
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. INSTALLATION */}
                {activeTab === 'install' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* RE-INSTALL FEATURE FOR INACTIVE CUSTOMERS */}
                        {customerDetails && customerDetails.customer.status === 'inactive' && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[20px] p-6 border-2 border-dashed border-indigo-200 mb-6">
                                <div className="text-center space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                                        <Hammer className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-1">Pasang Baru / Sambung Ulang</h3>
                                        <p className="text-sm text-slate-600">Pelanggan ini tidak aktif. Aktifkan kembali dengan biaya pemasangan baru.</p>
                                    </div>
                                    <Button
                                        onClick={() => setIsReinstallOpen(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-full shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                                    >
                                        <Power className="mr-2 h-5 w-5" /> Proses Pemasangan Ulang
                                    </Button>
                                </div>
                            </div>
                        )}

                        {installationFee ? (
                            <div className="space-y-6">
                                <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Pembayaran Biaya Pasang</p>
                                            <p className="text-xs text-slate-500">Cicilan biaya sambungan baru</p>
                                        </div>
                                        {installationFee.status === 'paid' ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-200">Lunas</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Belum Lunas</Badge>
                                        )}
                                    </div>

                                    {/* Progress Section */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs font-medium text-slate-600">
                                                Terbayar <span className="font-bold text-slate-900">{formatCurrency(installationFee.paid_amount)}</span> dari {formatCurrency(installationFee.total_amount)}
                                            </p>
                                            <p className="text-xs font-bold text-indigo-600">
                                                {Math.round((installationFee.paid_amount / installationFee.total_amount) * 100)}%
                                            </p>
                                        </div>
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                                    installationFee.status === 'paid' ? "bg-emerald-500" : "bg-indigo-500"
                                                )}
                                                style={{ width: `${(installationFee.paid_amount / installationFee.total_amount) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {installationFee.status !== 'paid' && (
                                        <Button
                                            onClick={onPayInstallment}
                                            className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 font-bold h-11 text-sm shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
                                        >
                                            <Wallet className="mr-2 h-4 w-4" /> Bayar Cicilan
                                        </Button>
                                    )}
                                </div>

                                {/* History Log */}
                                {(installationFee as any).payments && (installationFee as any).payments.length > 0 ? (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Riwayat Pembayaran</h4>
                                        <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden">
                                            {(installationFee as any).payments.map((pay: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900">{formatCurrency(pay.amount)}</p>
                                                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(pay.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] rounded-full font-bold">
                                                                {pay.method === 'cash' ? 'Tunai' : (pay.method || 'Tunai')}
                                                            </Badge>
                                                            <p className="text-[9px] text-slate-400 mt-0.5">Petugas</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                                                            onClick={() => window.open(`/print-sr/${pay.id}`, '_blank')}
                                                            title="Cetak Kwitansi"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                        <p className="text-xs text-slate-400">Belum ada riwayat pembayaran.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-2" />
                                <p className="text-slate-500 font-medium text-sm">Tidak ada tagihan pemasangan baru.</p>
                                <p className="text-xs text-slate-400">Pelanggan ini sudah lunas atau tidak memiliki biaya pasang.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. HISTORY - REAL DATA WITH BADGES */}
                {activeTab === 'history' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                        {loadingDetails ? (
                            <div className="bg-white rounded-[20px] border border-slate-200 p-6 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                <p className="text-xs text-slate-500 mt-2">Memuat riwayat...</p>
                            </div>
                        ) : !customerDetails || customerDetails.history.length === 0 ? (
                            <div className="bg-white rounded-[20px] border border-slate-200 p-8 text-center">
                                <History className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-slate-500">Belum ada riwayat transaksi</p>
                                <p className="text-xs text-slate-400">Transaksi akan muncul di sini</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden">
                                {customerDetails.history.map((tx) => {
                                    // Determine badge color based on type
                                    let badgeClass = "bg-slate-100 text-slate-700";
                                    let icon = <History className="h-4 w-4" />;

                                    if (tx.type === "Biaya Pasang") {
                                        badgeClass = "bg-purple-100 text-purple-700";
                                        icon = <Hammer className="h-4 w-4" />;
                                    } else if (tx.type === "Auto-Debit Saldo") {
                                        badgeClass = "bg-blue-100 text-blue-700";
                                        icon = <Wallet className="h-4 w-4" />;
                                    } else if (tx.type === "Deposit Saldo") {
                                        badgeClass = "bg-emerald-100 text-emerald-700";
                                        icon = <Wallet className="h-4 w-4" />;
                                    } else if (tx.type.includes("Pembayaran")) {
                                        badgeClass = "bg-emerald-100 text-emerald-700";
                                        icon = <CheckCircle2 className="h-4 w-4" />;
                                    }

                                    return (
                                        <div key={tx.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center border", badgeClass)}>
                                                    {icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={cn("text-[10px] h-5 px-2 border-0 font-bold", badgeClass)}>
                                                            {tx.type}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-slate-100 text-slate-500">
                                                            {tx.method}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500">
                                                        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {tx.related_bills && (
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Tagihan: {tx.related_bills}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => window.open(`/print/${tx.id}?format=thermal`, '_blank')}
                                                    title="Cetak Struk"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Legacy Input Modal */}
            <Dialog open={isLegacyModalOpen} onOpenChange={(open) => {
                setIsLegacyModalOpen(open);
                if (!open) setEditingRecord(null);
            }}>
                <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRecord ? 'Edit Data Historis' : 'Input Data Lampau (Migrasi Data)'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLegacySave} className="space-y-6 py-4">
                        {/* Waktu */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                                <Calendar className="h-3.5 w-3.5" /> Periode
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-600">Bulan</Label>
                                    <Select value={legacyMonth} onValueChange={setLegacyMonth} required>
                                        <SelectTrigger className="rounded-full bg-slate-50 border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-600">Tahun</Label>
                                    <Select value={legacyYear} onValueChange={setLegacyYear} required>
                                        <SelectTrigger className="rounded-full bg-slate-50 border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Meteran */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                                <Droplets className="h-3.5 w-3.5" /> Pencatatan Meteran
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-600">Meter Awal</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="rounded-full bg-slate-50 border-slate-200"
                                        value={meterLast}
                                        onChange={(e) => setMeterLast(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-600">Meter Akhir</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="rounded-full bg-slate-50 border-slate-200"
                                        value={meterCurrent}
                                        onChange={(e) => setMeterCurrent(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {usage > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-blue-600 font-medium">Pemakaian: <span className="font-bold text-lg">{usage} m³</span></p>
                                </div>
                            )}
                        </div>

                        {/* Tarif */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                                <CreditCard className="h-3.5 w-3.5" /> Tarif (Manual Override)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-600">Harga per m³ (Rp)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="rounded-full bg-slate-50 border-slate-200"
                                        value={ratePerM3}
                                        onChange={(e) => setRatePerM3(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-slate-600">Abonemen (Rp)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="rounded-full bg-slate-50 border-slate-200"
                                        value={abonemen}
                                        onChange={(e) => setAbonemen(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {totalBill > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
                                    <p className="text-xs text-indigo-600 font-medium mb-1">Preview Total Tagihan</p>
                                    <p className="text-2xl font-black text-indigo-900">{formatCurrency(totalBill)}</p>
                                </div>
                            )}
                        </div>

                        {/* Status Pembayaran */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Status Pembayaran
                            </h3>
                            <Select value={isPaid} onValueChange={setIsPaid} required>
                                <SelectTrigger className="rounded-full bg-slate-50 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unpaid">Belum Lunas (Tagihan)</SelectItem>
                                    <SelectItem value="paid">Sudah Lunas (History)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 font-bold h-11"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Simpan Data Historis
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteRecordId !== null} onOpenChange={(open) => !open && setDeleteRecordId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tagihan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus tagihan ini? Data tidak bisa dikembalikan.
                            {meterRecords.find(r => r.id === deleteRecordId)?.status === 'paid' && (
                                <span className="block mt-2 text-rose-600 font-medium">
                                    ⚠️ Tagihan ini sudah lunas. Data transaksi terkait juga akan dihapus.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="rounded-full">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="rounded-full bg-rose-600 hover:bg-rose-700"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toggle Status Confirmation Dialog */}
            <AlertDialog open={isToggleStatusOpen} onOpenChange={setIsToggleStatusOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {customerDetails?.customer.status === 'active' ? 'Nonaktifkan Pelanggan?' : 'Aktifkan Pelanggan?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {customerDetails?.customer.status === 'active' ? (
                                'Pelanggan akan dinonaktifkan dan tidak dapat menggunakan layanan.'
                            ) : (
                                'Pelanggan akan diaktifkan kembali dan dapat menggunakan layanan.'
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing} className="rounded-full">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            disabled={isProcessing}
                            className={cn(
                                "rounded-full",
                                customerDetails?.customer.status === 'active'
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                            )}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {customerDetails?.customer.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Customer Confirmation Dialog */}
            <AlertDialog open={isDeleteCustomerOpen} onOpenChange={setIsDeleteCustomerOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5" />
                            Hapus Pelanggan?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="block text-slate-700 font-medium mb-2">
                                Tindakan ini TIDAK DAPAT DIBATALKAN!
                            </span>
                            Semua data pelanggan termasuk tagihan dan riwayat akan dihapus permanen.
                            <span className="block mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-medium">
                                ⚠️ Pelanggan dengan riwayat transaksi TIDAK DAPAT dihapus. Gunakan fitur Nonaktifkan sebagai gantinya.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing} className="rounded-full">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCustomer}
                            disabled={isProcessing}
                            className="rounded-full bg-rose-600 hover:bg-rose-700"
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Hapus Permanen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Re-Install Modal */}
            <Dialog open={isReinstallOpen} onOpenChange={setIsReinstallOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Hammer className="h-5 w-5 text-indigo-600" />
                            Pasang Baru / Sambung Ulang
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleReinstall} className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-600">Biaya Pasang Baru (Rp)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="rounded-full bg-slate-50 border-slate-200"
                                    value={reinstallFee}
                                    onChange={(e) => setReinstallFee(e.target.value)}
                                    min={0}
                                />
                                <p className="text-xs text-slate-500">Masukkan 0 jika tidak ada biaya</p>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-600">Metode Pembayaran</Label>
                                <Select value={reinstallMethod} onValueChange={(v) => setReinstallMethod(v as 'cash' | 'transfer')}>
                                    <SelectTrigger className="rounded-full bg-slate-50 border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Tunai</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsReinstallOpen(false)}
                                disabled={isProcessing}
                                className="rounded-full"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className="rounded-full bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Proses Pemasangan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// Icon Helper
function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    )
}
