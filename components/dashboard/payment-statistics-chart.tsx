"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaymentStatistics } from "@/app/dashboard-actions";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface PaymentStatisticsProps {
    initialData: any[];
    initialSummary: {
        totalBill: number;
        totalPaid: number;
        totalUnpaid: number;
    };
    currentYear: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // payload[0] is typically the first bar (paid - emerald)
        // payload[1] is the second bar (unpaid - rose) depending on stack order

        // We need to find specific data points
        const data = payload[0].payload; // Access the full data object for this month

        // Calculate percentages
        const total = data.total_bill || 0;
        const paid = data.paid || 0;
        const unpaid = data.unpaid || 0;

        const paidPercent = total > 0 ? ((paid / total) * 100).toFixed(1) : "0";
        const unpaidPercent = total > 0 ? ((unpaid / total) * 100).toFixed(1) : "0";

        return (
            <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
                <p className="text-sm font-black text-slate-800 mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-slate-500 font-medium">Total Tagihan:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-rose-500 font-bold">Belum Bayar:</span>
                        <span className="font-bold text-rose-600">
                            {formatCurrency(unpaid)} <span className="text-[10px] ml-1 opacity-80">({unpaidPercent}%)</span>
                        </span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                        <span className="text-emerald-500 font-bold">Sudah Lunas:</span>
                        <span className="font-bold text-emerald-600">
                            {formatCurrency(paid)} <span className="text-[10px] ml-1 opacity-80">({paidPercent}%)</span>
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function PaymentStatisticsChart({ initialData, initialSummary, currentYear }: PaymentStatisticsProps) {
    const [year, setYear] = useState<string>(currentYear.toString());
    const [data, setData] = useState(initialData);
    const [summary, setSummary] = useState(initialSummary);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleYearChange = async (selectedYear: string) => {
        setYear(selectedYear);
        setLoading(true);
        setSelectedMonth(null); // Reset selection on year change
        try {
            const result = await getPaymentStatistics(parseInt(selectedYear));
            setData(result.monthly);
            setSummary(result.summary);
        } catch (error) {
            console.error("Failed to fetch statistics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBarClick = (entry: any) => {
        if (!entry || !entry.name) return;

        const clickedMonth = entry.name;

        if (selectedMonth === clickedMonth) {
            setSelectedMonth(null); // Deselect if clicking same month
        } else {
            setSelectedMonth(clickedMonth);
        }
    };

    // Derived summary based on selection
    const displaySummary = selectedMonth
        ? data.find(m => m.name === selectedMonth) || { total_bill: 0, paid: 0, unpaid: 0 }
        : summary;

    // Use correct property names for display
    const viewSummary = selectedMonth
        ? {
            totalBill: (displaySummary as any).total_bill,
            totalPaid: (displaySummary as any).paid,
            totalUnpaid: (displaySummary as any).unpaid,
            label: `Bulan ${selectedMonth} ${year}`
        }
        : {
            totalBill: summary.totalBill,
            totalPaid: summary.totalPaid,
            totalUnpaid: summary.totalUnpaid,
            label: `Total Tagihan (${year})`
        };

    // Generate year options (current year back to 5 years ago)
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    return (
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
                <CardTitle className="text-lg font-black text-slate-900">
                    Statistik Pembayaran
                    {selectedMonth && <span className="ml-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Bulan {selectedMonth}</span>}
                </CardTitle>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                        <Label htmlFor="year-filter-trigger" className="sr-only">Filter Tahun</Label>
                        <Select name="year-filter" value={year} onValueChange={handleYearChange}>
                            <SelectTrigger id="year-filter-trigger" className="w-[100px] h-9 text-xs font-bold border-slate-200">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y} className="text-xs font-medium">
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="p-6">

                {/* CHART AREA */}
                <div className="h-[350px] w-full min-w-0 mb-8 relative">
                    {!mounted ? (
                        <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={350}>
                            <BarChart
                                data={data}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                style={{ outline: 'none' }}
                                barGap={-24}
                                barCategoryGap="20%"
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    content={<CustomTooltip />} 
                                    cursor={false} 
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span className="text-xs font-bold text-slate-600 ml-1">{value}</span>}
                                />

                                {/* Background Bar: Total Bill (The Vessel) */}
                                <Bar
                                    dataKey="total_bill"
                                    name="Total Tagihan"
                                    fill="#f1f5f9"
                                    radius={[20, 20, 20, 20]}
                                    barSize={24}
                                    isAnimationActive={false}
                                />

                                {/* Foreground Bar: Unpaid (The Red Liquid) */}
                                <Bar
                                    dataKey="unpaid"
                                    name="Belum Bayar"
                                    fill="#f43f5e"
                                    radius={[20, 20, 20, 20]}
                                    barSize={24}
                                    cursor="pointer"
                                    onClick={(data) => handleBarClick(data)}
                                    // Move this bar on top of the background bar
                                    xAxisId={0}
                                    style={{ transform: 'translateY(0)', transition: 'all 0.5s ease-out' }}
                                >
                                    {data.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-unpaid-${index}`}
                                            fill={'#f43f5e'}
                                            fillOpacity={selectedMonth === entry.name ? 1 : (selectedMonth ? 0.3 : 1)}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
                            <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                                Memuat Data...
                            </div>
                        </div>
                    )}
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-6">
                    {/* 1. Total Tagihan */}
                    <div className={`text-center p-4 rounded-xl border transition-all duration-300 ${selectedMonth ? 'bg-blue-50 border-blue-100 scale-105 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{viewSummary.label}</p>
                        <p className="text-xl font-black text-blue-600">{formatCurrency(viewSummary.totalBill)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">100% dari total tagihan</p>
                    </div>

                    {/* 2. Sudah Lunas */}
                    <div className={`text-center p-4 rounded-xl border transition-all duration-300 ${selectedMonth ? 'bg-emerald-50 border-emerald-100 scale-105 shadow-sm' : 'bg-emerald-50/50 border-emerald-100/50'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Sudah Lunas</p>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(viewSummary.totalPaid)}</p>
                        <p className="text-[10px] text-emerald-600/70 font-bold">
                            {viewSummary.totalBill > 0 ? ((viewSummary.totalPaid / viewSummary.totalBill) * 100).toFixed(1) : 0}% Terbayar
                        </p>
                    </div>

                    {/* 3. Belum Bayar */}
                    <div className={`text-center p-4 rounded-xl border transition-all duration-300 ${selectedMonth ? 'bg-rose-50 border-rose-100 scale-105 shadow-sm' : 'bg-rose-50/50 border-rose-100/50'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Belum Bayar</p>
                        <p className="text-xl font-black text-rose-600">{formatCurrency(viewSummary.totalUnpaid)}</p>
                        <p className="text-[10px] text-rose-600/70 font-bold">
                            Potensi Kerugian
                        </p>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
