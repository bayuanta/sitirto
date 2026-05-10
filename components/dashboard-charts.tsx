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
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

// --- Revenue Trend Chart (Bar Version) ---
export function RevenueTrendChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-2xl" />;

    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Tidak ada data
            </div>
        );
    }

    return (
        <div className="h-full w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={250}>
                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                    barCategoryGap="20%"
                >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-white border border-slate-200 text-slate-900 p-3 rounded-xl text-sm shadow-lg">
                                        <p className="font-bold mb-1">{label}</p>
                                        <p className="text-indigo-600 font-bold">
                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(payload[0].value))}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="value"
                        fill="#6366F1"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                        animationDuration={1000}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- Usage Trend Chart (Line Version) ---
export function UsageTrendChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-2xl" />;

    return (
        <div style={{ width: "100%", height: "100%", minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={200}>
                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 20,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}m³`}
                    />
                    <Tooltip
                        cursor={{ stroke: '#06b6d4', strokeWidth: 2 }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-slate-900 text-white p-3 rounded-xl text-sm shadow-xl border border-slate-700/50 backdrop-blur-md">
                                        <p className="font-semibold mb-1">{label}</p>
                                        <p className="text-cyan-400 font-bold">
                                            {payload[0].value} m³
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#06b6d4", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- Payment Method Donut Chart ---
export function PaymentMethodChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-2xl" />;

    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Tidak ada data
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={200}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span className="text-xs text-slate-600 font-medium">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
