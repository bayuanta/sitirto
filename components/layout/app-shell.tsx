"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Check if current page is public (login or landing page) or print view - skip layout
    const isPublicPage = pathname === "/login" || pathname === "/" || pathname === "/cek" || pathname.startsWith("/print");

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setIsCollapsed(false); // Reset collapse state for mobile drawer
            } else {
                setShowMobileSidebar(false); // Hide mobile sidebar on desktop
            }
        };

        // Initial check
        handleResize();
        setMounted(true);

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleMobileSidebar = () => {
        setShowMobileSidebar(!showMobileSidebar);
    };

    // For public/auth pages, render children without shell
    if (isPublicPage) {
        return <>{children}</>;
    }

    // Prevent hydration mismatch by waiting for mount
    if (!mounted) {
        return <div className="min-h-screen bg-[#f0f1f6]" />;
    }

    return (
        <div className="min-h-screen bg-[#f0f1f6] relative text-sm">

            {/* --- MOBILE SIDEBAR (DRAWER) --- */}
            {isMobile && (
                <>
                    {/* Backdrop */}
                    <div
                        className={cn(
                            "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
                            showMobileSidebar ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        onClick={() => setShowMobileSidebar(false)}
                    />

                    {/* Drawer Panel */}
                    <div
                        className={cn(
                            "fixed inset-y-0 left-0 w-[280px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out",
                            showMobileSidebar ? "translate-x-0" : "-translate-x-full"
                        )}
                    >
                        <Sidebar
                            isCollapsed={false}
                            toggleSidebar={() => setShowMobileSidebar(false)}
                            className="h-full border-r border-slate-100"
                            isMobile={true}
                        />
                    </div>
                </>
            )}

            {/* --- DESKTOP SIDEBAR (FLOATING) --- */}
            {!isMobile && (
                <div
                    className={cn(
                        "fixed top-3 bottom-3 left-3 z-50 transition-all duration-300 ease-in-out",
                        isCollapsed ? "w-16" : "w-60"
                    )}
                >
                    <Sidebar
                        isCollapsed={isCollapsed}
                        toggleSidebar={toggleSidebar}
                        className="rounded-[20px] border border-slate-200/60 shadow-xl"
                    />
                </div>
            )}

            {/* --- HEADER --- */}
            <div
                className={cn(
                    "fixed z-40 transition-all duration-300 ease-in-out",
                    // Mobile: Fixed Top Full Width
                    isMobile ? "top-0 left-0 right-0 h-16" :
                        // Desktop: Floating Top Right
                        (isCollapsed ? "top-3 right-3 left-24 h-16" : "top-3 right-3 left-[256px] h-16")
                )}
            >
                <Header
                    onMenuClick={toggleMobileSidebar}
                    className={cn(
                        "h-full shadow-sm border-slate-200/60",
                        isMobile ? "border-b rounded-none px-4" : "border rounded-[20px]"
                    )}
                />
            </div>

            {/* --- MAIN CONTENT --- */}
            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                    // Mobile: Padding Top + Normal Padding
                    isMobile ? "pt-20 px-4 pb-4" :
                        // Desktop: Padding Left sidebar + Top
                        (isCollapsed ? "pt-20 pl-24 pr-3 pb-3" : "pt-20 pl-[256px] pr-3 pb-3")
                )}
            >
                <main className="flex-1 w-full">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}
