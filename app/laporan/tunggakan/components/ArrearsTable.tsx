"use client";

import React from "react";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Phone,
    AlertTriangle,
    Clock,
    Filter,
    Printer
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

interface ArrearRecord {
    recordId: number;
    month: number;
    year: number;
    billAmount: number;
    paidAmount: number;
    outstanding: number;
    status: string;
    usage: number;
}

interface CustomerArrear {
    customerId: number;
    customerName: string;
    connectionNumber: string;
    phone: string;
    areaId: number;
    areaName: string;
    totalArrears: number;
    arrearRecords: ArrearRecord[];
    oldestMonth: string;
    monthsCount: number;
}

interface ArrearsTableProps {
    data: CustomerArrear[];
    areas: { id: number; name: string }[];
}

export function ArrearsTable({ data, areas }: ArrearsTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState("all");
    const [monthsFilter, setMonthsFilter] = useState("all");
    const [sortField, setSortField] = useState<"amount" | "months">("amount");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const itemsPerPage = 30;

    const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];

    // Filter & Sort
    const filteredData = useMemo(() => {
        let result = [...data];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.customerName.toLowerCase().includes(term) ||
                item.connectionNumber.toLowerCase().includes(term)
            );
        }

        if (areaFilter !== "all") {
            result = result.filter(item => item.areaId.toString() === areaFilter);
        }

        if (monthsFilter !== "all") {
            const threshold = parseInt(monthsFilter);
            result = result.filter(item => item.monthsCount >= threshold);
        }

        result.sort((a, b) => {
            if (sortField === "amount") {
                return sortDir === "asc"
                    ? a.totalArrears - b.totalArrears
                    : b.totalArrears - a.totalArrears;
            }
            return sortDir === "asc"
                ? a.monthsCount - b.monthsCount
                : b.monthsCount - a.monthsCount;
        });

        return result;
    }, [data, searchTerm, areaFilter, monthsFilter, sortField, sortDir]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const filteredTotal = filteredData.reduce((sum, c) => sum + c.totalArrears, 0);

    const toggleExpand = (customerId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(customerId)) {
            newExpanded.delete(customerId);
        } else {
            newExpanded.add(customerId);
        }
        setExpandedRows(newExpanded);
    };

    const toggleSort = (field: "amount" | "months") => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    };

    const toggleSelect = (customerId: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(customerId)) {
            newSelected.delete(customerId);
        } else {
            newSelected.add(customerId);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAllPage = () => {
        const pageCustomerIds = paginatedData.map(d => d.customerId);
        const allSelected = pageCustomerIds.length > 0 && pageCustomerIds.every(id => selectedIds.has(id));
        const newSelected = new Set(selectedIds);
        
        if (allSelected) {
            pageCustomerIds.forEach(id => newSelected.delete(id));
        } else {
            pageCustomerIds.forEach(id => newSelected.add(id));
        }
        setSelectedIds(newSelected);
    };

    const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(d => selectedIds.has(d.customerId));

    const handleExportCSV = () => {
        const headers = ["Nama", "No. Sambung", "Wilayah", "HP", "Total Tunggakan", "Bulan Tertunggak", "Sejak"];
        const rows = filteredData.map(c => [
            c.customerName,
            c.connectionNumber,
            c.areaName,
            c.phone,
            c.totalArrears,
            c.monthsCount,
            c.oldestMonth
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `tunggakan_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-4">
            {/* Filter Row */}
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative w-full sm:w-[260px]">
                        <Label htmlFor="arrears-search" className="sr-only">Cari Tunggakan</Label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="arrears-search"
                            name="arrears-search"
                            placeholder="Cari nama atau no. sambung..."
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-rose-300 transition-all rounded-xl text-sm h-10"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="flex flex-col">
                        <Label htmlFor="arrears-area-filter" className="sr-only">Filter Wilayah</Label>
                        <Select name="arrears-area-filter" value={areaFilter} onValueChange={(v) => { setAreaFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger id="arrears-area-filter" className="w-[150px] rounded-xl border-slate-200 bg-slate-50 h-10">
                                <SelectValue placeholder="Wilayah" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Wilayah</SelectItem>
                                {areas.map(area => (
                                    <SelectItem key={area.id} value={area.id.toString()}>{area.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col">
                        <Label htmlFor="arrears-months-filter" className="sr-only">Filter Jumlah Bulan</Label>
                        <Select name="arrears-months-filter" value={monthsFilter} onValueChange={(v) => { setMonthsFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger id="arrears-months-filter" className="w-[160px] rounded-xl border-slate-200 bg-slate-50 h-10">
                                <div className="flex items-center">
                                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                    <SelectValue placeholder="Lama Nunggak" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="1">≥ 1 Bulan</SelectItem>
                                <SelectItem value="3">≥ 3 Bulan</SelectItem>
                                <SelectItem value="6">≥ 6 Bulan</SelectItem>
                                <SelectItem value="12">≥ 12 Bulan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Summary & Actions */}
                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                        <span className="font-bold text-slate-700">{filteredData.length}</span> pelanggan •
                        <span className="font-bold text-rose-600 ml-1">{formatCurrency(filteredTotal)}</span>
                    </div>
                    {selectedIds.size > 0 && (
                        <Button
                            variant="default"
                            size="sm"
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-9"
                            onClick={() => {
                                const ids = Array.from(selectedIds).join(',');
                                window.open(`/print-surat-tagihan?ids=${ids}`, '_blank');
                            }}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Cetak Surat ({selectedIds.size})
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 h-9"
                        onClick={handleExportCSV}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-4 w-10">
                                    <Checkbox 
                                        checked={isAllPageSelected}
                                        onCheckedChange={toggleSelectAllPage}
                                        className="border-slate-300"
                                    />
                                </th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider w-10"></th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Pelanggan</th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Wilayah</th>
                                <th
                                    className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center cursor-pointer hover:text-rose-600"
                                    onClick={() => toggleSort("months")}
                                >
                                    Bulan {sortField === "months" && (sortDir === "desc" ? "↓" : "↑")}
                                </th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Sejak</th>
                                <th
                                    className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right cursor-pointer hover:text-rose-600"
                                    onClick={() => toggleSort("amount")}
                                >
                                    Total Tunggakan {sortField === "amount" && (sortDir === "desc" ? "↓" : "↑")}
                                </th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertTriangle className="w-8 h-8 text-slate-300" />
                                            <span>Tidak ada data tunggakan</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <React.Fragment key={item.customerId}>
                                        <tr className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-5 py-4">
                                                <Checkbox 
                                                    checked={selectedIds.has(item.customerId)}
                                                    onCheckedChange={() => toggleSelect(item.customerId)}
                                                    className="border-slate-300"
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 rounded-lg"
                                                    onClick={() => toggleExpand(item.customerId)}
                                                >
                                                    {expandedRows.has(item.customerId)
                                                        ? <ChevronUp className="w-4 h-4" />
                                                        : <ChevronDown className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{item.customerName}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{item.connectionNumber}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium rounded-lg text-[10px] px-2">
                                                    {item.areaName}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${item.monthsCount >= 6
                                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                                    : item.monthsCount >= 3
                                                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                    <Clock className="w-3 h-3" />
                                                    {item.monthsCount} bln
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 font-medium text-xs">
                                                {item.oldestMonth}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="font-black text-rose-600 text-base">{formatCurrency(item.totalArrears)}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {item.phone && item.phone !== "-" && (
                                                        <a
                                                            href={`https://wa.me/62${item.phone.replace(/^0/, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                            title="Kirim WhatsApp"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => window.open(`/print-pemutusan/${item.customerId}`, '_blank')}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                        title="Cetak Surat Pemutusan"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows.has(item.customerId) && (
                                            <tr key={`${item.customerId}-detail`} className="bg-slate-50/50">
                                                <td colSpan={8} className="px-5 py-4">
                                                    <div className="pl-16">
                                                        <p className="text-xs font-bold text-slate-500 mb-3">Detail Tunggakan:</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                            {item.arrearRecords.map((record) => (
                                                                <div
                                                                    key={record.recordId}
                                                                    className={`p-3 rounded-xl border ${record.status === 'partial'
                                                                        ? "bg-amber-50 border-amber-200"
                                                                        : "bg-rose-50 border-rose-200"
                                                                        }`}
                                                                >
                                                                    <div className="font-bold text-slate-900 text-sm">
                                                                        {months[record.month - 1]} {record.year}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 mt-1">
                                                                        Tagihan: {formatCurrency(record.billAmount)}
                                                                    </div>
                                                                    {record.paidAmount > 0 && (
                                                                        <div className="text-[10px] text-green-600">
                                                                            Dibayar: {formatCurrency(record.paidAmount)}
                                                                        </div>
                                                                    )}
                                                                    <div className={`font-bold text-xs mt-1 ${record.status === 'partial' ? "text-amber-600" : "text-rose-600"
                                                                        }`}>
                                                                        Sisa: {formatCurrency(record.outstanding)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span>-
                            <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari {filteredData.length}
                        </p>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`h-8 w-8 p-0 rounded-lg ${currentPage === pageNum ? 'bg-rose-600 hover:bg-rose-700' : ''
                                            }`}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
