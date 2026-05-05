"use client";

import Image from "next/image";
import { Droplets, Sparkles, Recycle, GlassWater } from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: <Droplets className="w-16 h-16" />,
        title: "Kemurnian Maksimal",
        desc: "Air bersih dengan standar kualitas terjamin untuk kesehatan keluarga."
    },
    {
        // Changed from ShieldCheck to Sparkles (Matches concept of 'Chlorine Free' / Purity better visually than shield)
        icon: <Sparkles className="w-16 h-16" />,
        title: "Bebas Kontaminasi",
        desc: "Proses pengolahan modern memastikan air bebas dari bakteri berbahaya."
    },
    {
        icon: <Recycle className="w-16 h-16" />,
        title: "Sistem Filtrasi",
        desc: "Teknologi penyaringan berlapis untuk hasil air yang jernih dan bersih."
    },
    {
        icon: <GlassWater className="w-16 h-16" />,
        title: "Air Sehat",
        desc: "Mendukung gaya hidup sehat dengan air berkualitas setiap hari."
    }
];

export function FeatureSection() {
    return (
        <section className="py-20 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-white rounded-[30px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.1)] p-8 lg:p-12 -mt-[100px] relative z-20"
                >
                    {/* Title */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-black text-[#172746] leading-tight">
                            Nama Terpercaya dalam <br />
                            <span className="text-[#00d1f9]">Pengelolaan Air Bersih</span>
                        </h2>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="text-center group relative feature-block-one"
                            >
                                <div className="inner-box relative block">
                                    {/* Shape Separator - Positioned absolute right */}
                                    {/* Hide on mobile/tablet or last item */}
                                    <div
                                        className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-4 w-3 h-[121px] bg-no-repeat pointer-events-none"
                                        style={{
                                            backgroundImage: "url(/acuasafe/images/shape/shape-3.png)",
                                            backgroundSize: "contain",
                                            display: idx === features.length - 1 ? 'none' : 'block'
                                        }}
                                    />

                                    {/* Icon Box */}
                                    <div className="relative inline-block mb-6 transition-all duration-500 transform group-hover:scale-110">
                                        <div className="relative w-24 h-24 mx-auto flex items-center justify-center text-[#00d1f9] text-[60px] leading-[60px]">
                                            {feature.icon}
                                        </div>
                                    </div>

                                    <h4 className="text-xl font-medium text-[#172746] mb-4 leading-[30px] group-hover:text-[#00d1f9] transition-colors">
                                        {feature.title}
                                    </h4>
                                    <p className="text-slate-500 text-[15px] leading-[26px]">
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
