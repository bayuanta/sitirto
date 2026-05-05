"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
    Search,
    Check,
    Save,
    Calendar,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CalendarRange,
    Filter,
    Pencil,
    RotateCcw,
    X,
    Settings,
    GripVertical,
    MapPin, // Added MapPin
    Share2, Camera
} from "lucide-react";
import * as htmlToImage from 'html-to-image';
import { TagihanImageExport } from "@/components/TagihanImageExport";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// DND Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
    searchCustomers,
    getCustomerLastMeter,
    saveMeterRecord,
    getCustomerRateInfo,
    getBulkInputMeterData,
    updateRouteOrder,
    assignCustomerGroup,
    getAreas, // Added getAreas
    type CustomerSearch,
    type ActiveRate
} from "./actions";
import { SortableCustomerItem } from './SortableCustomerItem';

// Helper for Months
const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Format currency
const formatRupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

// Customer with rate info
type CustomerWithRate = CustomerSearch & {
    meter_lalu: number;
    is_saved: boolean;
    defaultRate: number;
    defaultMaintenance: number;
    current_value_if_saved?: number | null;
    saved_bill_amount?: number | null;
    prev_usage?: number;
    prev_bill?: number;
    area_name?: string;
};

export default function InputMeteranPage() {
    // Session State
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // GROUP-BASED STATE
    const [selectedGroup, setSelectedGroup] = useState<'A' | 'B' | 'ALL'>('A');

    // AREA FILTER STATE
    const [areas, setAreas] = useState<{ id: number; name: string; code: string }[]>([]);
    const [selectedArea, setSelectedArea] = useState<string>('ALL');

    // Load saved preferences on mount (Client-side only)
    useEffect(() => {
        const savedGroup = localStorage.getItem('meter_reading_group') as 'A' | 'B' | 'ALL';
        if (savedGroup) setSelectedGroup(savedGroup);

        const savedArea = localStorage.getItem('meter_reading_area');
        if (savedArea) setSelectedArea(savedArea);
    }, []);

    // Data State
    const [customers, setCustomers] = useState<CustomerWithRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Inputs: { [customerId]: currentMeterValue }
    const [inputs, setInputs] = useState<Record<number, string>>({});

    // Meter Replacement State
    const [meterReplacements, setMeterReplacements] = useState<Record<number, boolean>>({});
    const [manualMeterLast, setManualMeterLast] = useState<Record<number, string>>({});

    // Rate Overrides: { [customerId]: { rate, maintenance, editing } }
    const [rateOverrides, setRateOverrides] = useState<Record<number, { rate: string; maintenance: string }>>({});
    const [editingRateId, setEditingRateId] = useState<number | null>(null);

    // Saving State
    const [savingIds, setSavingIds] = useState<number[]>([]);

    // ROUTE EDITOR STATE
    const [showRouteEditor, setShowRouteEditor] = useState(false);
    const [routeOrder, setRouteOrder] = useState<CustomerWithRate[]>([]);

    // KEYBOARD NAVIGATION STATE
    const inputRefs = useRef<Record<number, HTMLInputElement>>({});
    const [focusedCustomerId, setFocusedCustomerId] = useState<number | null>(null);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Areas if empty
            if (areas.length === 0) {
                const areaList = await getAreas();
                setAreas(areaList);
            }

            // Pass group filter to backend
            const groupParam = selectedGroup === 'ALL' ? null : selectedGroup;
            const areaParam = selectedArea === 'ALL' ? null : selectedArea;

            const enriched = await getBulkInputMeterData(selectedMonth, selectedYear, searchTerm, groupParam, areaParam);

            // Pre-fill inputs for saved records
            const newInputs: Record<number, string> = {};
            enriched.forEach((c: any) => {
                if (c.is_saved && c.current_value_if_saved !== null) {
                    newInputs[c.id] = c.current_value_if_saved.toString();
                }
            });
            setInputs(newInputs);
            setCustomers(enriched as CustomerWithRate[]);
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Gagal memuat data pelanggan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear, searchTerm, selectedGroup, selectedArea]); // Added selectedArea

    // Persist Group Selection
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('meter_reading_group', selectedGroup);
        }
    }, [selectedGroup]);

    // Persist Area Selection
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('meter_reading_area', selectedArea);
        }
    }, [selectedArea]);

    // Filter Logic
    const filteredCustomers = customers.filter(c =>
        c.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.no_pelanggan.includes(searchTerm)
    );

    // Progress
    const savedCount = customers.filter(c => c.is_saved).length;
    const progressPercent = customers.length > 0 ? Math.round((savedCount / customers.length) * 100) : 0;

    // Get effective rate for a customer (override or default)
    const getEffectiveRate = (c: CustomerWithRate) => {
        const override = rateOverrides[c.id];
        return override?.rate ? Number(override.rate) : c.defaultRate;
    };

    const getEffectiveMaintenance = (c: CustomerWithRate) => {
        const override = rateOverrides[c.id];
        return override?.maintenance ? Number(override.maintenance) : c.defaultMaintenance;
    };

    const isRateOverridden = (c: CustomerWithRate) => {
        const override = rateOverrides[c.id];
        if (!override) return false;
        return (override.rate && Number(override.rate) !== c.defaultRate) ||
            (override.maintenance && Number(override.maintenance) !== c.defaultMaintenance);
    };

    // Handlers
    const handleInputChange = (id: number, val: string) => {
        setInputs(prev => ({ ...prev, [id]: val }));
    };

    const handleStartEditRate = (id: number, c: CustomerWithRate) => {
        setEditingRateId(id);
        // Initialize with current values
        if (!rateOverrides[id]) {
            setRateOverrides(prev => ({
                ...prev,
                [id]: { rate: c.defaultRate.toString(), maintenance: c.defaultMaintenance.toString() }
            }));
        }
    };

    const handleRateChange = (id: number, field: 'rate' | 'maintenance', val: string) => {
        setRateOverrides(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: val }
        }));
    };

    const handleResetRate = (id: number, c: CustomerWithRate) => {
        setRateOverrides(prev => ({
            ...prev,
            [id]: { rate: c.defaultRate.toString(), maintenance: c.defaultMaintenance.toString() }
        }));
        setEditingRateId(null);
    };

    const handleConfirmRate = () => {
        setEditingRateId(null);
    };

    const handleSaveRow = async (id: number) => {
        const currentVal = inputs[id];
        if (!currentVal) return;

        const customer = customers.find(c => c.id === id);
        if (!customer) return;

        const current = parseInt(currentVal);
        const effectiveMeterLast = meterReplacements[id]
            ? parseInt(manualMeterLast[id] || "0")
            : customer.meter_lalu;

        // Only validate if NOT in replacement mode
        if (!meterReplacements[id] && current < customer.meter_lalu) {
            toast.error(`Meter akhir tidak boleh lebih kecil dari meter lalu (${customer.meter_lalu})`);
            return;
        }

        setSavingIds(prev => [...prev, id]);

        const formData = new FormData();
        formData.append("pelanggan_id", id.toString());
        formData.append("meteran_awal", effectiveMeterLast.toString());
        formData.append("meteran_akhir", current.toString());
        formData.append("bulan", selectedMonth.toString());
        formData.append("tahun", selectedYear.toString());
        formData.append("is_replacement", meterReplacements[id] ? "true" : "false");

        // Add rate overrides
        formData.append("rate_override", getEffectiveRate(customer).toString());
        formData.append("maintenance_override", getEffectiveMaintenance(customer).toString());

        const res = await saveMeterRecord(formData);

        if (res.error) {
            toast.error(res.error);
        } else {
            // Show informative toast based on auto-debit status
            if (res.auto_debit_applied) {
                const formatCurrency = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

                if (res.bill_status === 'paid') {
                    toast.success(
                        `✅ Berhasil! Tagihan ${formatCurrency(res.bill_amount)} Lunas (Auto-debit Saldo). Sisa saldo: ${formatCurrency(res.remaining_balance)}`,
                        { duration: 5000 }
                    );
                } else if (res.bill_status === 'partial') {
                    toast.success(
                        `✅ Berhasil! Terbayar ${formatCurrency(res.auto_debit_amount)} dari ${formatCurrency(res.bill_amount)} (Auto-debit Saldo). Sisa tagihan: ${formatCurrency(res.bill_amount - res.auto_debit_amount)}`,
                        { duration: 5000 }
                    );
                }
            } else {
                toast.success(`Data ${customer.nama} berhasil disimpan!`);
            }

            // Mark as saved locally
            setCustomers(prev => prev.map(c => c.id === id ? { ...c, is_saved: true } : c));
        }

        setSavingIds(prev => prev.filter(pid => pid !== id));
    };

    const handleSaveAll = async () => {
        // Find all saveable rows
        const toSave = filteredCustomers.filter(c => {
            const val = inputs[c.id];
            if (!val) return false;

            const effectiveMeterLast = meterReplacements[c.id]
                ? parseInt(manualMeterLast[c.id] || "0")
                : c.meter_lalu;

            return parseInt(val) >= effectiveMeterLast && !c.is_saved;
        });

        if (toSave.length === 0) {
            toast.info("Tidak ada data baru yang valid.");
            return;
        }

        toast.loading(`Menyimpan ${toSave.length} data...`);

        let successCount = 0;
        await Promise.all(toSave.map(async (c) => {
            const val = inputs[c.id];
            const effectiveMeterLast = meterReplacements[c.id]
                ? parseInt(manualMeterLast[c.id] || "0")
                : c.meter_lalu;

            const formData = new FormData();
            formData.append("pelanggan_id", c.id.toString());
            formData.append("meteran_awal", effectiveMeterLast.toString());
            formData.append("meteran_akhir", val!);
            formData.append("bulan", selectedMonth.toString());
            formData.append("tahun", selectedYear.toString());
            formData.append("is_replacement", meterReplacements[c.id] ? "true" : "false");

            // Add rate overrides
            formData.append("rate_override", getEffectiveRate(c).toString());
            formData.append("maintenance_override", getEffectiveMaintenance(c).toString());

            const res = await saveMeterRecord(formData);
            if (!res.error) {
                successCount++;
                setCustomers(prev => prev.map(cust => cust.id === c.id ? { ...cust, is_saved: true } : cust));
            }
        }));

        toast.dismiss();
        if (successCount > 0) toast.success(`${successCount} data berhasil disimpan!`);
    };

    // GROUP CHANGE HANDLER
    const handleGroupChange = (group: 'A' | 'B' | 'ALL') => {
        setSelectedGroup(group);
        localStorage.setItem('meter_reading_group', group);
        // Data will reload automatically via useEffect dependency
    };

    // KEYBOARD NAVIGATION HANDLER
    const handleKeyDown = (e: React.KeyboardEvent, customer: CustomerWithRate, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Save current row
            handleSaveRow(customer.id);

            // Move to next customer in filtered list
            if (index < filteredCustomers.length - 1) {
                const nextCustomer = filteredCustomers[index + 1];
                setTimeout(() => {
                    inputRefs.current[nextCustomer.id]?.focus();
                    setFocusedCustomerId(nextCustomer.id);
                }, 100); // Small delay to ensure save completes
            } else {
                // End of list notification
                toast.success(`✅ Input Kelompok ${selectedGroup} Selesai!`, {
                    description: `Semua ${filteredCustomers.length} pelanggan telah diinput.`
                });
            }
        } else if (e.key === 'Tab') {
            e.preventDefault(); // Prevent default tab behavior
            
            if (e.shiftKey) {
                // Move to PREVIOUS customer
                if (index > 0) {
                    const prevCustomer = filteredCustomers[index - 1];
                    inputRefs.current[prevCustomer.id]?.focus();
                    setFocusedCustomerId(prevCustomer.id);
                }
            } else {
                // Move to NEXT customer
                if (index < filteredCustomers.length - 1) {
                    const nextCustomer = filteredCustomers[index + 1];
                    inputRefs.current[nextCustomer.id]?.focus();
                    setFocusedCustomerId(nextCustomer.id);
                }
            }
        } else if (e.key === ' ') {
            // Spacebar as shortcut to autofill recommendation
            e.preventDefault();
            if (!customer.is_saved && customer.prev_usage !== undefined) {
                const effectiveMeterLast = meterReplacements[customer.id]
                    ? parseInt(manualMeterLast[customer.id] || "0")
                    : customer.meter_lalu;
                handleInputChange(customer.id, String(effectiveMeterLast + customer.prev_usage));
            }
        }
    };

    // ROUTE EDITOR HANDLERS
    const handleOpenRouteEditor = () => {
        setRouteOrder([...customers]); // Clone current order
        setShowRouteEditor(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setRouteOrder((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveRouteOrder = async () => {
        const updates = routeOrder.map((c, idx) => ({
            id: c.id,
            order: idx + 1
        }));

        const result = await updateRouteOrder(updates, selectedGroup as string);

        if (result.success) {
            toast.success(`Urutan rute Kelompok ${selectedGroup} berhasil disimpan`);
            setShowRouteEditor(false);
            loadData(); // Reload with new order
        } else {
            toast.error(result.error || 'Gagal menyimpan urutan');
        }
    };

    // DND SENSORS
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleExportImage = async () => {
        if (!exportRef.current) return;
        
        const hasSaved = filteredCustomers.some(c => c.is_saved);
        if (!hasSaved) {
            toast.error("Belum ada data tagihan yang tersimpan untuk dibagikan.");
            return;
        }

        try {
            setIsExporting(true);
            toast.loading("Mempersiapkan gambar tagihan...", { id: 'export-toast' });

            // Small delay to ensure the component is rendered properly off-screen
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await htmlToImage.toJpeg(exportRef.current, { 
                quality: 0.95,
                backgroundColor: '#ffffff',
                pixelRatio: 2 // High resolution
            });

            // If Web Share API is available (usually on mobile)
            if (navigator && navigator.share) {
                try {
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], `Tagihan_Kel_${selectedGroup}_${MONTHS[selectedMonth-1]}_${selectedYear}.jpg`, { type: 'image/jpeg' });
                    await navigator.share({
                        title: 'Daftar Tagihan Pamsimas',
                        text: `Daftar Tagihan Air Pamsimas Kelompok ${selectedGroup} Bulan ${MONTHS[selectedMonth-1]} ${selectedYear}`,
                        files: [file]
                    });
                    toast.success("Gambar berhasil dibagikan!", { id: 'export-toast' });
                } catch (shareError: any) {
                    // Fallback to download if share is aborted or fails
                    if (shareError.name !== 'AbortError') {
                        triggerDownload(dataUrl);
                    }
                    toast.dismiss('export-toast');
                }
            } else {
                // Fallback to download for desktop
                triggerDownload(dataUrl);
                toast.success("Gambar berhasil diunduh!", { id: 'export-toast' });
            }
        } catch (error) {
            console.error("Failed to generate image", error);
            toast.error("Gagal membuat gambar tagihan.", { id: 'export-toast' });
        } finally {
            setIsExporting(false);
        }
    };

    const triggerDownload = (dataUrl: string) => {
        const link = document.createElement('a');
        link.download = `Tagihan_Kel_${selectedGroup}_${MONTHS[selectedMonth-1]}_${selectedYear}.jpg`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <TooltipProvider>
            <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm p-6 min-h-[80vh] flex flex-col relative pb-24">
                
                {/* Off-screen export component */}
                <TagihanImageExport 
                    ref={exportRef}
                    month={selectedMonth}
                    year={selectedYear}
                    group={selectedGroup}
                    areaName={selectedArea === 'ALL' ? 'Semua' : (areas.find(a => a.id.toString() === selectedArea)?.name || 'Semua')}
                    customers={filteredCustomers as any}
                />

                {/* GROUP TAB NAVIGATION */}
                {/* --- HEADER TITLE & PROGRESS --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="flex-1 w-full md:w-auto">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Meter</h1>
                        <div className="flex items-center gap-3 mt-1.5 w-full md:w-80">
                            <Progress value={progressPercent} className="h-2 flex-1 rounded-full bg-slate-100" />
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{progressPercent}% Selesai</span>
                        </div>
                    </div>
                </div>

                {/* --- HEADER --- */}
                {/* --- UNIFIED TOOLBAR --- */}
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center mb-6">

                    {/* LEFT: Segmented Group Tabs */}
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full md:w-auto">
                        {['A', 'B', 'ALL'].map((g) => (
                            <button
                                key={g}
                                onClick={() => handleGroupChange(g as 'A' | 'B' | 'ALL')}
                                className={cn(
                                    "flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all",
                                    selectedGroup === g
                                        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                {g === 'ALL' ? 'SEMUA' : `KELOMPOK ${g}`}
                            </button>
                        ))}
                    </div>

                    {/* RIGHT: Filters */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 justify-between md:justify-end">

                        {/* Wilayah Filter */}
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 z-10" />
                            <Select value={selectedArea} onValueChange={setSelectedArea}>
                                <SelectTrigger className="pl-9 h-10 bg-slate-50 border-0 font-bold text-xs text-slate-700 w-[160px] rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-slate-100">
                                    <SelectValue placeholder="Semua Wilayah" />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value="ALL" className="font-bold">Semua Wilayah</SelectItem>
                                    {areas.map(area => (
                                        <SelectItem key={area.id} value={area.id.toString()} className="font-medium">{area.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                        {/* Date Filter */}
                        <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-100/50">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm"
                                onClick={() => {
                                    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
                                    else { setSelectedMonth(m => m - 1); }
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-2 px-1">
                                {/* FILTER BULAN (Lebar 160px agar nama bulan panjang muat) */}
                                <div className="relative">
                                    {/* Icon Kalender (Pointer Events None agar tembus klik) */}
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="h-10 w-[160px] pl-10 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors uppercase"
                                    >
                                        {MONTHS.map((m, i) => (
                                            <option key={i} value={i + 1} className="font-semibold text-slate-700">{m}</option>
                                        ))}
                                    </select>

                                    {/* Chevron Custom (Pointer Events None) */}
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>

                                <span className="text-slate-300 font-light text-lg pb-0.5 select-none">/</span>

                                {/* FILTER TAHUN (Lebar 110px agar muat 4 digit + icon) */}
                                <div className="relative">
                                    <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="h-10 w-[110px] pl-10 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
                                    >
                                        {[2025, 2026, 2027, 2028, 2029].map((y) => (
                                            <option key={y} value={y} className="font-semibold text-slate-700">{y}</option>
                                        ))}
                                    </select>

                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm"
                                onClick={() => {
                                    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
                                    else { setSelectedMonth(m => m + 1); }
                                }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Export Image Button */}
                        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>
                        <Button
                            variant="outline"
                            onClick={handleExportImage}
                            disabled={isExporting || !filteredCustomers.some(c => c.is_saved)}
                            className="h-10 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 font-bold gap-2 ml-1"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                            <span className="hidden md:inline">Bagikan WA</span>
                        </Button>
                    </div>
                </div>


                {/* --- OLD HEADER HIDDEN --- */}
                <div className="hidden">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Meter</h1>
                            <Badge variant="secondary" className="rounded-full bg-indigo-50 text-indigo-700 border-indigo-100 border px-3 py-0.5 text-xs font-bold gap-1.5">
                                <Calendar className="h-3 w-3" /> {MONTHS[selectedMonth - 1]} {selectedYear}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-64">
                            <Progress value={progressPercent} className="h-2 flex-1 rounded-full bg-slate-100" />
                            <span className="text-[10px] font-bold text-slate-400">{progressPercent}% Selesai</span>
                        </div>
                    </div>

                    {/* Date Controls */}
                    {/* Date Controls - Professional Redesign */}
                    {/* Date Controls - Modern Floating Pill Design */}
                    <div className="flex items-center">
                        <div className="flex items-center bg-white rounded-full shadow-sm border border-slate-200/80 p-1 pr-2 gap-1 transition-shadow hover:shadow-md">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                                onClick={() => {
                                    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
                                    else { setSelectedMonth(m => m - 1); }
                                }}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>

                            <div className="flex items-center gap-0.5 px-1">
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger className="h-9 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 text-sm font-extrabold text-slate-800 w-auto min-w-[140px] px-3 justify-center gap-2 hover:bg-slate-50 transition-colors rounded-full">
                                        <span className="uppercase tracking-tight whitespace-nowrap">{MONTHS[selectedMonth - 1]}</span>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] z-[9999]">
                                        {MONTHS.map((m, i) => (
                                            <SelectItem key={i} value={(i + 1).toString()} className="font-semibold cursor-pointer">
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <span className="text-slate-300 font-light text-lg pb-0.5">/</span>

                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger className="h-9 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 text-sm font-extrabold text-slate-800 w-auto min-w-[90px] px-3 justify-center hover:bg-slate-50 transition-colors rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] z-[9999]">
                                        {[2026, 2027].map((y) => (
                                            <SelectItem key={y} value={y.toString()} className="font-semibold cursor-pointer">
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                                onClick={() => {
                                    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
                                    else { setSelectedMonth(m => m + 1); }
                                }}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- SEARCH BAR --- */}
                <div className="relative w-full md:w-full mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Cari nama pelanggan atau No. SR..."
                        className="pl-10 h-10 rounded-full bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500 font-medium text-xs placeholder:text-slate-400 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Route Editor Button */}
                {selectedGroup !== 'ALL' && (
                    <div className="mb-4 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={handleOpenRouteEditor}
                            className="gap-2"
                        >
                            <Settings className="h-4 w-4" />
                            Atur Urutan Rute {selectedGroup}
                        </Button>
                    </div>
                )}

                {/* --- LIST HEADER --- */}
                <div className="hidden md:flex px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-50">
                    <div className="flex-1">Pelanggan</div>
                    <div className="w-24 text-center">Bulan Lalu</div>
                    <div className="w-24 text-center">Meter Lalu</div>
                    <div className="w-32 text-center">Meter Saat Ini</div>
                    <div className="w-20 text-center">Pemakaian</div>
                    <div className="w-28 text-center">Tarif</div>
                    <div className="w-24 text-right">Tagihan</div>
                    <div className="w-12"></div>
                </div>

                {/* --- DATA LIST --- */}
                <div className="flex-1 space-y-1">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">Tidak ada pelanggan ditemukan.</div>
                    ) : (
                        filteredCustomers.map((c) => {
                            const currentVal = inputs[c.id] || "";
                            const currentNum = parseInt(currentVal);
                            const hasInput = currentVal !== "";

                            // Use manual meter_last if in replacement mode
                            const effectiveMeterLast = meterReplacements[c.id]
                                ? parseInt(manualMeterLast[c.id] || "0")
                                : c.meter_lalu;

                            const usage = hasInput ? currentNum - effectiveMeterLast : null;
                            const isNegative = usage !== null && usage < 0;
                            const isSaving = savingIds.includes(c.id);
                            const isEditingThis = editingRateId === c.id;
                            const hasOverride = isRateOverridden(c);

                            // Calculate Bill Preview
                            const effectiveRate = getEffectiveRate(c);
                            const effectiveMaintenance = getEffectiveMaintenance(c);
                            const computedBill = usage !== null && usage >= 0 ? (usage * effectiveRate) + effectiveMaintenance : null;
                            const displayBill = c.is_saved && c.saved_bill_amount !== undefined && c.saved_bill_amount !== null ? c.saved_bill_amount : computedBill;

                            return (
                                <div
                                    key={c.id}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center py-3 px-4 rounded-xl border border-l-4 transition-all md:h-auto min-h-[64px] gap-3 md:gap-0",
                                        c.is_saved
                                            ? "bg-emerald-50/40 border-emerald-100 border-l-emerald-400 opacity-60 hover:opacity-100"
                                            : focusedCustomerId === c.id
                                                ? "bg-indigo-50 border-indigo-100 border-l-indigo-600 shadow-sm"
                                                : "bg-white hover:bg-slate-50 border-slate-100 border-l-transparent"
                                    )}
                                >
                                    {/* 1. Customer Info */}
                                    <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                                        <Avatar className="h-9 w-9 border border-slate-100 bg-white shadow-sm">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.nama}`} />
                                            <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-bold">{c.nama.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-slate-900">{c.nama}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 rounded-sm">{c.no_pelanggan}</span>
                                                {hasOverride && (
                                                    <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] px-1.5 py-0 h-4">Override</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1.5 Bulan Lalu Info */}
                                    <div className="w-full md:w-24 flex justify-between md:justify-center items-center">
                                        <span className="md:hidden text-xs font-bold text-slate-400">Bulan Lalu:</span>
                                        {c.prev_usage !== undefined ? (
                                            <div className="flex flex-col items-end md:items-center">
                                                <span className="font-mono text-xs font-bold text-slate-600">{c.prev_usage} m³</span>
                                                <span className="text-[10px] text-slate-400">{formatRupiah(c.prev_bill || 0).replace('Rp', '')}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-medium italic">-</span>
                                        )}
                                    </div>

                                    {/* 2. Meter Lalu - WITH SWITCH */}
                                    <div className="w-full md:w-24 flex flex-col gap-1.5">
                                        <div className="flex justify-between md:justify-center items-center">
                                            <span className="md:hidden text-xs font-medium text-slate-500">Lalu:</span>
                                            {meterReplacements[c.id] ? (
                                                // Editable mode (replacement)
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-20 h-7 rounded-full text-center text-xs font-mono bg-amber-50 border-amber-200 focus-visible:ring-amber-500 text-amber-700 font-bold"
                                                    value={manualMeterLast[c.id] || "0"}
                                                    onChange={(e) => setManualMeterLast(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                    disabled={c.is_saved}
                                                />
                                            ) : (
                                                // Locked mode (default)
                                                <span className="font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-600 text-xs">{c.meter_lalu}</span>
                                            )}
                                        </div>

                                        {/* Switch for Meter Replacement */}
                                        <div className="flex items-center gap-1.5 justify-center">
                                            <Switch
                                                id={`replace-${c.id}`}
                                                checked={meterReplacements[c.id] || false}
                                                onCheckedChange={(checked) => {
                                                    setMeterReplacements(prev => ({ ...prev, [c.id]: checked }));
                                                    if (checked) {
                                                        setManualMeterLast(prev => ({ ...prev, [c.id]: "0" }));
                                                    }
                                                }}
                                                disabled={c.is_saved}
                                                className="h-4 w-7 data-[state=checked]:bg-amber-500"
                                            />
                                            <label
                                                htmlFor={`replace-${c.id}`}
                                                className={cn(
                                                    "text-[9px] cursor-pointer transition-colors",
                                                    meterReplacements[c.id] ? "text-amber-600 font-medium" : "text-slate-400"
                                                )}
                                            >
                                                Ganti Meter
                                            </label>
                                        </div>
                                    </div>

                                    {/* 3. Input Area */}
                                    <div className="w-full md:w-32 flex flex-col justify-center items-center py-1 gap-1">
                                        <div className="relative w-full md:w-24">
                                            <Input
                                                ref={(el) => { if (el) inputRefs.current[c.id] = el; }}
                                                type="number"
                                                placeholder="0"
                                                className={cn(
                                                    "rounded-full text-center font-bold h-9 bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500 pr-2 transition-all",
                                                    c.is_saved && "bg-transparent border-0 text-emerald-700 font-black",
                                                    isNegative && "bg-rose-50 border-2 border-rose-200 text-rose-700 focus-visible:ring-rose-500"
                                                )}
                                                value={currentVal}
                                                onChange={(e) => handleInputChange(c.id, e.target.value)}
                                                onFocus={() => setFocusedCustomerId(c.id)}
                                                onKeyDown={(e) => handleKeyDown(e, c, filteredCustomers.findIndex(cust => cust.id === c.id))}
                                                disabled={c.is_saved || isSaving}
                                            />
                                        </div>
                                        {!c.is_saved && c.prev_usage !== undefined && (
                                            <button 
                                                onClick={() => handleInputChange(c.id, String(effectiveMeterLast + (c.prev_usage || 0)))}
                                                className="text-[9px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                                                title="Klik atau tekan Spasi untuk mengisi otomatis"
                                                tabIndex={-1}
                                            >
                                                Saran: {effectiveMeterLast + c.prev_usage}
                                            </button>
                                        )}
                                    </div>

                                    {/* 4. Usage Indicator */}
                                    <div className="w-full md:w-20 flex justify-between md:justify-center items-center gap-2">
                                        <span className="md:hidden text-xs font-bold text-slate-400">Pakai:</span>
                                        {usage !== null ? (
                                            <div className={cn(
                                                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full animate-in fade-in zoom-in duration-200",
                                                isNegative ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-700"
                                            )}>
                                                {isNegative && <AlertCircle className="h-3 w-3" />}
                                                {isNegative ? "Error" : `+${usage} m³`}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-medium italic">-</span>
                                        )}
                                    </div>

                                    {/* 5. Rate Display / Edit - CLICK TO EDIT */}
                                    <div className="w-full md:w-28 flex justify-center items-center">
                                        {isEditingThis ? (
                                            // Edit Mode: Show input fields
                                            <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex flex-col gap-1">
                                                    <Input
                                                        type="number"
                                                        placeholder="Harga/m³"
                                                        className="h-7 w-20 text-[11px] text-center rounded-md border-slate-200 focus-visible:ring-indigo-500"
                                                        value={rateOverrides[c.id]?.rate || ""}
                                                        onChange={(e) => handleRateChange(c.id, 'rate', e.target.value)}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Abonemen"
                                                        className="h-7 w-20 text-[11px] text-center rounded-md border-slate-200 focus-visible:ring-indigo-500"
                                                        value={rateOverrides[c.id]?.maintenance || ""}
                                                        onChange={(e) => handleRateChange(c.id, 'maintenance', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                                                onClick={handleConfirmRate}
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Konfirmasi</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                                onClick={() => handleResetRate(c.id, c)}
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Reset ke Default</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ) : (
                                            // Display Mode: Show text with edit icon
                                            <button
                                                onClick={() => handleStartEditRate(c.id, c)}
                                                disabled={c.is_saved}
                                                className={cn(
                                                    "group flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all",
                                                    !c.is_saved && "hover:bg-slate-100 cursor-pointer",
                                                    c.is_saved && "cursor-default"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn(
                                                        "text-[11px] font-medium",
                                                        hasOverride ? "text-amber-700" : "text-slate-400"
                                                    )}>
                                                        {formatRupiah(getEffectiveRate(c))}/m³
                                                    </span>
                                                    {!c.is_saved && (
                                                        <Pencil className="h-3 w-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px]",
                                                    hasOverride ? "text-amber-600" : "text-slate-300"
                                                )}>
                                                    +{formatRupiah(getEffectiveMaintenance(c))}
                                                </span>
                                            </button>
                                        )}
                                    </div>

                                    {/* 6. Tagihan Preview */}
                                    <div className="w-full md:w-24 flex justify-between md:justify-end items-center md:pr-2">
                                        <span className="md:hidden text-xs font-bold text-slate-400">Tagihan:</span>
                                        {displayBill !== null ? (
                                            <span className="font-mono text-sm font-black text-slate-800">
                                                {formatRupiah(displayBill).replace('Rp', '')}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-medium italic">-</span>
                                        )}
                                    </div>

                                    {/* 7. Action Button */}
                                    <div className="w-full md:w-12 flex justify-end mt-2 md:mt-0">
                                        {c.is_saved ? (
                                            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <Check className="h-4 w-4" />
                                            </div>
                                        ) : (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className={cn(
                                                    "h-8 w-8 rounded-full transition-all",
                                                    hasInput && !isNegative
                                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform hover:scale-105"
                                                        : "text-slate-300 bg-slate-50 hover:bg-slate-100 cursor-not-allowed"
                                                )}
                                                disabled={!hasInput || isNegative || isSaving}
                                                onClick={() => handleSaveRow(c.id)}
                                            >
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- FLOATING BOTTOM ACTION BAR --- */}
                {filteredCustomers.some(c => inputs[c.id] && !c.is_saved) && (
                    <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50 animate-in slide-in-from-bottom-6 duration-300">
                        <div className="bg-slate-900/90 backdrop-blur-md text-white px-2 py-2 pr-6 rounded-full shadow-2xl flex items-center gap-4 pointer-events-auto border border-slate-700/50">
                            <div className="bg-indigo-600 h-9 w-9 rounded-full flex items-center justify-center animate-pulse">
                                <Save className="h-4 w-4" />
                            </div>
                            <div className="text-xs">
                                <p className="font-bold">Perubahan Belum Disimpan</p>
                                <p className="text-slate-400">Pastikan data sudah benar</p>
                            </div>
                            <Button
                                size="sm"
                                className="rounded-full bg-white text-slate-900 hover:bg-slate-200 font-bold ml-2 h-8"
                                onClick={handleSaveAll}
                            >
                                Simpan Semua
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ROUTE EDITOR DIALOG */}
            <Dialog open={showRouteEditor} onOpenChange={setShowRouteEditor}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Atur Urutan Rute Kelompok {selectedGroup}</DialogTitle>
                        <DialogDescription>
                            Drag dan drop untuk mengatur urutan sesuai rute lapangan
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={routeOrder.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {routeOrder.map((customer) => (
                                    <SortableCustomerItem
                                        key={customer.id}
                                        id={customer.id}
                                        customer={customer}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowRouteEditor(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSaveRouteOrder}>
                            Simpan Urutan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider >
    );
}
