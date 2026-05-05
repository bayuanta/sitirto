import {
    getArrearsSummary,
    getArrearsByArea,
    getArrearsByAge,
    getArrearsDetailList,
    getAreasList,
    getTopDebtors
} from "./actions";
import {
    KpiCard,
    AreaPieChart,
    AgingBarChart,
    AreaBreakdownChart,
    ArrearsTable,
    DateRangeFilter
} from "./components";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Users,
    Calendar,
    TrendingDown,
    FileWarning,
    Download,
    Crown
} from "lucide-react";
import Link from "next/link";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default async function ArrearsReportPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;

    // Parse date filter from URL
    const dateFilter = {
        startMonth: params.startMonth ? parseInt(params.startMonth as string) : undefined,
        startYear: params.startYear ? parseInt(params.startYear as string) : undefined,
        endMonth: params.endMonth ? parseInt(params.endMonth as string) : undefined,
        endYear: params.endYear ? parseInt(params.endYear as string) : undefined,
    };

    const hasDateFilter = dateFilter.startMonth && dateFilter.startYear && dateFilter.endMonth && dateFilter.endYear;

    // Fetch All Data with date filter
    const [
        summary,
        areaData,
        agingData,
        detailList,
        areas,
        topDebtors
    ] = await Promise.all([
        getArrearsSummary(dateFilter),
        getArrearsByArea(dateFilter),
        getArrearsByAge(dateFilter),
        getArrearsDetailList(dateFilter),
        getAreasList(),
        getTopDebtors(5, dateFilter)
    ]);

    // Format period label
    const periodLabel = hasDateFilter
        ? `${monthNames[(dateFilter.startMonth || 1) - 1]} ${dateFilter.startYear} - ${monthNames[(dateFilter.endMonth || 1) - 1]} ${dateFilter.endYear}`
        : "Semua Periode";

    return (
        <div className="space-y-8">
            {/* === HEADER === */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-rose-200 rounded-2xl shadow-sm">
                    <div className="p-2 bg-rose-50 rounded-xl">
                        <FileWarning className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Laporan Tunggakan</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Periode: <span className="text-rose-600 font-bold">{periodLabel}</span>
                        </p>
                    </div>
                </div>

                <Button
                    variant="default"
                    className="bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 rounded-xl h-10"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Laporan
                </Button>
            </div>

            {/* === DATE FILTER === */}
            <DateRangeFilter />

            {/* === KPI CARDS === */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <KpiCard
                    label="Total Tunggakan"
                    value={formatCurrency(summary.totalArrears)}
                    icon={TrendingDown}
                    iconBgColor="bg-rose-50"
                    iconColor="text-rose-600"
                    variant="danger"
                    subValue="Belum terbayar"
                />

                <KpiCard
                    label="Pelanggan Nunggak"
                    value={summary.totalCustomers.toLocaleString('id-ID')}
                    icon={Users}
                    iconBgColor="bg-amber-50"
                    iconColor="text-amber-600"
                    variant="warning"
                    subValue="Pelanggan dengan tunggakan"
                />

                <KpiCard
                    label="Tagihan Belum Lunas"
                    value={summary.byStatus.unpaid.toLocaleString('id-ID')}
                    icon={AlertTriangle}
                    iconBgColor="bg-red-50"
                    iconColor="text-red-600"
                    subValue="Belum dibayar sama sekali"
                />

                <KpiCard
                    label="Tagihan Cicilan"
                    value={summary.byStatus.partial.toLocaleString('id-ID')}
                    icon={Calendar}
                    iconBgColor="bg-orange-50"
                    iconColor="text-orange-600"
                    subValue="Sudah ada pembayaran partial"
                />
            </div>

            {/* === ALERT BOX === */}
            {summary.totalArrears > 0 && (
                <Card className="border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-100 rounded-2xl">
                            <AlertTriangle className="w-6 h-6 text-rose-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-rose-900">Perhatian!</h4>
                            <p className="text-sm text-rose-700">
                                Terdapat <span className="font-black">{summary.totalCustomers} pelanggan</span> dengan total tunggakan{" "}
                                <span className="font-black">{formatCurrency(summary.totalArrears)}</span>.
                                Segera lakukan penagihan untuk menjaga arus kas.
                            </p>
                        </div>
                        <Link href="/pembayaran">
                            <Button variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100 rounded-xl">
                                Terima Pembayaran
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            {/* === CHARTS ROW === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Aging Analysis */}
                <Card className="lg:col-span-2 border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">Analisis Umur Tunggakan</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Berdasarkan lama belum dibayar</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                            <Calendar className="text-rose-500 w-5 h-5" />
                        </div>
                    </div>
                    <AgingBarChart data={agingData} />
                </Card>

                {/* By Area Pie */}
                <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <div className="mb-4">
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Per Wilayah</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Distribusi tunggakan</p>
                    </div>
                    <AreaPieChart data={areaData} />
                </Card>
            </div>

            {/* === TOP DEBTORS & AREA TABLE === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Debtors */}
                <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">Tunggakan Tertinggi</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">5 pelanggan teratas</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <Crown className="text-amber-500 w-5 h-5" />
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {topDebtors.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">Tidak ada data</div>
                        ) : (
                            topDebtors.map((debtor, idx) => (
                                <div key={debtor.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? "bg-rose-100 text-rose-600" :
                                            idx === 1 ? "bg-orange-100 text-orange-600" :
                                                idx === 2 ? "bg-amber-100 text-amber-600" :
                                                    "bg-slate-100 text-slate-600"
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-900 truncate">{debtor.name}</div>
                                        <div className="text-[10px] text-slate-400">{debtor.area} • {debtor.recordsCount} bulan</div>
                                    </div>
                                    <div className="font-black text-rose-600">{formatCurrency(debtor.totalArrears)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Area Breakdown Table */}
                <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Detail per Wilayah</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Breakdown lengkap</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Wilayah</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Tagihan</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Tunggakan</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {areaData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Tidak ada data</td>
                                    </tr>
                                ) : (
                                    areaData.map((area, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3">
                                                <span className="font-bold text-slate-900">{area.name}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-600">{area.count}</td>
                                            <td className="px-6 py-3 text-right font-bold text-rose-600">{formatCurrency(area.amount)}</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">
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
            </div>

            {/* === DETAILED TABLE === */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Daftar Pelanggan Menunggak</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Klik baris untuk melihat detail tagihan per bulan</p>
                </div>
                <ArrearsTable data={detailList} areas={areas} />
            </div>
        </div>
    );
}
