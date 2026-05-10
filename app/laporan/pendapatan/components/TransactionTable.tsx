"use client";

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
    ArrowUpDown,
    Check,
    Clock
} from "lucide-react";
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

interface Transaction {
    id: number;
    date: string;
    time: string;
    customerName: string;
    connectionNumber: string;
    area: string;
    amount: number;
    method: string;
    isDeposited: boolean;
}

interface TransactionTableProps {
    data: Transaction[];
}

export function TransactionTable({ data }: TransactionTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [methodFilter, setMethodFilter] = useState("all");
    const [depositFilter, setDepositFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<"date" | "amount">("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const itemsPerPage = 10;

    // Filter & Sort Logic
    const filteredData = useMemo(() => {
        let result = [...data];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.customerName.toLowerCase().includes(term) ||
                item.connectionNumber.toLowerCase().includes(term) ||
                item.area.toLowerCase().includes(term)
            );
        }

        // Method filter
        if (methodFilter !== "all") {
            result = result.filter(item => item.method === methodFilter);
        }

        // Deposit filter
        if (depositFilter !== "all") {
            result = result.filter(item =>
                depositFilter === "deposited" ? item.isDeposited : !item.isDeposited
            );
        }

        // Sorting
        result.sort((a, b) => {
            if (sortField === "amount") {
                return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
            }
            // Date sort (using id as proxy for recency)
            return sortDir === "asc" ? a.id - b.id : b.id - a.id;
        });

        return result;
    }, [data, searchTerm, methodFilter, depositFilter, sortField, sortDir]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats for filtered data
    const filteredTotal = filteredData.reduce((sum, t) => sum + t.amount, 0);

    const toggleSort = (field: "date" | "amount") => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    };

    const handleExportCSV = () => {
        const headers = ["Tanggal", "Waktu", "Pelanggan", "No. Sambung", "Wilayah", "Nominal", "Metode", "Status Setor"];
        const rows = filteredData.map(t => [
            t.date,
            t.time,
            t.customerName,
            t.connectionNumber,
            t.area,
            t.amount,
            t.method === "cash" ? "Tunai" : "Transfer",
            t.isDeposited ? "Sudah Disetor" : "Belum Disetor"
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-4">
            {/* Controls Row */}
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                {/* Search & Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative w-full sm:w-[280px]">
                        <Label htmlFor="transaction-search" className="sr-only">Cari Transaksi</Label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="transaction-search"
                            name="transaction-search"
                            placeholder="Cari nama, no. sambung, wilayah..."
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-300 transition-all rounded-xl text-sm h-10"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="flex flex-col">
                        <Label htmlFor="method-filter" className="sr-only">Filter Metode</Label>
                        <Select name="method-filter" value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger id="method-filter" className="w-[130px] rounded-xl border-slate-200 bg-slate-50 h-10">
                                <SelectValue placeholder="Metode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Metode</SelectItem>
                                <SelectItem value="cash">Tunai</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col">
                        <Label htmlFor="deposit-filter" className="sr-only">Filter Status Setor</Label>
                        <Select name="deposit-filter" value={depositFilter} onValueChange={(v) => { setDepositFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger id="deposit-filter" className="w-[150px] rounded-xl border-slate-200 bg-slate-50 h-10">
                                <SelectValue placeholder="Status Setor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="deposited">Sudah Disetor</SelectItem>
                                <SelectItem value="pending">Belum Disetor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Actions & Summary */}
                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                        <span className="font-bold text-slate-700">{filteredData.length}</span> transaksi •
                        <span className="font-bold text-indigo-600 ml-1">{formatCurrency(filteredTotal)}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                        onClick={handleExportCSV}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th
                                    className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => toggleSort("date")}
                                >
                                    <div className="flex items-center gap-1">
                                        Tanggal
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Pelanggan</th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Wilayah</th>
                                <th
                                    className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => toggleSort("amount")}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Nominal
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Metode</th>
                                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Setor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 text-slate-300" />
                                            <span>Tidak ada transaksi ditemukan</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-800">{item.date}</div>
                                            <div className="text-[10px] text-slate-400">{item.time}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-slate-900">{item.customerName}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{item.connectionNumber}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium rounded-lg text-[10px] px-2">
                                                {item.area}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="font-black text-slate-900">{formatCurrency(item.amount)}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {item.method === 'cash' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    TUNAI
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    TRANSFER
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {item.isDeposited ? (
                                                <div className="flex justify-center">
                                                    <div className="h-7 w-7 rounded-full bg-green-50 flex items-center justify-center border border-green-200">
                                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span>-
                            <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari {filteredData.length}
                        </p>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0 rounded-lg border-slate-200"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`h-8 w-8 p-0 rounded-lg ${currentPage === pageNum
                                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                                : 'border-slate-200'
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
                                className="h-8 w-8 p-0 rounded-lg border-slate-200"
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
