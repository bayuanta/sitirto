export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import {
    getUnifiedRevenueReport,
    getTransactionsList
} from "./actions";
import {
    KpiCard,
    KpiCardSkeleton,
    DailyTrendChart,
    WeeklyBarChart,
    PaymentMethodChart,
    AreaBreakdownChart,
    TransactionTable,
    ReportFilters
} from "./components";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Banknote,
    Wallet,
    CreditCard,
    Receipt,
    TrendingUp,
    Users,
    Download,
    FileText,
    PiggyBank,
    AlertCircle
} from "lucide-react";
import Link from "next/link";

// Helper for currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default async function RevenueReportPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Handle quick filters
    const filter = params.filter as string || "custom";
    let month = currentMonth;
    let year = currentYear;

    if (filter === "thisMonth") {
        month = currentMonth;
        year = currentYear;
    } else if (filter === "lastMonth") {
        month = currentMonth === 1 ? 12 : currentMonth - 1;
        year = currentMonth === 1 ? currentYear - 1 : currentYear;
    } else if (filter === "custom" && params.month && params.year) {
        month = parseInt(params.month as string);
        year = parseInt(params.year as string);
    }

    // Fetch All Data in a Single Optimized Request
    const {
        summary,
        dailyTrend,
        weeklyData,
        paymentMethods,
        areaRevenue,
        depositStatus,
        transactions
    } = await getUnifiedRevenueReport(month, year);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthName = months[month - 1];

    return (
        <div className="space-y-8">
            {/* === HEADER SECTION === */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Title */}
                <div className="flex-1">
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm mb-4">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Laporan Pendapatan</h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Periode: <span className="text-indigo-600 font-bold">{monthName} {year}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <Suspense fallback={<div className="h-10 w-40 animate-pulse bg-slate-50 rounded-xl" />}>
                        <ReportFilters />
                    </Suspense>
                    <Button
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 rounded-xl h-10"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* === KPI CARDS === */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <KpiCard
                    label="Total Pendapatan"
                    value={formatCurrency(summary.totalRevenue)}
                    growth={summary.growth}
                    icon={Banknote}
                    iconBgColor="bg-indigo-50"
                    iconColor="text-indigo-600"
                    showGrowth={true}
                    subValue="vs bulan lalu"
                />

                <KpiCard
                    label="Tunai (Cash)"
                    value={formatCurrency(summary.totalCash)}
                    icon={Wallet}
                    iconBgColor="bg-emerald-50"
                    iconColor="text-emerald-600"
                    subValue={`${paymentMethods[0]?.percentage || 0}% dari total`}
                />

                <KpiCard
                    label="Transfer / QRIS"
                    value={formatCurrency(summary.totalTransfer)}
                    icon={CreditCard}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    subValue={`${paymentMethods[1]?.percentage || 0}% dari total`}
                />

                <KpiCard
                    label="Jumlah Transaksi"
                    value={summary.transactionCount.toLocaleString('id-ID')}
                    icon={Receipt}
                    iconBgColor="bg-purple-50"
                    iconColor="text-purple-600"
                    subValue={`Rata-rata ${formatCurrency(summary.averageTransaction)}`}
                />
            </div>

            {/* === DEPOSIT STATUS ALERT === */}
            {depositStatus.pendingCash > 0 && (
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-2xl">
                            <PiggyBank className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-900">Kas Belum Disetor</h4>
                            <p className="text-sm text-amber-700">
                                Terdapat <span className="font-black">{depositStatus.pendingCount} transaksi</span> senilai{" "}
                                <span className="font-black">{formatCurrency(depositStatus.pendingCash)}</span> yang belum disetor ke bendahara.
                            </p>
                        </div>
                        <Link href="/setoran">
                            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-xl">
                                Setor Sekarang
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            {/* === CHARTS ROW 1 === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Trend - 2 cols */}
                <Card className="lg:col-span-2 border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">Tren Pendapatan Harian</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Pergerakan pemasukan selama bulan {monthName}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                            <TrendingUp className="text-indigo-500 w-5 h-5" />
                        </div>
                    </div>
                    <DailyTrendChart data={dailyTrend} />
                </Card>

                {/* Payment Method - 1 col */}
                <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="mb-4">
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Metode Pembayaran</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Distribusi Tunai vs Transfer</p>
                    </div>
                    <PaymentMethodChart data={paymentMethods} />
                </Card>
            </div>

            {/* === CHARTS ROW 2 === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Breakdown */}
                <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="mb-4">
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Perbandingan Mingguan</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Pendapatan per minggu</p>
                    </div>
                    <WeeklyBarChart data={weeklyData} />
                </Card>

                {/* Area Breakdown */}
                <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">Pendapatan per Wilayah</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Kontribusi setiap dusun</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                            <Users className="text-purple-500 w-5 h-5" />
                        </div>
                    </div>
                    <AreaBreakdownChart data={areaRevenue} />
                </Card>
            </div>

            {/* === AREA TABLE === */}
            <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Detail Wilayah</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Breakdown lengkap per area</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Transaksi</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Pendapatan</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Kontribusi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {areaRevenue.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                        Tidak ada data wilayah untuk periode ini
                                    </td>
                                </tr>
                            ) : (
                                areaRevenue.map((area, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-indigo-500' :
                                                        idx === 1 ? 'bg-purple-500' :
                                                            idx === 2 ? 'bg-fuchsia-500' : 'bg-pink-500'
                                                    }`} />
                                                <span className="font-bold text-slate-900">{area.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-600">{area.count}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(area.revenue)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                                                {area.percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* === TRANSACTION TABLE === */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Riwayat Transaksi</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Semua pembayaran pada periode ini</p>
                    </div>
                </div>
                <TransactionTable data={transactions} />
            </div>
        </div>
    );
}
