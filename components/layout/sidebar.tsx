"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Gauge,
    Banknote,
    History,
    Settings,
    MapPin,
    Droplets,
    Zap,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Hexagon,
    X,
    Wallet,
    BarChart3,
    AlertTriangle
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    className?: string;
    isMobile?: boolean;
}

const MENU_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Data Pelanggan", href: "/pelanggan", icon: Users },
    { label: "Input Meteran", href: "/input-meteran", icon: Gauge },
    { label: "Pembayaran", href: "/pembayaran", icon: Banknote },
    { label: "Setoran Tunai", href: "/setoran", icon: Wallet },
    { label: "Laporan Pendapatan", href: "/laporan/pendapatan", icon: BarChart3 },
    { label: "Laporan Tunggakan", href: "/laporan/tunggakan", icon: AlertTriangle },
    { label: "Riwayat Transaksi", href: "/riwayat", icon: History },
    { label: "Data Wilayah", href: "/wilayah", icon: MapPin },
    { label: "Tarif Dasar", href: "/tarif", icon: Settings },
];

export function Sidebar({ isCollapsed, toggleSidebar, className, isMobile = false }: SidebarProps) {
    return (
        <div className={cn("h-full flex flex-col bg-white overflow-hidden", className)}>

            {/* Header: Logo & Toggle - Reduced Height */}
            <div className={cn("flex items-center p-4 h-16 lg:h-20", isCollapsed ? "justify-center" : "justify-between")}>
                {/* Logo Area */}
                <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isCollapsed ? "w-0 p-0 opacity-0 hidden" : "w-auto opacity-100")}>
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                        <Hexagon className="h-4 w-4 text-white fill-current" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">PAMSIMAS</h1>
                    </div>
                </div>

                {/* Collapsed Logo */}
                {isCollapsed && (
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                        <Hexagon className="h-4 w-4 text-white fill-current" />
                    </div>
                )}

                {/* Mobile Close Button */}
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                        <X className="h-5 w-5 text-slate-400" />
                    </Button>
                )}
            </div>

            {/* Navigation - Compact Padding */}
            <ScrollArea className="flex-1 px-3 pb-3">
                <nav className="flex flex-col gap-1">
                    {MENU_ITEMS.map((item, index) => {
                        return (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                isCollapsed={isCollapsed}
                            >
                                {item.label}
                            </NavItem>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Toggle Button for Desktop */}
            {!isMobile && (
                <div className={cn("px-3 pb-3", isCollapsed ? "flex justify-center" : "flex justify-end")}>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-slate-400 hover:bg-slate-50">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>
            )}

            {/* Footer Profile - Compact */}
            <div className="p-3 space-y-3 border-t border-slate-50 bg-slate-50/50">
                <div className={cn(
                    "flex items-center rounded-xl hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-200 hover:shadow-sm",
                    isCollapsed ? "justify-center p-1.5" : "gap-2 p-2"
                )}>
                    <Avatar className="h-8 w-8 border border-slate-200">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>

                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">Administrator</p>
                        </div>
                    )}

                    {!isCollapsed && (
                        <Settings className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                    )}
                </div>
            </div>
        </div>
    );
}

function NavItem({ href, icon: Icon, children, isCollapsed }: { href: string; icon: any; children: React.ReactNode, isCollapsed: boolean }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    const content = (
        <Link
            href={href}
            className={cn(
                "flex items-center transition-all duration-200 group rounded-[12px]",
                isCollapsed ? "justify-center h-9 w-9 mx-auto" : "h-9 w-full px-3 relative",
                isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
            )}
        >
            <Icon
                className={cn(
                    "transition-colors",
                    isCollapsed ? "h-4 w-4" : "mr-3 h-4 w-4",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                )}
            />

            {!isCollapsed && (
                <span className={cn("font-medium text-xs", isActive && "font-bold")}>
                    {children}
                </span>
            )}
        </Link>
    );

    if (isCollapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-bold text-xs bg-slate-900 text-white border-0 ml-2 rounded-lg py-1 px-2">
                    {children}
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
}
