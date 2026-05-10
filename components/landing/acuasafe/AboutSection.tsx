"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function AboutSection() {
    return (
        <section id="tentang" className="relative overflow-hidden pt-[130px] pb-[150px] bg-white">
            <div className="max-w-[1200px] mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center">

                    {/* Left: Image Column */}
                    <div className="w-full lg:w-1/2 relative lg:pr-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative block"
                        >
                            {/* Matches .about-section .image-box img { max-width: none; float: right; } */}
                            <div className="relative flex justify-center lg:justify-end">
                                <div className="relative w-full aspect-square max-w-[570px]">
                                    <Image
                                        src="/acuasafe/images/resource/about-1.png"
                                        alt="About PAMSIMAS"
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 570px"
                                        priority
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Content Column */}
                    <div className="w-full lg:w-1/2 relative lg:pl-10">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="content-box" // Matches class from template
                        >
                            {/* Title - Matches .sec-title h2 font size 40px/55px */}
                            <div className="mb-[17px]">
                                <h2 className="text-[40px] leading-[55px] font-[700] text-[#061a3a]" style={{ fontFamily: "'Spartan', sans-serif" }}>
                                    Pamsimas Tirtowening
                                </h2>
                            </div>

                            {/* Text - Matches p margin 26px */}
                            <div className="mb-[48px] text-[#808080] text-[15px] leading-[26px]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                                <p className="mb-[26px]">
                                    Pamsimas adalah unit usaha BUM Desa Kalem yang bergerak di bidang suplai air bersih.
                                    Pelanggan Pamsimas Tirtowening ini adalah warga Desa Kemasan. Dengan Pamsimas,
                                    masyarakat desa Kemasan bisa mendapatkan kualitas air yang bersih.
                                </p>
                                <p className="mb-0">
                                    Tujuan dari Pamsimas ini secara umum adalah untuk meningkatkan praktik hidup bersih dan
                                    sehat di masyarakat, meningkatkan jumlah masyarakat yang memiliki akses air minum dan
                                    sanitasi yang berkelanjutan, meningkatkan kapasitas masyarakat dan BUM Desa Kalem dalam
                                    penyelenggaraan layanan air minum dan sanitasi berbasis masyarakat, serta meningkatkan
                                    efektifitas dan kesinambungan jangka panjang pembangunan sarana dan prasarana air minum
                                    dan sanitasi berbasis masyarakat.
                                </p>
                            </div>

                            {/* Button - Matches .theme-btn padding 15px 50px */}
                            <div className="btn-box">
                                <a
                                    href="#layanan"
                                    className="inline-block bg-[#00d1f9] text-white font-[600] text-[17px] leading-[25px] rounded-[30px] px-[50px] py-[15px] hover:bg-[#002c8f] transition-all relative overflow-hidden z-[1]"
                                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                                >
                                    Selengkapnya
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
