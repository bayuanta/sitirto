"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

export function DashboardHeader({ month, year }: { month: number; year: number }) {
    const router = useRouter();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    const handlePeriodChange = (type: "month" | "year", value: string) => {
        const params = new URLSearchParams(window.location.search);
        if (type === "month") params.set("month", value);
        else params.set("year", value);
        router.push(`/?${params.toString()}`);
    };

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">Dashboard Eksekutif</h1>
                <p className="mt-1 text-slate-500">{getGreeting()}, Admin. Berikut ringkasan performa PAMSIMAS.</p>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                <CalendarDays className="h-4 w-4 text-slate-500 ml-2" />
                <Select
                    value={month.toString()}
                    onValueChange={(val) => handlePeriodChange("month", val)}
                >
                    <SelectTrigger className="w-[140px] border-none bg-transparent focus:ring-0">
                        <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="h-6 w-px bg-slate-200" />
                <Select
                    value={year.toString()}
                    onValueChange={(val) => handlePeriodChange("year", val)}
                >
                    <SelectTrigger className="w-[100px] border-none bg-transparent focus:ring-0">
                        <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
