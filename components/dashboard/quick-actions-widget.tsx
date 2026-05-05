"use client";

import Link from "next/link";
import {
    Droplets,
    Banknote,
    UserPlus,
    History,
    FileText,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActionsWidget() {
    const actions = [
        {
            label: "Catat Meter",
            href: "/input-meteran",
            icon: Droplets,
            color: "text-blue-600",
            bg: "bg-blue-50",
            desc: "Input stand meter bulanan"
        },
        {
            label: "Bayar Tagihan",
            href: "/pembayaran",
            icon: Banknote,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            desc: "Proses pembayaran air"
        },
        {
            label: "Pelanggan",
            href: "/pelanggan",
            icon: UserPlus,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            desc: "Data & tambah pelanggan"
        },
        {
            label: "Riwayat",
            href: "/riwayat",
            icon: History,
            color: "text-amber-600",
            bg: "bg-amber-50",
            desc: "Log transaksi & aktivitas"
        }
    ];

    return (
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900">Aksi Cepat</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
                {actions.map((action, idx) => (
                    <Link
                        key={idx}
                        href={action.href}
                        className="flex flex-col p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all duration-200 group relative overflow-hidden"
                    >
                        <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                            <action.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
                                {action.label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium leading-tight">
                                {action.desc}
                            </p>
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute top-4 right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>
                    </Link>
                ))}
            </div>
        </Card>
    );
}
