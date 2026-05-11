"use client";

import dynamic from "next/dynamic";

// Wrapper for RevenueTrendChart with SSR disabled
export const RevenueTrendChartClient = dynamic(
    () => import('@/components/dashboard-charts').then((mod) => mod.RevenueTrendChart),
    {
        ssr: false,
        loading: () => (
            <div className="h-[240px] w-full bg-slate-50/50 rounded-2xl animate-pulse flex items-center justify-center">
                <p className="text-xs text-slate-400">Memuat Grafik...</p>
            </div>
        )
    }
);

// Wrapper for PaymentStatusWidget with SSR disabled
export const PaymentStatusWidgetClient = dynamic(
    () => import('@/components/dashboard/dashboard-widgets').then((mod) => mod.PaymentStatusWidget),
    {
        ssr: false,
        loading: () => (
            <div className="h-[250px] w-full bg-slate-50/50 rounded-2xl animate-pulse flex items-center justify-center">
                <p className="text-xs text-slate-400">Memuat Status...</p>
            </div>
        )
    }
);

// Wrapper for TimelineWidget with SSR disabled (if needed, or just normal import)
// Timeline uses basic Lucide icons, so SSR is fine usually. But to be safe and consistent:
export const TimelineWidgetClient = dynamic(
    () => import('@/components/dashboard/dashboard-widgets').then((mod) => mod.TimelineWidget),
    { ssr: false }
);

export const UsageTrendChartClient = dynamic(
    () => import('@/components/dashboard-charts').then((mod) => mod.UsageTrendChart),
    {
        ssr: false,
        loading: () => (
            <div className="h-[240px] w-full bg-slate-50/50 rounded-2xl animate-pulse flex items-center justify-center">
                <p className="text-xs text-slate-400">Memuat Tren...</p>
            </div>
        )
    }
);

export const PaymentMethodChartClient = dynamic(
    () => import('@/components/dashboard-charts').then((mod) => mod.PaymentMethodChart),
    {
        ssr: false,
        loading: () => (
            <div className="h-[240px] w-full bg-slate-50/50 rounded-2xl animate-pulse flex items-center justify-center">
                <p className="text-xs text-slate-400">Memuat Data...</p>
            </div>
        )
    }
);

export const PaymentStatisticsChartClient = dynamic(
    () => import('@/components/dashboard/payment-statistics-chart').then((mod) => mod.PaymentStatisticsChart),
    {
        ssr: false,
        loading: () => (
            <div className="h-[400px] w-full bg-slate-50/50 rounded-2xl animate-pulse flex items-center justify-center">
                <p className="text-xs text-slate-400">Memuat Statistik...</p>
            </div>
        )
    }
);
