"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar } from "lucide-react";

export function ReportFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const month = searchParams.get("month") || currentMonth.toString();
    const year = searchParams.get("year") || currentYear.toString();
    const quickFilter = searchParams.get("filter") || "custom";

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set(key, value);

        // If setting quick filter, clear month/year
        if (key === "filter" && value !== "custom") {
            params.delete("month");
            params.delete("year");
        }

        // If setting month/year, set filter to custom
        if (key === "month" || key === "year") {
            params.set("filter", "custom");
        }

        startTransition(() => {
            router.push(`/laporan/pendapatan?${params.toString()}`);
        });
    };

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Quick Filters */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                <Button
                    variant={quickFilter === "7days" ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-lg text-xs h-8 px-3 ${quickFilter === "7days"
                            ? "bg-white shadow-sm text-slate-900 hover:bg-white"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                    onClick={() => handleFilterChange("filter", "7days")}
                >
                    7 Hari
                </Button>
                <Button
                    variant={quickFilter === "thisMonth" ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-lg text-xs h-8 px-3 ${quickFilter === "thisMonth"
                            ? "bg-white shadow-sm text-slate-900 hover:bg-white"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                    onClick={() => handleFilterChange("filter", "thisMonth")}
                >
                    Bulan Ini
                </Button>
                <Button
                    variant={quickFilter === "lastMonth" ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-lg text-xs h-8 px-3 ${quickFilter === "lastMonth"
                            ? "bg-white shadow-sm text-slate-900 hover:bg-white"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                    onClick={() => handleFilterChange("filter", "lastMonth")}
                >
                    Bulan Lalu
                </Button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-200" />

            {/* Custom Date Picker */}
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-indigo-500 ml-1" />}

                <Calendar className="w-4 h-4 text-slate-400 ml-1" />

                <Select
                    value={quickFilter === "custom" ? month : ""}
                    onValueChange={(v) => handleFilterChange("month", v)}
                >
                    <SelectTrigger className="w-[110px] border-0 focus:ring-0 shadow-none bg-transparent font-semibold text-slate-700 h-8 text-sm">
                        <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((m, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="w-px h-5 bg-slate-200" />

                <Select
                    value={quickFilter === "custom" ? year : ""}
                    onValueChange={(v) => handleFilterChange("year", v)}
                >
                    <SelectTrigger className="w-[80px] border-0 focus:ring-0 shadow-none bg-transparent font-semibold text-slate-700 h-8 text-sm">
                        <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
