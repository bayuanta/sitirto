"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
    ReferenceLine
} from "recharts";

// --- UTILS ---
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

// === DAILY TREND CHART ===
export function DailyTrendChart({ data }: { data: any[] }) {
    const avgRevenue = data.length > 0 ? data[0].average : 0;

    return (
        <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                        width={70}
                    />
                    <Tooltip
                        formatter={(value: any) => [formatFullCurrency(value || 0), "Pendapatan"]}
                        labelFormatter={(label) => `Tanggal ${label}`}
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                            padding: '12px 16px',
                            backgroundColor: 'white'
                        }}
                        itemStyle={{ color: '#1e293b', fontWeight: 700, fontSize: '13px' }}
                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '11px', fontWeight: 600 }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <ReferenceLine
                        y={avgRevenue}
                        stroke="#f59e0b"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{
                            value: 'Rata-rata',
                            position: 'right',
                            fill: '#f59e0b',
                            fontSize: 10,
                            fontWeight: 600
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={3}
                        activeDot={{ r: 6, stroke: 'white', strokeWidth: 3, fill: '#6366f1' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// === WEEKLY BAR CHART ===
export function WeeklyBarChart({ data }: { data: any[] }) {
    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                        width={70}
                    />
                    <Tooltip
                        formatter={(value: any) => [formatFullCurrency(value || 0), "Pendapatan"]}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            padding: '10px 14px',
                        }}
                        itemStyle={{ color: '#1e293b', fontWeight: 700 }}
                        cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    />
                    <Bar
                        dataKey="revenue"
                        fill="#6366f1"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={50}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// === PAYMENT METHOD PIE CHART ===
export function PaymentMethodChart({ data }: { data: any[] }) {
    return (
        <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={8}
                        startAngle={90}
                        endAngle={-270}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
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
                        height={40}
                        iconType="circle"
                        formatter={(value, entry: any) => (
                            <span className="text-slate-600 font-semibold text-xs ml-1">
                                {value} ({entry.payload.percentage}%)
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// === AREA BREAKDOWN BAR CHART ===
export function AreaBreakdownChart({ data }: { data: any[] }) {
    const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                        formatter={(value: any) => [formatFullCurrency(value || 0), "Pendapatan"]}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            padding: '10px 14px',
                        }}
                        itemStyle={{ color: '#1e293b', fontWeight: 700 }}
                    />
                    <Bar
                        dataKey="revenue"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={35}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
