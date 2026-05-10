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
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    }
    if (amount >= 1000) {
        return `Rp ${(amount / 1000).toFixed(0)}rb`;
    }
    return `Rp ${amount}`;
};

const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// === AREA PIE CHART ===
export function AreaPieChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

    if (!mounted) return <div className="h-[400px] w-full bg-slate-50/50 animate-pulse rounded-2xl" />;

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="40%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="amount"
                        cornerRadius={6}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                strokeWidth={0}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => formatFullCurrency(value || 0)}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            backgroundColor: 'rgba(255,255,255,0.98)',
                            padding: '10px 14px',
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value, entry: any) => (
                            <span className="text-slate-600 font-semibold text-[10px] ml-1">
                                {value} ({entry.payload.percentage}%)
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// === AGING BAR CHART ===
export function AgingBarChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return <div className="h-[280px] w-full bg-slate-50/50 animate-pulse rounded-2xl" />;

    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="range"
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                        width={65}
                    />
                    <Tooltip
                        formatter={(value: any) => [formatFullCurrency(value || 0), "Tunggakan"]}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            padding: '10px 14px',
                        }}
                        itemStyle={{ color: '#1e293b', fontWeight: 700 }}
                        cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }}
                    />
                    <Bar
                        dataKey="amount"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={45}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// === HORIZONTAL BAR (Area Breakdown) ===
export function AreaBreakdownChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];

    if (!mounted) return <div className="h-[280px] w-full bg-slate-50/50 animate-pulse rounded-2xl" />;

    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height={280}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                    />
                    <Tooltip
                        formatter={(value: any) => [formatFullCurrency(value || 0), "Tunggakan"]}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            padding: '10px 14px',
                        }}
                        itemStyle={{ color: '#1e293b', fontWeight: 700 }}
                    />
                    <Bar
                        dataKey="amount"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={30}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
