import { supabase } from "@/lib/supabase";
import {
    Banknote,
    Users,
    AlertOctagon,
    Droplets,
    Coins,
    Wallet,
    MoreHorizontal
} from "lucide-react";
import {
    Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    getUnifiedDashboardData
} from "../dashboard-actions"; // UPDATED IMPORT PATH

import {
    RevenueTrendChartClient,
    PaymentStatusWidgetClient,
    PaymentMethodChartClient,
    PaymentStatisticsChartClient
} from "@/components/dashboard/client-charts-wrapper";
import { QuickActionsWidget } from "@/components/dashboard/quick-actions-widget";

export const revalidate = 0;

// Utility for currency formatting (Compact)
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default async function DashboardPage() {
    const data = await getUnifiedDashboardData(new Date().getFullYear());
    const { 
        stats, 
        revenue: finance, 
        trend: revenueTrend, 
        topDebtors, 
        paymentMethods, 
        activity: recentActivity, 
        paymentStatus: paymentStats, 
        chartData: paymentStatistics 
    } = data;

    return (
        // GRID UTAMA 12 KOLOM - COMPACT (Gap Reduced 6->4)
        <div className="grid grid-cols-12 gap-4 items-start">

            {/* =========================================
          SECTION A: KOLOM TENGAH (Span 9) 
          ========================================= */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">

                {/* 1. Baris Atas: 4 KPI Cards (Hirezy Style) */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Pelanggan */}
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{stats.activeCustomers}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Pelanggan</p>
                    </Card>

                    {/* Card 2: Pendapatan Hari Ini */}
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                <Banknote className="h-5 w-5" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{formatCurrency(finance.daily)}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pendapatan Hari Ini</p>
                    </Card>

                    {/* Card 3: Tunggakan */}
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                                <AlertOctagon className="h-5 w-5" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-rose-600 tracking-tight mb-1">{formatCurrency(stats.totalArrears)}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Tunggakan</p>
                    </Card>

                    {/* Card 4: Pemakaian Air */}
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
                                <Droplets className="h-5 w-5" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{stats.totalUsage} <span className="text-xl text-slate-400">m³</span></h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Pemakaian</p>
                    </Card>
                </section>

                {/* 2. Baris Tengah: Pendapatan Bulan & Tahun Ini + Target */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Kiri: Dua kotak pendapatan (Grid 2 kolom) */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">

                        {/* Box 1: Pendapatan Bulan Ini */}
                        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <Wallet className="h-5 w-5" />
                                </div>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(finance.monthly)}</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Pendapatan Bulan Ini</p>
                        </Card>

                        {/* Box 2: Pendapatan Tahun Ini */}
                        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                    <Coins className="h-5 w-5" />
                                </div>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(finance.yearly)}</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Pendapatan Tahun Ini</p>
                        </Card>

                    </div>

                    {/* Kanan: Target Widget */}
                    <div className="lg:col-span-1">
                        <Card className="h-full border border-slate-100 shadow-sm bg-white rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                            <div>
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 w-fit mb-4">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-1">Target Tercapai!</h3>
                                        <p className="text-xs text-slate-500 font-medium whitespace-pre-line">
                                            <span className="font-bold text-indigo-600 block mb-1">{stats.targetPeriodName}</span>
                                            {stats.recordedCount} dari {stats.activeCustomers} pelanggan tercatat.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.targetPercentage}%` }}
                                    />
                                </div>
                                <p className="text-right text-xs font-bold mt-2 text-indigo-600">{stats.targetPercentage}%</p>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* 2.5 BARIS TENGAH BARU: Payment Statistics Chart (Full Width in Main Column) */}
                <section>
                    <PaymentStatisticsChartClient
                        initialData={paymentStatistics.monthly}
                        initialSummary={paymentStatistics.summary}
                        currentYear={new Date().getFullYear()}
                    />
                </section>

                {/* 3. Baris Bawah: Charts Split */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Revenue Chart (Span 2) */}
                    <Card className="lg:col-span-2 border border-slate-100 shadow-sm bg-white rounded-2xl p-6 overflow-hidden hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-black text-slate-900">Tren Pendapatan</h3>
                            <div className="flex gap-3">
                                <span className="flex items-center text-xs font-bold text-slate-600 gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />Real
                                </span>
                                <span className="flex items-center text-xs font-bold text-slate-400 gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-slate-200" />Target
                                </span>
                            </div>
                        </div>
                        <div className="h-[240px] w-full">
                            <RevenueTrendChartClient data={revenueTrend} />
                        </div>
                    </Card>

                    {/* Payment Method Donut (Span 1) */}
                    <Card className="lg:col-span-1 border border-slate-100 shadow-sm bg-white rounded-2xl p-6 overflow-hidden hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-black text-slate-900">Metode Bayar</h3>
                        </div>
                        <div className="h-[240px] w-full">
                            <PaymentMethodChartClient data={paymentMethods} />
                        </div>
                    </Card>
                </section>

                {/* Tabel Top Penunggak (Full Width in Main Column) */}
                <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-base font-black text-slate-900">Prioritas Penagihan</h3>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold px-3 rounded-lg border-slate-200 hover:border-indigo-600 hover:text-indigo-600">Lihat Semua</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Pelanggan</th>
                                    <th className="px-6 py-3">Wilayah</th>
                                    <th className="px-6 py-3 text-right">Total Hutang</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {topDebtors.map((user: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <Avatar className="h-8 w-8 bg-indigo-50 border border-indigo-100">
                                                <AvatarFallback className="text-xs font-bold text-indigo-600">{user.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-400">ID: {user.id || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{user.area}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 font-bold px-2 py-1 text-xs rounded-lg">{formatCurrency(user.amount)}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </div>

            {/* =========================================
          SECTION B: KOLOM KANAN (Span 3) 
          ========================================= */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">

                {/* Widget 1: Status Pembayaran */}
                <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300">
                    <h3 className="text-base font-black text-slate-900 mb-4">Status Pembayaran</h3>
                    <PaymentStatusWidgetClient data={paymentStats} />
                </Card>

                {/* Widget 2: Jadwal Operasional */}
                <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="text-base font-black text-slate-900">Jadwal Operasional</h3>
                    </div>
                    <div className="p-0">
                        <div className="p-4 flex gap-4 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 border-indigo-500">
                            <div className="text-center min-w-[3rem]">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tgl</p>
                                <p className="text-2xl font-black text-indigo-600 leading-none">25</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 mb-0.5">Catat Meter</p>
                                <p className="text-xs text-slate-500">Periode Bulan Ini</p>
                            </div>
                        </div>
                        <div className="p-4 flex gap-4 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 border-rose-500 border-t border-t-slate-100">
                            <div className="text-center min-w-[3rem]">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tgl</p>
                                <p className="text-2xl font-black text-rose-600 leading-none">10</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 mb-0.5">Batas Bayar</p>
                                <p className="text-xs text-slate-500">Denda mulai berlaku</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Widget 3: Aktivitas Terbaru */}
                <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden flex-1 hover:shadow-md transition-all duration-300">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="text-base font-black text-slate-900">Aktivitas Terbaru</h3>
                    </div>
                    <div className="p-5 space-y-5">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-6 text-xs text-slate-400">Belum ada aktivitas.</div>
                        ) : (
                            recentActivity.map((log: any, idx: number) => (
                                <div key={idx} className="flex gap-3 relative">
                                    {/* Connecting Line */}
                                    {idx !== recentActivity.length - 1 && (
                                        <div className="absolute left-[13px] top-7 bottom-[-20px] w-[2px] bg-slate-100" />
                                    )}

                                    <div className={`h-7 w-7 rounded-full ${log.color} flex items-center justify-center text-white text-xs font-bold shrink-0 ring-4 ring-white z-10 shadow-sm`}>
                                        {log.avatar}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-900 leading-snug font-medium">
                                            <span className="font-bold text-slate-900">{log.user}</span> {log.action}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-bold block mt-1">{log.time}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Widget 4: Aksi Cepat (Quick Actions) */}
                <QuickActionsWidget />

            </div>

        </div>
    );
}
