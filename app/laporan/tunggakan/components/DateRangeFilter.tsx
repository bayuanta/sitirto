"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, RefreshCcw } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Generate years from 2020 to current year + 1
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);

export function DateRangeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Get from URL or default
    const defaultStartMonth = searchParams.get("startMonth") || "1";
    const defaultStartYear = searchParams.get("startYear") || "2024";
    const defaultEndMonth = searchParams.get("endMonth") || new Date().getMonth() + 1 + "";
    const defaultEndYear = searchParams.get("endYear") || currentYear + "";

    const [startMonth, setStartMonth] = useState(defaultStartMonth);
    const [startYear, setStartYear] = useState(defaultStartYear);
    const [endMonth, setEndMonth] = useState(defaultEndMonth);
    const [endYear, setEndYear] = useState(defaultEndYear);

    const applyFilter = () => {
        startTransition(() => {
            const params = new URLSearchParams();
            params.set("startMonth", startMonth);
            params.set("startYear", startYear);
            params.set("endMonth", endMonth);
            params.set("endYear", endYear);
            router.push(`/laporan/tunggakan?${params.toString()}`);
        });
    };

    const resetFilter = () => {
        startTransition(() => {
            router.push("/laporan/tunggakan");
        });
    };

    const hasFilter = searchParams.has("startMonth");

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Periode:</span>
            </div>

            {/* Start Date */}
            <div className="flex items-center gap-2">
                <Select value={startMonth} onValueChange={setStartMonth}>
                    <SelectTrigger className="w-[120px] rounded-xl border-slate-200 bg-slate-50 h-9 text-sm">
                        <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {monthNames.map((name, idx) => (
                            <SelectItem key={idx} value={(idx + 1).toString()}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={startYear} onValueChange={setStartYear}>
                    <SelectTrigger className="w-[90px] rounded-xl border-slate-200 bg-slate-50 h-9 text-sm">
                        <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <span className="text-slate-400 font-medium">—</span>

            {/* End Date */}
            <div className="flex items-center gap-2">
                <Select value={endMonth} onValueChange={setEndMonth}>
                    <SelectTrigger className="w-[120px] rounded-xl border-slate-200 bg-slate-50 h-9 text-sm">
                        <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {monthNames.map((name, idx) => (
                            <SelectItem key={idx} value={(idx + 1).toString()}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={endYear} onValueChange={setEndYear}>
                    <SelectTrigger className="w-[90px] rounded-xl border-slate-200 bg-slate-50 h-9 text-sm">
                        <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Apply Button */}
            <Button
                onClick={applyFilter}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-700 rounded-xl h-9 px-4 shadow-sm shadow-rose-200"
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Terapkan
            </Button>

            {/* Reset Button */}
            {hasFilter && (
                <Button
                    variant="outline"
                    onClick={resetFilter}
                    disabled={isPending}
                    className="rounded-xl h-9 px-3 border-slate-200 hover:bg-slate-50"
                >
                    <RefreshCcw className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
