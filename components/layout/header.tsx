"use client";

import { useState, useTransition } from "react";
import { Bell, Search, Menu, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";

interface HeaderProps {
    className?: string;
    onMenuClick?: () => void;
}

export function Header({ className, onMenuClick }: HeaderProps) {
    const [isPending, startTransition] = useTransition();

    const currentDate = new Date().toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    const handleLogout = () => {
        startTransition(async () => {
            await logout();
        });
    };

    return (
        <header className={cn("px-4 lg:px-8 flex items-center justify-between bg-white", className)}>

            {/* Left: Hamburger (Mobile) & Greeting */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-slate-500 -ml-2"
                    onClick={onMenuClick}
                >
                    <Menu className="h-6 w-6" />
                </Button>

                <div>
                    <h2 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight leading-none">
                        Halo, Admin
                    </h2>
                    <p className="text-[10px] lg:text-xs text-slate-500 font-medium mt-1 capitalize hidden md:block">
                        {currentDate}
                    </p>
                </div>
            </div>

            {/* Right: Search & Profile */}
            <div className="flex items-center gap-2 lg:gap-4">
                {/* Search Bar - Pill Shape (Desktop Only) */}
                <div className="relative hidden lg:block w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        id="global-search"
                        name="global-search"
                        placeholder="Cari data..."
                        className="pl-10 h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-full transition-all font-medium text-xs"
                    />
                </div>

                {/* Mobile Search Icon */}
                <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-slate-500">
                    <Search className="h-5 w-5" />
                </Button>

                {/* Actions */}
                <div className="flex items-center gap-1 lg:gap-2">

                    {/* Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 pl-1 lg:pl-2 cursor-pointer hover:bg-slate-50 p-1 lg:p-1.5 lg:pr-3 rounded-full transition-colors border border-transparent hover:border-slate-100 group">
                                <Avatar className="h-8 w-8 lg:h-9 lg:w-9 border-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                                    <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">AD</AvatarFallback>
                                </Avatar>
                                <div className="hidden lg:flex items-center gap-1">
                                    <p className="text-sm font-bold text-slate-700 leading-none group-hover:text-indigo-700">Admin Utama</p>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-200 p-2">
                            <div className="px-3 py-2">
                                <p className="text-sm font-bold text-slate-900">Admin Utama</p>
                                <p className="text-xs text-slate-500">tirtoweningkemasan@gmail.com</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                disabled={isPending}
                                className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer rounded-lg"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {isPending ? "Keluar..." : "Keluar"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
