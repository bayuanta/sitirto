import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
    label: string;
    value: string;
    subValue?: string;
    growth?: number;
    icon: LucideIcon;
    iconBgColor: string;
    iconColor: string;
    showGrowth?: boolean;
}

export function KpiCard({
    label,
    value,
    subValue,
    growth,
    icon: Icon,
    iconBgColor,
    iconColor,
    showGrowth = false
}: KpiCardProps) {
    const isPositive = growth !== undefined && growth >= 0;
    const isNeutral = growth === 0;

    const growthColor = isNeutral
        ? "text-slate-500 bg-slate-100"
        : isPositive
            ? "text-emerald-600 bg-emerald-50"
            : "text-rose-600 bg-rose-50";

    const GrowthIcon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <Card className="relative overflow-hidden border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] transition-all duration-300 bg-white rounded-2xl p-6 group">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50/50 pointer-events-none" />

            <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${iconBgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    {showGrowth && growth !== undefined && (
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${growthColor}`}>
                            <GrowthIcon className="w-3.5 h-3.5" />
                            {Math.abs(growth)}%
                        </div>
                    )}
                </div>

                {/* Value Section */}
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h3>
                    {subValue && (
                        <p className="text-xs text-slate-500 font-medium mt-1">{subValue}</p>
                    )}
                </div>
            </div>
        </Card>
    );
}

export function KpiCardSkeleton() {
    return (
        <Card className="border-0 shadow-sm bg-white rounded-2xl p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                <div className="w-16 h-6 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-2">
                <div className="w-24 h-3 bg-slate-100 rounded" />
                <div className="w-32 h-7 bg-slate-100 rounded" />
            </div>
        </Card>
    );
}
