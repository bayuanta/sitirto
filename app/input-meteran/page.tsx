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
    Settings,
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
    Settings,
    GripVertical,
    MapPin,
    Share2, 
    Camera,
    AlertTriangle,
    Droplets,
    CheckCircle2,
    Printer,
    Download
} from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    getUnifiedBulkInputData,
    updateRouteOrder,
    assignCustomerGroup,
    getAreas,
    type CustomerSearch,
    type ActiveRate
} from "./actions";
import { SortableCustomerItem } from './SortableCustomerItem';

// Helper for Months
const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Format currency - Stable version
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
    const [selectedMonth, setSelectedMonth] = useState<number>(1);
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [mounted, setMounted] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [readyToShareBlob, setReadyToShareBlob] = useState<{ blob: Blob, fileName: string } | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // GROUP-BASED STATE
    const [selectedGroup, setSelectedGroup] = useState<'A' | 'B' | 'ALL'>('A');

    // AREA FILTER STATE
    const [areas, setAreas] = useState<{ id: number; name: string; code: string }[]>([]);
    const [selectedArea, setSelectedArea] = useState<string>('ALL');

    // Load saved preferences on mount (Client-side only)
    useEffect(() => {
        setMounted(true);
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());

        const savedGroup = localStorage.getItem('meter_reading_group') as 'A' | 'B' | 'ALL';
        if (savedGroup) setSelectedGroup(savedGroup);

        const savedArea = localStorage.getItem('meter_reading_area');
        if (savedArea) setSelectedArea(savedArea);
    }, []);

    // Data State
    const [customers, setCustomers] = useState<CustomerWithRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showYearDialog, setShowYearDialog] = useState(false);

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
    const [routeSearchTerm, setRouteSearchTerm] = useState("");

    // KEYBOARD NAVIGATION STATE
    const inputRefs = useRef<Record<number, HTMLInputElement>>({});
    const [focusedCustomerId, setFocusedCustomerId] = useState<number | null>(null);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            // Pass filters to backend
            const groupParam = selectedGroup === 'ALL' ? null : selectedGroup;
            const areaParam = selectedArea === 'ALL' ? null : selectedArea;

            let enriched;
            if (areas.length === 0) {
                // First load: Get customers + areas unified
                const { customers: cData, areas: aData } = await getUnifiedBulkInputData(selectedMonth, selectedYear, searchTerm, groupParam, areaParam);
                enriched = cData;
                setAreas(aData);
            } else {
                // Subsequent loads: Just customers
                enriched = await getBulkInputMeterData(selectedMonth, selectedYear, searchTerm, groupParam, areaParam);
            }

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
    }, [selectedMonth, selectedYear, searchTerm, selectedGroup, selectedArea]);

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
        formData.append("rate_override", getEffectiveRate(customer).toString());
        formData.append("maintenance_override", getEffectiveMaintenance(customer).toString());

        const res = await saveMeterRecord(formData);

        if (res.error) {
            toast.error(res.error);
        } else {
            if (res.auto_debit_applied) {
                const formatCurrency = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;
                if (res.bill_status === 'paid') {
                    toast.success(`✅ Tagihan ${formatCurrency(res.bill_amount)} Lunas (Auto-debit Saldo).`, { duration: 5000 });
                }
            } else {
                toast.success(`Data ${customer.nama} berhasil disimpan!`);
            }
            setCustomers(prev => prev.map(c => c.id === id ? { ...c, is_saved: true } : c));
        }

        setSavingIds(prev => prev.filter(pid => pid !== id));
    };

    const handleGroupChange = (group: 'A' | 'B' | 'ALL') => {
        setSelectedGroup(group);
        localStorage.setItem('meter_reading_group', group);
    };

    const handleKeyDown = (e: React.KeyboardEvent, customer: CustomerWithRate, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveRow(customer.id);
            if (index < filteredCustomers.length - 1) {
                const nextCustomer = filteredCustomers[index + 1];
                setTimeout(() => {
                    inputRefs.current[nextCustomer.id]?.focus();
                    setFocusedCustomerId(nextCustomer.id);
                }, 100);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                if (index > 0) {
                    const prevCustomer = filteredCustomers[index - 1];
                    inputRefs.current[prevCustomer.id]?.focus();
                    setFocusedCustomerId(prevCustomer.id);
                }
            } else {
                if (index < filteredCustomers.length - 1) {
                    const nextCustomer = filteredCustomers[index + 1];
                    inputRefs.current[nextCustomer.id]?.focus();
                    setFocusedCustomerId(nextCustomer.id);
                }
            }
        } else if (e.key === ' ') {
            e.preventDefault();
            if (!customer.is_saved && customer.prev_usage !== undefined) {
                const effectiveMeterLast = meterReplacements[customer.id] ? parseInt(manualMeterLast[customer.id] || "0") : customer.meter_lalu;
                handleInputChange(customer.id, String(effectiveMeterLast + customer.prev_usage));
            }
        }
    };

    const handleSaveAll = async () => {
        const toSave = filteredCustomers.filter(c => {
            const val = inputs[c.id];
            if (!val) return false;
            const effectiveMeterLast = meterReplacements[c.id] ? parseInt(manualMeterLast[c.id] || "0") : c.meter_lalu;
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
            const effectiveMeterLast = meterReplacements[c.id] ? parseInt(manualMeterLast[c.id] || "0") : c.meter_lalu;

            const formData = new FormData();
            formData.append("pelanggan_id", c.id.toString());
            formData.append("meteran_awal", effectiveMeterLast.toString());
            formData.append("meteran_akhir", val!);
            formData.append("bulan", selectedMonth.toString());
            formData.append("tahun", selectedYear.toString());
            formData.append("is_replacement", meterReplacements[c.id] ? "true" : "false");
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

    const handleOpenRouteEditor = () => {
        setRouteOrder([...customers]);
        setRouteSearchTerm("");
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
        const updates = routeOrder.map((c, idx) => ({ id: c.id, order: idx + 1 }));
        const result = await updateRouteOrder(updates, selectedGroup as string);
        if (result.success) {
            toast.success(`Urutan rute berhasil disimpan`);
            setShowRouteEditor(false);
            loadData();
        } else {
            toast.error(result.error || 'Gagal menyimpan urutan');
        }
    };

    const sortRouteBySR = () => {
        const sorted = [...routeOrder].sort((a, b) => {
            return a.no_pelanggan.localeCompare(b.no_pelanggan, undefined, { numeric: true, sensitivity: 'base' });
        });
        setRouteOrder(sorted);
        toast.success("Diurutkan berdasarkan No. SR");
    };

    const sortRouteByName = () => {
        const sorted = [...routeOrder].sort((a, b) => a.nama.localeCompare(b.nama));
        setRouteOrder(sorted);
        toast.success("Diurutkan berdasarkan Nama");
    };

    const sortRouteByArea = () => {
        const sorted = [...routeOrder].sort((a, b) => {
            const areaA = a.area_name || "";
            const areaB = b.area_name || "";
            // Sort by area first, then by connection number
            if (areaA !== areaB) return areaA.localeCompare(areaB);
            return a.no_pelanggan.localeCompare(b.no_pelanggan, undefined, { numeric: true });
        });
        setRouteOrder(sorted);
        toast.success("Diurutkan berdasarkan Wilayah");
    };

    const handleOrderChange = (id: number, newIndex: number) => {
        const oldIndex = routeOrder.findIndex(c => c.id === id);
        if (oldIndex === -1) return;
        
        // Ensure newIndex is within bounds
        const safeIndex = Math.max(0, Math.min(newIndex, routeOrder.length - 1));
        
        if (oldIndex === safeIndex) return;

        setRouteOrder(prev => {
            const newOrder = [...prev];
            const [item] = newOrder.splice(oldIndex, 1);
            newOrder.splice(safeIndex, 0, item);
            return newOrder;
        });

        const customerName = routeOrder[oldIndex].nama;
        toast.success(`Berhasil memindah ${customerName} ke urutan #${safeIndex + 1}`, {
            id: `move-${id}`, // Prevent toast spam
            duration: 2000
        });
    };

    const handleShareWhatsApp = (c: CustomerWithRate) => {
        const currentVal = inputs[c.id];
        if (!currentVal && !c.is_saved) return;
        
        const effectiveMeterLast = meterReplacements[c.id] ? parseInt(manualMeterLast[c.id] || "0") : c.meter_lalu;
        const currentNum = c.is_saved && c.current_value_if_saved ? c.current_value_if_saved : parseInt(currentVal);
        const usage = currentNum - effectiveMeterLast;
        const total = c.is_saved && c.saved_bill_amount ? c.saved_bill_amount : (usage * getEffectiveRate(c)) + getEffectiveMaintenance(c);
        
        const monthName = MONTHS[selectedMonth - 1];
        const message = `*TAGIHAN AIR PAMSIMAS TIRTOWENING*%0A` +
                        `--------------------------------------%0A` +
                        `Pelanggan: *${c.nama}*%0A` +
                        `No. SR: *${c.no_pelanggan}*%0A` +
                        `Periode: *${monthName} ${selectedYear}*%0A` +
                        `--------------------------------------%0A` +
                        `Meter Lalu: ${effectiveMeterLast} m³%0A` +
                        `Meter Sekarang: ${currentNum} m³%0A` +
                        `Pemakaian: *${usage} m³*%0A` +
                        `--------------------------------------%0A` +
                        `*TOTAL TAGIHAN: ${formatRupiah(total)}*%0A` +
                        `--------------------------------------%0A` +
                        `Mohon segera melakukan pembayaran. Terima kasih.`;
        
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleExportPdf = async () => {
        const savedCustomersList = filteredCustomers.filter(c => c.is_saved);
        if (savedCustomersList.length === 0) {
            toast.error("Belum ada data tagihan untuk dicetak.");
            return;
        }
        try {
            setIsExporting(true);
            toast.loading("Membuat dokumen PDF...", { id: 'export-toast' });
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const doc = new jsPDF('p', 'pt', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            
            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("PAMSIMAS TIRTOWENING", pageWidth / 2, 40, { align: "center" });
            
            doc.setFontSize(12);
            doc.text("DAFTAR TAGIHAN AIR", pageWidth / 2, 60, { align: "center" });
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Periode: ${MONTHS[selectedMonth - 1]} ${selectedYear}`, pageWidth / 2, 75, { align: "center" });
            
            if (selectedGroup !== 'ALL') {
                 doc.text(`Kelompok: ${selectedGroup}`, pageWidth / 2, 90, { align: "center" });
            }

            // Prepare Data
            type CustomerForExport = (typeof savedCustomersList)[0];
            const grouped = Object.entries(savedCustomersList.reduce((acc, c) => {
                const area = c.area_name || 'Tanpa Wilayah';
                if (!acc[area]) acc[area] = [];
                acc[area].push(c);
                return acc;
            }, {} as Record<string, CustomerForExport[]>));

            let finalY = 110;

            for (let i = 0; i < grouped.length; i++) {
                const [area, areaCustomers] = grouped[i];
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`WILAYAH: ${area.toUpperCase()}`, 40, finalY + 15);
                
                const tableData = areaCustomers.map((c, idx) => {
                    const usage = (c.current_value_if_saved || 0) - c.meter_lalu;
                    return [
                        (idx + 1).toString(),
                        c.no_pelanggan,
                        c.nama,
                        `${usage} m³`,
                        formatRupiah(c.saved_bill_amount || 0).replace('Rp ', '')
                    ];
                });

                autoTable(doc, {
                    startY: finalY + 25,
                    head: [['NO', 'NO PEL', 'NAMA PELANGGAN', 'PAKAI', 'TAGIHAN (Rp)']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 5 },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 35 },
                        1: { halign: 'center', cellWidth: 70 },
                        2: { halign: 'left' },
                        3: { halign: 'center', cellWidth: 60 },
                        4: { halign: 'right', cellWidth: 90 },
                    },
                    margin: { left: 40, right: 40 }
                });
                
                finalY = (doc as any).lastAutoTable.finalY + 15;
                
                // Add page break if next area won't fit well
                if (i < grouped.length - 1 && finalY > doc.internal.pageSize.getHeight() - 100) {
                    doc.addPage();
                    finalY = 40;
                }
            }

            const fileName = `Tagihan_Air_Kel_${selectedGroup}_${MONTHS[selectedMonth - 1]}_${selectedYear}.pdf`;
            const blob = doc.output('blob');
            setReadyToShareBlob({ blob, fileName });
            setShowShareDialog(true);
            toast.dismiss('export-toast');
            
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat PDF.", { id: 'export-toast' });
        } finally {
            setIsExporting(false);
        }
    };

    if (!mounted) {
        return (
            <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm p-6 min-h-[80vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm font-medium text-slate-500">Menyiapkan Aplikasi...</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm p-6 min-h-[80vh] flex flex-col relative pb-24">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="flex-1 w-full md:w-auto">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Meter</h1>
                        <div className="flex items-center gap-3 mt-1.5 w-full md:w-80">
                            <Progress value={progressPercent} className="h-2 flex-1 rounded-full bg-slate-100" />
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{mounted ? progressPercent : 0}% Selesai</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Button 
                            onClick={() => window.open(`/print-form-meteran?group=${selectedGroup}&area=${selectedArea}&month=${selectedMonth}&year=${selectedYear}`, '_blank')}
                            variant="outline"
                            className="w-full sm:w-auto h-11 md:h-10 px-6 rounded-xl md:rounded-full font-black text-xs gap-2 shadow-sm border-slate-200 hover:bg-slate-50"
                        >
                            <Printer className="h-4 w-4" />
                            CETAK FORM KOSONG
                        </Button>
                        <Button 
                            onClick={handleExportPdf}
                            disabled={isExporting || customers.filter(c => c.is_saved).length === 0}
                            className="w-full sm:w-auto h-11 md:h-10 px-6 rounded-xl md:rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 font-black text-xs gap-2 shadow-sm"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            DOWNLOAD PDF TAGIHAN
                        </Button>
                    </div>
                </div>

                {/* --- RESPONSIVE TOOLBAR --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-50/50 md:bg-white p-3 md:p-0 rounded-2xl md:rounded-0 border md:border-0 border-slate-200 shadow-sm md:shadow-none">
                    
                    {/* 1. Group Selection - Full Width on Mobile, Compact on PC */}
                    <div className="bg-slate-100 p-1 rounded-xl flex w-full md:w-auto">
                        {['A', 'B', 'ALL'].map((g) => (
                            <button
                                key={g}
                                onClick={() => handleGroupChange(g as 'A' | 'B' | 'ALL')}
                                className={cn(
                                    "flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[10px] md:text-xs font-black transition-all whitespace-nowrap",
                                    (mounted && selectedGroup === g)
                                        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                {g === 'ALL' ? 'SEMUA' : (mounted ? `KELOMPOK ${g}` : `KELOMPOK ...`)}
                            </button>
                        ))}
                    </div>

                    {/* 2. Right Side Filters: Wilayah, Month, Year */}
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
                        
                        {/* Wilayah - Full Width Mobile, Fixed Width PC */}
                        <div className="relative w-full md:w-[180px]">
                            <Label htmlFor="meter-area-filter" className="sr-only">Filter Wilayah</Label>
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
                            <Select name="meter-area-filter" value={selectedArea} onValueChange={setSelectedArea}>
                                <SelectTrigger id="meter-area-filter" className="pl-9 h-11 md:h-10 bg-white border-slate-200 rounded-xl md:rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm md:shadow-none">
                                    <SelectValue placeholder="Wilayah" />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value="ALL" className="font-bold">Semua Wilayah</SelectItem>
                                    {areas.map(area => (
                                        <SelectItem key={area.id} value={area.id.toString()} className="font-medium">{area.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Group: Month & Year Side-by-Side */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-[130px]">
                                <Label htmlFor="meter-month-filter" className="sr-only">Filter Bulan</Label>
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
                                <Select name="meter-month-filter" value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger id="meter-month-filter" className="pl-9 h-11 md:h-10 bg-white border-slate-200 rounded-xl md:rounded-lg text-[10px] md:text-xs font-bold text-slate-700 shadow-sm md:shadow-none uppercase">
                                        <SelectValue placeholder={mounted ? MONTHS[selectedMonth - 1] : "..."} />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        {MONTHS.map((m, i) => (
                                            <SelectItem key={i} value={(i + 1).toString()} className="font-semibold uppercase text-[10px]">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative flex-1 md:w-[100px]">
                                <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
                                <div className="h-11 md:h-10 bg-white border border-slate-200 rounded-xl md:rounded-lg flex items-center pl-9 pr-3 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm md:shadow-none" onClick={() => setShowYearDialog(true)}>
                                    <span className="text-[10px] md:text-xs font-black text-slate-700">{mounted ? selectedYear : "...."}</span>
                                    <ChevronDown className="ml-auto h-3 w-3 text-slate-400" />
                                </div>

                                <Dialog open={showYearDialog} onOpenChange={setShowYearDialog}>
                                    <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden border-0 shadow-2xl">
                                        <DialogHeader className="p-6 bg-indigo-600 text-white space-y-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Pilih Tahun</p>
                                            <DialogTitle className="text-2xl font-black text-white">{selectedYear}</DialogTitle>
                                        </DialogHeader>
                                        <div className="p-4 bg-white">
                                            <div className="grid grid-cols-3 gap-2">
                                                {Array.from({ length: 12 }).map((_, i) => {
                                                    const currentYear = new Date().getFullYear();
                                                    const year = (currentYear - 5) + i;
                                                    return (
                                                        <button
                                                            key={year}
                                                            onClick={() => {
                                                                setSelectedYear(year);
                                                                setShowYearDialog(false);
                                                            }}
                                                            className={cn(
                                                                "h-12 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                                                                selectedYear === year 
                                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                                                    : "text-slate-500 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            {year}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative w-full mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        id="meter-search"
                        name="meter-search"
                        placeholder="Cari nama pelanggan atau No. SR..."
                        className="pl-10 h-10 rounded-full bg-slate-50 border-0 font-medium text-xs w-full"
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
                            className="gap-2 text-xs font-bold bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            <Settings className="h-4 w-4" />
                            Atur Urutan Rute {mounted ? selectedGroup : "..."}
                        </Button>
                    </div>
                )}

                <div className="flex-1 space-y-4">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <Search className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Tidak ada pelanggan ditemukan.</p>
                        </div>
                    ) : (
                        filteredCustomers.map((c, index) => {
                            const currentVal = inputs[c.id] || "";
                            const currentNum = parseInt(currentVal);
                            const hasInput = currentVal !== "";
                            const effectiveMeterLast = meterReplacements[c.id] ? parseInt(manualMeterLast[c.id] || "0") : c.meter_lalu;
                            const usage = hasInput ? currentNum - effectiveMeterLast : null;
                            const isNegative = usage !== null && usage < 0;
                            const isSaving = savingIds.includes(c.id);
                            const isEditingThis = editingRateId === c.id;
                            const hasOverride = isRateOverridden(c);
                            const effectiveRate = getEffectiveRate(c);
                            const effectiveMaintenance = getEffectiveMaintenance(c);
                            const computedBill = usage !== null && usage >= 0 ? (usage * effectiveRate) + effectiveMaintenance : null;
                            const displayBill = c.is_saved && c.saved_bill_amount !== undefined ? c.saved_bill_amount : computedBill;

                            return (
                                <div key={c.id} className={cn(
                                    "relative flex flex-col md:flex-row items-center p-4 md:py-3 md:px-4 rounded-2xl md:rounded-xl border border-l-4 transition-all gap-4 md:gap-0 overflow-hidden",
                                    c.is_saved ? "bg-emerald-50/40 border-emerald-100 border-l-emerald-400 opacity-70" : focusedCustomerId === c.id ? "bg-indigo-50 border-indigo-200 border-l-indigo-600 shadow-md" : "bg-white border-slate-100 shadow-sm"
                                )}>
                                    {c.is_saved && (
                                        <div className="md:hidden absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Tersimpan</div>
                                    )}

                                    <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                                        <Avatar className="h-10 w-10 md:h-9 md:w-9 border-2 border-white bg-white shadow-sm">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.nama}`} />
                                            <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-bold">{c.nama.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate">{c.nama}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 rounded-sm">SR: {c.no_pelanggan}</span>
                                                {hasOverride && <Badge className="bg-amber-100 text-amber-700 border-0 text-[8px] px-1.5 py-0 h-4 font-bold uppercase tracking-widest">Override</Badge>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 w-full md:hidden">
                                        <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Bulan Lalu</p>
                                            {c.prev_usage !== undefined ? (
                                                <div className="flex flex-col"><span className="text-xs font-black text-slate-700">{c.prev_usage} m³</span></div>
                                            ) : <span className="text-xs font-medium text-slate-300">-</span>}
                                        </div>
                                        <div className={cn("p-2 rounded-xl border", meterReplacements[c.id] ? "bg-amber-50 border-amber-100" : "bg-slate-50/80")}>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Meter Lalu</p>
                                            <div className="flex flex-col gap-1">
                                                {meterReplacements[c.id] ? (
                                                    <Input 
                                                        id={`meter-last-mobile-${c.id}`}
                                                        name={`meter-last-mobile-${c.id}`}
                                                        type="number" 
                                                        className="h-6 w-full rounded-lg text-center text-[11px] font-black" 
                                                        value={manualMeterLast[c.id] || "0"} 
                                                        onChange={(e) => setManualMeterLast(prev => ({ ...prev, [c.id]: e.target.value }))} 
                                                        disabled={c.is_saved} 
                                                    />
                                                ) : <span className="text-xs font-black text-slate-700">{c.meter_lalu}</span>}
                                                <div className="flex items-center gap-1">
                                                    <Switch checked={meterReplacements[c.id] || false} onCheckedChange={(checked) => { setMeterReplacements(prev => ({ ...prev, [c.id]: checked })); if (checked) setManualMeterLast(prev => ({ ...prev, [c.id]: "0" })); }} disabled={c.is_saved} className="h-3 w-5" />
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Ganti</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex w-24 flex-col items-center">
                                        <span className="text-[10px] font-bold text-slate-400">BULAN LALU</span>
                                        <span className="font-mono text-xs font-black text-slate-700">{mounted ? (c.prev_usage ?? 0) : 0} m³</span>
                                    </div>

                                    <div className="hidden md:flex w-32 flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Meter Lalu</span>
                                        <div className="flex items-center gap-2">
                                            {meterReplacements[c.id] ? (
                                                <Input 
                                                    id={`meter-last-desktop-${c.id}`}
                                                    name={`meter-last-desktop-${c.id}`}
                                                    type="number" 
                                                    className="w-16 h-7 text-center text-xs font-black bg-amber-50 border-amber-200" 
                                                    value={manualMeterLast[c.id] || "0"} 
                                                    onChange={(e) => setManualMeterLast(prev => ({ ...prev, [c.id]: e.target.value }))} 
                                                    disabled={c.is_saved} 
                                                />
                                            ) : <span className="font-mono text-xs font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded">{mounted ? c.meter_lalu : "..."}</span>}
                                            <div className="flex items-center gap-1">
                                                <Switch checked={meterReplacements[c.id] || false} onCheckedChange={(checked) => { setMeterReplacements(prev => ({ ...prev, [c.id]: checked })); if (checked) setManualMeterLast(prev => ({ ...prev, [c.id]: "0" })); }} disabled={c.is_saved} className="h-3.5 w-6" />
                                                <span className="text-[8px] font-black text-slate-400">GANTI</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-40 flex flex-col items-center gap-1.5">
                                        <div className="relative w-full md:w-32">
                                            <div className="md:hidden absolute -top-4 left-0"><p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Meter Sekarang</p></div>
                                            <Input
                                                id={`meter-current-${c.id}`}
                                                name={`meter-current-${c.id}`}
                                                ref={(el) => { if (el) inputRefs.current[c.id] = el; }}
                                                type="number"
                                                placeholder="Input Angka..."
                                                className={cn(
                                                    "rounded-xl text-center font-black h-12 md:h-10 transition-all",
                                                    c.is_saved ? "bg-transparent border-0 text-emerald-700 text-lg" : "bg-slate-100 focus:bg-white focus:border-indigo-500",
                                                    isNegative && "bg-rose-50 border-rose-300 text-rose-700"
                                                )}
                                                value={currentVal}
                                                onChange={(e) => handleInputChange(c.id, e.target.value)}
                                                onFocus={() => setFocusedCustomerId(c.id)}
                                                onKeyDown={(e) => handleKeyDown(e, c, index)}
                                                disabled={c.is_saved || isSaving}
                                            />
                                        </div>
                                        {!c.is_saved && c.prev_usage !== undefined && (
                                            <button 
                                                onClick={() => {
                                                    const lastMeterValue = meterReplacements[c.id] ? parseInt(manualMeterLast[c.id] || "0") : c.meter_lalu;
                                                    handleInputChange(c.id, String(lastMeterValue + (c.prev_usage || 0)));
                                                }}
                                                className="md:hidden text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 active:bg-indigo-200"
                                            >
                                                Saran: {mounted ? (c.meter_lalu + (c.prev_usage || 0)) : "..."} m³
                                            </button>
                                        )}
                                    </div>

                                    <div className="w-full md:w-24 flex justify-between md:justify-center items-center">
                                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Pakai:</span>
                                        <div className={cn("flex items-center gap-1 font-black text-sm md:text-xs", isNegative ? "text-rose-600" : usage !== null && usage > 0 ? "text-indigo-600" : "text-slate-400")}>
                                            {isNegative ? <AlertTriangle className="h-3 w-3" /> : usage !== null && usage > 0 ? <Droplets className="h-3 w-3" /> : null}
                                            {mounted && usage !== null ? `${usage} m³` : "-"}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-28 flex justify-between md:justify-center items-center border-t border-slate-50 md:border-0 pt-2 md:pt-0">
                                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-tighter">Tagihan:</span>
                                        <div className="text-right">
                                            <p className={cn("text-sm font-black", c.is_saved ? "text-emerald-700" : "text-slate-900")}>
                                                {mounted && displayBill !== null ? formatRupiah(displayBill) : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-16 flex justify-center mt-2 md:mt-0">
                                        {c.is_saved ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm"><CheckCircle2 className="h-6 w-6" /></div>
                                                <Button size="icon" variant="ghost" onClick={() => handleShareWhatsApp(c)} className="h-9 w-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 border border-green-100">
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" onClick={() => handleSaveRow(c.id)} disabled={!hasInput || isNegative || isSaving} className={cn("h-11 w-full md:h-9 md:w-9 rounded-xl md:rounded-full font-black", hasInput && !isNegative ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-300")}>
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 md:h-4 md:w-4" />}
                                                <span className="md:hidden ml-2 font-black">SIMPAN DATA</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                
                {selectedGroup !== 'ALL' && (
                    <div className="fixed bottom-6 right-6 z-50 md:hidden">
                        <Button onClick={handleSaveAll} className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center border-4 border-white hover:scale-110 transition-all">
                            <Save className="h-6 w-6" />
                        </Button>
                    </div>
                )}
                
                <div className="hidden md:flex fixed bottom-8 right-8 z-50">
                    <Button onClick={handleSaveAll} className="h-14 px-8 rounded-full bg-indigo-600 text-white shadow-2xl font-black gap-3 border-4 border-white hover:scale-105 transition-all">
                        <Save className="h-6 w-6" />
                        SIMPAN SEMUA DATA
                    </Button>
                </div>

                {/* --- ROUTE EDITOR DIALOG --- */}
                <Dialog open={showRouteEditor} onOpenChange={setShowRouteEditor}>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-[24px]">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-xl font-bold">Atur Urutan Rute - Kelompok {selectedGroup}</DialogTitle>
                            <DialogDescription>
                                Geser dan lepas (drag & drop) untuk mengatur urutan rute penagihan.
                            </DialogDescription>
                            <div className="flex gap-2 mt-4 pb-2 border-b border-slate-100">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={sortRouteBySR}
                                    className="text-[10px] font-bold h-8 rounded-lg bg-slate-50 gap-1"
                                >
                                    <RotateCcw className="h-3 w-3" /> Urut No. SR
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={sortRouteByName}
                                    className="text-[10px] font-bold h-8 rounded-lg bg-slate-50 gap-1"
                                >
                                    <RotateCcw className="h-3 w-3" /> Urut Nama
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={sortRouteByArea}
                                    className="text-[10px] font-bold h-8 rounded-lg bg-slate-50 gap-1"
                                >
                                    <RotateCcw className="h-3 w-3" /> Urut Wilayah
                                </Button>
                            </div>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                <Input 
                                    id="route-search"
                                    name="route-search"
                                    placeholder="Cari pelanggan di rute ini..." 
                                    value={routeSearchTerm}
                                    onChange={(e) => setRouteSearchTerm(e.target.value)}
                                    className="pl-8 h-8 rounded-lg bg-slate-100/50 border-none text-[10px] font-medium"
                                />
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 pt-2">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={routeOrder.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {routeOrder.map((customer, index) => {
                                            const matchesSearch = 
                                                customer.nama.toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
                                                customer.no_pelanggan.includes(routeSearchTerm);
                                            
                                            if (routeSearchTerm && !matchesSearch) return null;

                                            return (
                                                <SortableCustomerItem 
                                                    key={customer.id} 
                                                    id={customer.id} 
                                                    index={index}
                                                    customer={customer} 
                                                    onOrderChange={handleOrderChange}
                                                />
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowRouteEditor(false)}>Batal</Button>
                            <Button onClick={handleSaveRouteOrder} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                                Simpan Urutan Baru
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Share Dialog */}
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                    <DialogContent className="sm:max-w-[400px] rounded-3xl p-6 text-center flex flex-col items-center">
                        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900 text-center">Dokumen PDF Siap!</DialogTitle>
                            <DialogDescription className="text-center font-medium text-slate-500 mt-2">
                                Dokumen PDF tagihan berhasil dibuat dan siap dikirim. Silakan klik tombol di bawah ini:
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex flex-col gap-3 w-full mt-6">
                            <Button 
                                onClick={async () => {
                                    if (!readyToShareBlob) return;
                                    const file = new File([readyToShareBlob.blob], readyToShareBlob.fileName, { type: 'application/pdf' });
                                    if (navigator && navigator.share) {
                                        try {
                                            await navigator.share({ title: 'Tagihan Pamsimas', files: [file] });
                                            setShowShareDialog(false);
                                        } catch (e: any) {
                                            if (e.name !== 'AbortError') {
                                                toast.error("Browser tidak mendukung share langsung, silakan gunakan tombol Download.");
                                            }
                                        }
                                    } else {
                                        toast.error("Browser Anda tidak mendukung fitur share ini.");
                                    }
                                }}
                                className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm shadow-md"
                            >
                                <Share2 className="h-5 w-5 mr-2" /> Bagikan via WhatsApp
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    if (!readyToShareBlob) return;
                                    const url = URL.createObjectURL(readyToShareBlob.blob);
                                    const link = document.createElement('a');
                                    link.download = readyToShareBlob.fileName;
                                    link.href = url;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    setShowShareDialog(false);
                                }}
                                className="w-full h-12 rounded-xl border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                            >
                                <Save className="h-4 w-4 mr-2" /> Simpan ke Perangkat (Download)
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
