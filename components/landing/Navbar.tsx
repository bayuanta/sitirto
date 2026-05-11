"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react"; // Added Search if mimicking template fully
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0); // Trigger immediately on scroll like template sometimes, or keep 150
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Beranda", href: "#hero" }, // Home
        { name: "Tentang", href: "#tentang" }, // About
        { name: "Layanan", href: "#layanan" }, // Service
        { name: "Testimoni", href: "#testimoni" }, // Testimonial
        { name: "Tarif", href: "#tarif" }, // Custom
        { name: "Cek Tagihan", href: "#cek-tagihan" }, // Custom
    ];

    // Updated NavContent with solid white background logic (always dark text)
    const NavContent = ({ isSticky = false }: { isSticky?: boolean }) => (
        // Template uses .outer-box with padding 0 70px. Fluid width.
        <div className="w-full px-4 lg:px-[70px] flex items-center justify-between">

            {/* Logo Box - Padding 29px 0 in template */}
            <Link href="/" className={`${isSticky ? 'py-[21px]' : 'py-[29px]'} flex items-center gap-1 relative z-20`}>
                {/* Reduced width to tight-fit the icon part of the logo */}
                <div className={`relative ${isSticky ? 'w-[65px] h-[50px]' : 'w-[85px] h-[65px]'}`}>
                    <Image
                        src="/acuasafe/images/pamsimas-logo.png"
                        alt="PAMSIMAS Logo"
                        fill
                        style={{ objectFit: 'contain', objectPosition: 'left' }}
                        sizes="(max-width: 768px) 65px, 85px"
                    />
                </div>
                <span
                    className={`font-bold tracking-wide text-black ${isSticky ? 'text-[28px]' : 'text-[34px]'}`}
                    style={{ fontFamily: "var(--font-ms-stufi), sans-serif", lineHeight: 1 }}
                >
                    Tirtowening
                </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
                {navLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        className={`relative block font-[700] hover:text-[#00d1f9] transition-all duration-500 text-[#172746] ${isSticky
                            ? 'text-[15px] py-[25px] px-[35px]'
                            : 'text-[16px] leading-[30px] py-[42px] px-[35px]'
                            }`}
                        style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                        {link.name}
                    </a>
                ))}
            </nav>

            {/* Right Side - Search & Button */}
            <div className="hidden lg:flex items-center gap-6">
                {/* Search Icon */}
                <button className="text-[20px] hover:text-[#00d1f9] transition-all text-[#222]">
                    <Search size={isSticky ? 20 : 22} className="stroke-[2.5px]" />
                </button>

                {/* Login Button */}
                <Link
                    href="/login"
                    className={`hidden lg:inline-flex rounded-[30px] font-semibold bg-[#00d1f9] text-white hover:bg-[#002c8f] transition-all shadow-lg ${isSticky
                        ? 'px-5 py-2 text-[14px]'
                        : 'px-6 py-3 text-[15px]'
                        }`}
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                    Login
                </Link>
            </div>

            {/* Mobile Toggle */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#002c8f]"
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
        </div>
    );

    return (
        <>
            {/* ===== 1. STATIC HEADER (Absolute) ===== */}
            <header className="absolute top-0 left-0 right-0 z-50 bg-white shadow-sm">
                <NavContent isSticky={false} />

                {/* Header Shape - width 100%, bottom -143px */}
                <div
                    className="absolute left-0 -bottom-[143px] w-full h-[143px] pointer-events-none z-40 bg-no-repeat bg-bottom bg-cover"
                    style={{
                        backgroundImage: "url(/acuasafe/images/shape/shape-1.png)",
                        backgroundSize: "100% 100%"
                    }}
                >
                </div>
            </header>

            {/* ===== 2. STICKY HEADER ===== */}
            <div
                className={`fixed top-0 left-0 right-0 z-[999] bg-white shadow-md transition-all duration-500 transform ${isScrolled
                    ? "translate-y-0 opacity-100 visible"
                    : "-translate-y-full opacity-0 invisible"
                    }`}
            >
                <NavContent isSticky={true} />
            </div>

            {/* ===== Mobile Menu Overlay ===== */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed inset-0 z-[110] bg-[#002c8f] flex flex-col pt-24 px-8 lg:hidden"
                    >
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-6 right-6 p-2 text-white"
                            aria-label="Close menu"
                        >
                            <X size={32} />
                        </button>

                        <div className="flex flex-col gap-4 w-full">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-xl font-bold text-white border-b border-white/20 pb-4"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="mt-6 px-8 py-4 bg-[#00d1f9] text-white font-bold rounded-xl text-center"
                            >
                                Login Admin
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
