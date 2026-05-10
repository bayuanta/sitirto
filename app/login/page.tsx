"use client";

import { useState, useTransition } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
    Eye,
    EyeOff,
    Loader2,
    Activity,
    TrendingUp
} from "lucide-react";
// Using standard img for new assets to ensure immediate loading
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        startTransition(async () => {
            const result = await login(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">

            {/* LEFT SIDE - FORM (40-45%) */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 lg:p-16 xl:p-24 relative bg-white z-20 shadow-xl lg:shadow-none">
                <div className="w-full max-w-[400px]">

                    {/* Brand Header */}
                    <div className="mb-10 flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <img
                                src="/acuasafe/images/pamsimas-logo.png"
                                alt="PAMSIMAS"
                                className="w-8 h-8 object-contain"
                            />
                        </div>
                        <span className="font-bold text-xl text-[#002c8f] tracking-tight">PAMSIMAS</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Spartan', sans-serif" }}>
                            Selamat Datang
                        </h1>
                        <p className="text-slate-500">
                            Masuk ke dashboard manajemen air Anda.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email / Nomor HP</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="contoh@pamsimas.id"
                                className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#002c8f] focus:ring-1 focus:ring-[#002c8f] rounded-lg transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Kata Sandi</Label>
                                <a href="#" className="text-xs font-semibold text-[#002c8f] hover:underline">Lupa Password?</a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#002c8f] focus:ring-1 focus:ring-[#002c8f] rounded-lg transition-all pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 text-base font-bold bg-[#002c8f] hover:bg-[#001f66] transition-all shadow-lg shadow-blue-900/10 rounded-lg mt-2"
                        >
                            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Masuk Sekarang"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        &copy; 2024 PAMSIMAS Tirtowening. All rights reserved.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE - VISUALS (55-60%) */}
            {/* Background color matched to Scrumball style (Soft Blue-Purple Gradient) */}
            <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#6a85b6] to-[#bac8e0]">
                {/* Overlay Gradient for richness */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#4e54c8]/80 to-[#8f94fb]/80 z-0"></div>

                {/* Molecule Background Image Layer */}
                <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay">
                    <img
                        src="/acuasafe/images/resource/molecule-bg.jpg"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Decorative Circles (Grid Pattern) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full z-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full z-0" />

                {/* Main Content Container - Centered */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="relative w-[500px] h-[500px]">

                        {/* Circle Graphic Behind Model - Glowing White */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-b from-white/20 to-transparent backdrop-blur-sm border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]" />

                        {/* Model Image - Officer Blue (Centered & Larger) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[500px] z-10 flex items-center justify-center pointer-events-none"
                        >
                            <img
                                src="/acuasafe/images/resource/officer-blue.png"
                                alt="Professional Officer"
                                className="w-full h-full object-contain drop-shadow-2xl translate-y-4 scale-105"
                            />
                        </motion.div>

                        {/* 1. TOP LEFT: Water Quality (MOVED OUTWARD) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="absolute top-12 -left-20 bg-white p-3 rounded-2xl shadow-xl z-20 flex items-center gap-3 w-40 scale-90"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center relative p-1.5">
                                <img
                                    src="/acuasafe/images/resource/water-drop-3d.png"
                                    alt="Water Quality"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kualitas</p>
                                <p className="text-xs font-bold text-slate-800">Sangat Baik</p>
                            </div>
                        </motion.div>

                        {/* 2. RIGHT: Status (MOVED OUTWARD) */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="absolute top-1/3 -right-24 bg-white p-3.5 rounded-2xl shadow-xl z-20 w-44 scale-90"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <Activity className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Distribusi</p>
                                    <p className="text-xs font-bold text-slate-800">120L/detik</p>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-400 ml-9">Normal Operation</p>
                        </motion.div>

                        {/* 3. BOTTOM LEFT: Revenue Dashboard (MOVED OUTWARD & SMALLER) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                            className="absolute bottom-12 -left-24 bg-white p-4 rounded-2xl shadow-xl z-20 w-52 scale-90"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pendapatan</p>
                                    <h4 className="text-lg font-bold text-slate-800">Rp 45.2jt</h4>
                                </div>
                                <div className="px-1.5 py-0.5 bg-green-50 rounded text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                                    <TrendingUp className="w-2.5 h-2.5" />
                                    +15%
                                </div>
                            </div>

                            {/* Mini Sparkline Chart */}
                            <div className="h-10 w-full relative flex items-end gap-1">
                                <div className="w-1/5 h-[40%] bg-blue-100 rounded-sm"></div>
                                <div className="w-1/5 h-[60%] bg-blue-200 rounded-sm"></div>
                                <div className="w-1/5 h-[50%] bg-blue-300 rounded-sm"></div>
                                <div className="w-1/5 h-[80%] bg-blue-400 rounded-sm"></div>
                                <div className="w-1/5 h-[100%] bg-blue-600 rounded-sm"></div>
                            </div>
                        </motion.div>

                        {/* 4. BOTTOM RIGHT: AI Match Badge (MOVED OUTWARD) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="absolute bottom-20 -right-8 translate-x-1/2 bg-[#4e54c8] text-white p-4 rounded-3xl shadow-2xl shadow-indigo-500/30 z-20 flex flex-col items-center justify-center w-24 h-24 rotate-12 border-4 border-white/20 scale-90"
                        >

                            <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest text-center">AKURASI</p>
                            <p className="text-2xl font-extrabold leading-none mt-1">100%</p>

                        </motion.div>

                    </div>

                    {/* Bottom Title */}
                    <div className="absolute bottom-12 text-center z-10 px-6">
                        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Spartan', sans-serif" }}>Sistem Manajemen Cerdas</h3>
                        <p className="text-white/70 text-sm max-w-sm mx-auto">
                            Teknologi terdepan untuk pengelolaan air bersih.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
