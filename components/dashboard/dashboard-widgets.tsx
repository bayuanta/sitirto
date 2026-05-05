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
    CreditCard,
    User,
    MoreHorizontal,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PaymentStatusWidget({ data }: { data: { paid: number, unpaid: number, percentage: number } }) {
    const chartData = [
        { name: "Lunas", value: data?.paid || 0, color: "#6366F1" }, // Indigo-500
        { name: "Menunggak", value: data?.unpaid || 0, color: "#cbd5e1" }, // Slate-300
    ];

    const percentage = data?.percentage || 0;

    return (
        <div className="flex flex-col">
            <div className="h-[220px] w-full min-w-0 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
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
                    <span className="text-4xl font-black text-slate-900">{percentage}%</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Lunas</span>
                </div>
            </div>

            <div className="flex w-full gap-6 mt-4 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
                    <div>
                        <p className="text-xs font-bold text-slate-700">Lunas</p>
                        <p className="text-xs text-slate-400">{data?.paid || 0} Tagihan</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <div>
                        <p className="text-xs font-bold text-slate-700">Nunggak</p>
                        <p className="text-xs text-slate-400">{data?.unpaid || 0} Tagihan</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function TimelineWidget() {
    return (
        <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold text-slate-900">Jadwal & Aktivitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-0 relative pl-6 before:absolute before:left-[35px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                <TimelineItem
                    icon={Calendar}
                    iconColor="text-indigo-600"
                    bgColor="bg-indigo-50"
                    title="Pencatatan Meter"
                    desc="Wilayah RT 01 - RT 05"
                    time="09:00 AM"
                    isFirst
                />
                <TimelineItem
                    icon={CreditCard}
                    iconColor="text-emerald-600"
                    bgColor="bg-emerald-50"
                    title="Transfer Masuk"
                    desc="Settlement Midtrans"
                    time="11:30 AM"
                />
                <TimelineItem
                    icon={User}
                    iconColor="text-blue-600"
                    bgColor="bg-blue-50"
                    title="Pelanggan Baru"
                    desc="Verifikasi Data"
                    time="14:15 PM"
                />
            </CardContent>
            <div className="p-4 border-t border-slate-50">
                <Button variant="ghost" className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 justify-between group">
                    Lihat Semua Jadwal <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
        </Card>
    )
}

function TimelineItem({ icon: Icon, iconColor, bgColor, title, desc, time, isFirst }: any) {
    return (
        <div className="relative flex gap-4 items-start z-10">
            <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 pt-0.5">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-900">{title}</p>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{time}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{desc}</p>
            </div>
        </div>
    )
}

export function PromoWidget() {
    return (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/50 relative overflow-hidden">
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">System Update</span>
                </div>
                <h3 className="text-lg font-bold mb-1">Versi 2.0 Hadir!</h3>
                <p className="text-xs text-indigo-100 leading-relaxed mb-4 opacity-90">
                    Fitur backup otomatis & notifikasi WhatsApp kini lebih cepat.
                </p>
                <Button size="sm" className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-0 font-bold text-xs h-9 shadow-md">
                    Cek Pembaruan
                </Button>
            </div>
        </div>
    )
}

export function MeterRecordingProgress({ total, recorded }: { total: number, recorded: number }) {
    const percentage = total > 0 ? Math.round((recorded / total) * 100) : 0;

    return (
        <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Progress Pencatatan Meter</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bulan Ini</span>
                    <span className="text-sm font-bold text-slate-900"><span className="text-indigo-600">{recorded}</span> <span className="text-slate-400">/</span> {total}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="mt-2 text-right">
                    <span className="text-[10px] font-bold text-slate-500">{percentage}% Selesai</span>
                </div>
            </CardContent>
        </Card>
    );
}
