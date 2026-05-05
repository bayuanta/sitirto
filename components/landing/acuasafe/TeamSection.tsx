"use client";

import Image from "next/image";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { motion } from "framer-motion";

const team = [
    {
        name: "Dr. Budi Santoso",
        role: "Direktur Utama",
        image: "/acuasafe/images/team/team-1.jpg" // Placeholder path, likely won't exist but following structure
    },
    {
        name: "Siti Aminah",
        role: "Manajer Keuangan",
        image: "/acuasafe/images/team/team-2.jpg"
    },
    {
        name: "Ahmad Rizky",
        role: "Kepala Teknis",
        image: "/acuasafe/images/team/team-3.jpg"
    }
];

export function TeamSection() {
    return (
        <section className="py-24 bg-white text-center">
            <div className="container max-w-7xl mx-auto px-4">
                <div className="mb-16">
                    <h2 className="text-4xl font-black text-slate-900 mb-4">
                        Tim Pengelola PAMSIMAS
                    </h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        Dedikasi profesional untuk melayani kebutuhan air bersih masyarakat.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {team.map((member, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className="group relative overflow-hidden rounded-[30px] bg-white shadow-xl"
                        >
                            <div className="relative h-96 w-full bg-slate-200">
                                {/* Placeholder Image Logic since we might not have Team photos */}
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
                                    <span className="text-4xl">👤</span>
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-blue-600/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                                    <a href="#" className="p-3 bg-white text-blue-600 rounded-full hover:bg-slate-900 hover:text-white transition-colors">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="p-3 bg-white text-blue-600 rounded-full hover:bg-slate-900 hover:text-white transition-colors">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="p-3 bg-white text-blue-600 rounded-full hover:bg-slate-900 hover:text-white transition-colors">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full p-6 bg-white/95 backdrop-blur-sm">
                                <h4 className="text-xl font-bold text-slate-900">{member.name}</h4>
                                <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">{member.role}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
