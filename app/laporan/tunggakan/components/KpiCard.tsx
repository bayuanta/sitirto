import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
    label: string;
    value: string;
    subValue?: string;
    icon: LucideIcon;
    iconBgColor: string;
    iconColor: string;
    variant?: "default" | "danger" | "warning";
}

export function KpiCard({
    label,
    value,
    subValue,
    icon: Icon,
    iconBgColor,
    iconColor,
    variant = "default"
}: KpiCardProps) {
    const borderColor = variant === "danger"
        ? "border-rose-100"
        : variant === "warning"
            ? "border-amber-100"
            : "border-slate-100";

    return (
        <Card className={`relative overflow-hidden border ${borderColor} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] transition-all duration-300 bg-white rounded-2xl p-6 group`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50/50 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${iconBgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <h3 className={`text-2xl font-black tracking-tight leading-none ${variant === "danger" ? "text-rose-600" :
                            variant === "warning" ? "text-amber-600" : "text-slate-900"
                        }`}>{value}</h3>
                    {subValue && (
                        <p className="text-xs text-slate-500 font-medium mt-1">{subValue}</p>
                    )}
                </div>
            </div>
        </Card>
    );
}
