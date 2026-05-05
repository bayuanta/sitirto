"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import {
    Bell,
    Calendar,
    ChevronRight,
    CreditCard,
    MoreHorizontal,
    Settings,
    User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock Data for Donut Chart
const paymentStatusData = [
    { name: "Lunas", value: 65, color: "#6366F1" }, // Indigo-500
    { name: "Menunggak", value: 35, color: "#e2e8f0" }, // Slate-200
];

export function RightPanel() {
    return (
        <div className="h-full flex flex-col gap-6 p-6 bg-white border-l border-slate-100 overflow-y-auto">
            {/* 1. Mini Profile Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">AD</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">Admin Utama</p>
                        <p className="text-xs text-slate-500 mt-1">Unit Tirtowening</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                    <Settings className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-px bg-slate-100 w-full my-1" />

            {/* 2. Payment Status Widget */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Status Pembayaran</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </Button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-inner">
                    <div className="h-[180px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                >
                                    {paymentStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 600, fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-slate-900">65%</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Lunas</span>
                        </div>
                    </div>

                    <div className="flex w-full gap-4 mt-2 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-xs font-medium text-slate-600">Lunas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                            <span className="text-xs font-medium text-slate-400">Nunggak</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Activity Timeline */}
            <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Aktivitas Terbaru</h3>
                    <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">Lihat Semua</span>
                </div>

                <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    <TimelineItem
                        icon={Calendar}
                        iconColor="text-indigo-600"
                        bgColor="bg-indigo-50"
                        title="Pencatatan Meter Selesai"
                        desc="Wilayah RT 01 - RT 05"
                        time="2 jam lalu"
                    />
                    <TimelineItem
                        icon={CreditCard}
                        iconColor="text-emerald-600"
                        bgColor="bg-emerald-50"
                        title="Pembayaran Masuk"
                        desc="Hj. Siti Aminah (Rp 450.000)"
                        time="4 jam lalu"
                    />
                    <TimelineItem
                        icon={User}
                        iconColor="text-blue-600"
                        bgColor="bg-blue-50"
                        title="Pelanggan Baru"
                        desc="Bpk. Budi Santoso"
                        time="1 hari lalu"
                    />
                    <TimelineItem
                        icon={Bell}
                        iconColor="text-amber-600"
                        bgColor="bg-amber-50"
                        title="Peringatan Server"
                        desc="Backup database otomatis"
                        time="1 hari lalu"
                    />
                </div>
            </div>

            {/* 4. Mini Footer Promo (Optional filler) */}
            <div className="mt-auto p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white">
                <p className="text-xs font-bold mb-1">Butuh Bantuan?</p>
                <p className="text-[10px] text-slate-300 leading-relaxed">Hubungi tim support teknis jika mengalami kendala sistem.</p>
                <Button size="sm" variant="secondary" className="w-full mt-3 h-8 text-xs bg-white text-slate-900 hover:bg-slate-100">
                    Kontak Support
                </Button>
            </div>

        </div>
    );
}

function TimelineItem({ icon: Icon, iconColor, bgColor, title, desc, time }: any) {
    return (
        <div className="relative flex gap-3 items-start group cursor-pointer">
            <div className={`relative z-10 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center shrink-0 ring-4 ring-white`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 pt-1">
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{desc}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{time}</p>
            </div>
        </div>
    )
}
