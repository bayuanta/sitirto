"use client";

import Image from "next/image";
import { Users, Droplets, Home, Clock } from "lucide-react";

const stats = [
    { icon: <Users className="w-8 h-8 text-white" />, value: "500+", label: "Kepala Keluarga" },
    { icon: <Home className="w-8 h-8 text-white" />, value: "3", label: "Wilayah RW" },
    { icon: <Droplets className="w-8 h-8 text-white" />, value: "100%", label: "Air Bersih" },
    { icon: <Clock className="w-8 h-8 text-white" />, value: "24/7", label: "Layanan" }
];

export function StatSection() {
    return (
        <section className="py-20 bg-blue-600 relative overflow-hidden text-white">
            {/* Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
                <Image src="/acuasafe/images/shape/shape-5.png" alt="bg" fill style={{ objectFit: 'cover' }} sizes="100vw" />
            </div>

            <div className="container max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((item, idx) => (
                        <div key={idx} className="text-center group">
                            <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/20">
                                {item.icon}
                            </div>
                            <div className="text-4xl font-black mb-2">{item.value}</div>
                            <div className="text-blue-100 font-medium">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
