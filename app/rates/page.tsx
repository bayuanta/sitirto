"use client";

import {
    Home,
    Store,
    Heart,
    Plus,
    Edit,
    Droplets,
    Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- MOCK DATA ---
const MOCK_RATES = [
    {
        id: 1,
        name: "Sosial",
        code: "S1",
        icon: Heart,
        color: "text-rose-600 bg-rose-50",
        abodemen: 0,
        tiers: [
            { range: "0 - ∞ m³", price: 1500 }
        ]
    },
    {
        id: 2,
        name: "Rumah Tangga",
        code: "R1",
        icon: Home,
        color: "text-blue-600 bg-blue-50",
        abodemen: 10000,
        tiers: [
            { range: "0 - 10 m³", price: 2000 },
            { range: "> 10 m³", price: 3500 }
        ]
    },
    {
        id: 3,
        name: "Niaga / Bisnis",
        code: "N1",
        icon: Store,
        color: "text-orange-600 bg-orange-50",
        abodemen: 25000,
        tiers: [
            { range: "0 - 10 m³", price: 4000 },
            { range: "11 - 20 m³", price: 5500 },
            { range: "> 20 m³", price: 7000 }
        ]
    },
];

export default function RatesPage() {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans text-slate-900">

            {/* Container Utama (Floating Panel) */}
            <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-sm p-6 min-h-[80vh]">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Tarif & Golongan</h1>
                        <p className="text-xs text-slate-500 font-medium">Atur harga dasar dan tarif progresif air</p>
                    </div>
                    <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 shadow-md shadow-indigo-100 transition-all">
                        <Plus className="mr-2 h-3.5 w-3.5" /> Golongan Baru
                    </Button>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_RATES.map((rate) => {
                        const Icon = rate.icon;
                        return (
                            <div
                                key={rate.id}
                                className="group flex flex-col bg-white border border-slate-200 rounded-[25px] p-6 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className={cn("p-3 rounded-2xl w-fit mb-4 transition-colors group-hover:bg-indigo-50", rate.color)}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <Badge variant="outline" className="rounded-full border-slate-200 text-slate-400 font-bold px-3">
                                        {rate.code}
                                    </Badge>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1">{rate.name}</h3>
                                <p className="text-xs text-slate-500">Tarif aktif mulai Jan 2026</p>

                                {/* Divider */}
                                <div className="border-b border-dashed border-slate-200 my-5" />

                                {/* Section 1: Abodemen */}
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Coins className="h-3 w-3" /> Biaya Beban / Abodemen
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                                            {formatCurrency(rate.abodemen)}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">/ bulan</span>
                                    </div>
                                </div>

                                {/* Section 2: Usage Tiers */}
                                <div className="bg-slate-50 rounded-2xl p-4 mb-6 ring-1 ring-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Droplets className="h-3 w-3" /> Tarif Pemakaian Air
                                    </p>
                                    <div className="space-y-3">
                                        {rate.tiers.map((tier, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="font-medium text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-100 text-xs shadow-sm">
                                                    {tier.range}
                                                </span>
                                                <span className="font-bold text-slate-900">
                                                    {formatCurrency(tier.price)} <span className="text-slate-400 font-normal text-xs">/m³</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="mt-auto">
                                    <Button variant="outline" className="w-full rounded-full border-slate-200 hover:border-indigo-600 hover:text-indigo-600 hover:bg-white font-bold transition-all h-10">
                                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit Tarif
                                    </Button>
                                </div>

                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
