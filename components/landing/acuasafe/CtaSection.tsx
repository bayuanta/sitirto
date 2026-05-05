"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * CtaSection - Rebuilt to match Acuasafe template cta-section
 * 
 * Template structure:
 * - bg-color-2 (#002c8f) dark navy blue
 * - pattern-layer: shape-10 (top-left 896x414), shape-2 (bottom 100% 330px),
 *   shape-33 (top 100% 37px), shape-34 (bottom 100% 44px)
 * - 2-column: image-box left (cta-1.png), content_block_3 right
 * - content: sec-title light, text white, list with flaticon checkmarks, btn-one
 */

const benefits = [
    "Pemasangan Mudah & Cepat",
    "Layanan 7 Hari Seminggu",
    "Tarif Terjangkau & Transparan"
];

export function CtaSection() {
    return (
        <section
            className="relative"
            style={{ padding: "0px 0px 85px 0px", backgroundColor: "#002c8f", marginTop: "-2px" }}
        >
            {/* pattern-layer */}
            <div className="pointer-events-none">
                {/* pattern-1: shape-10.png top-left */}
                <div
                    className="absolute left-0 top-0"
                    style={{
                        width: "896px",
                        height: "414px",
                        backgroundImage: "url(/acuasafe/images/shape/shape-10.png)",
                        backgroundRepeat: "no-repeat"
                    }}
                />

                {/* pattern-2: shape-2.png bottom */}
                <div
                    className="absolute left-0 bottom-0 w-full"
                    style={{
                        height: "330px",
                        backgroundImage: "url(/acuasafe/images/shape/shape-2.png)",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "top center",
                        backgroundSize: "cover"
                    }}
                />

                {/* Bottom wave transition: #002c8f → #172746 (footer) */}
                <div className="absolute left-0 bottom-0 w-full overflow-hidden leading-[0]" style={{ zIndex: 2 }}>
                    <svg
                        className="relative block w-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1920 100"
                        preserveAspectRatio="none"
                        style={{ height: "100px" }}
                    >
                        <path
                            d="M0,30 Q320,80 640,40 Q960,0 1280,50 Q1600,90 1920,30 L1920,100 L0,100 Z"
                            fill="#172746"
                        />
                    </svg>
                </div>
            </div>

            {/* auto-container */}
            <div className="max-w-[1200px] mx-auto px-[15px] relative z-[1]">
                <div className="flex flex-col lg:flex-row items-center">

                    {/* Left: image-column (col-lg-6) */}
                    <div className="w-full lg:w-1/2">
                        <motion.figure
                            initial={{ opacity: 0, x: -80 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5 }}
                            className="relative block"
                            style={{ marginRight: "70px" }}
                        >
                            <Image
                                src="/acuasafe/images/resource/cta-plumber.png"
                                alt="Pasang Layanan Air"
                                width={585}
                                height={561}
                                className="block ml-auto w-full h-auto"
                            />
                        </motion.figure>
                    </div>

                    {/* Right: content-column (col-lg-6) */}
                    <div className="w-full lg:w-1/2 mt-8 lg:mt-0">
                        {/* content_block_3 */}
                        <div className="relative block">
                            {/* sec-title light */}
                            <div className="relative block mb-[17px]">
                                <h2
                                    className="relative block text-[28px] lg:text-[40px] leading-[38px] lg:leading-[52px] font-[700] text-white"
                                    style={{ fontFamily: "'Spartan', sans-serif" }}
                                >
                                    Siap Mendapatkan Layanan Air Bersih Premium.
                                </h2>
                            </div>

                            {/* text */}
                            <div className="relative block mb-[22px]">
                                <p
                                    className="text-white"
                                    style={{
                                        fontSize: "15px",
                                        lineHeight: "26px",
                                        fontFamily: "'Open Sans', sans-serif"
                                    }}
                                >
                                    Bergabung dengan ratusan rumah tangga yang telah menikmati layanan air bersih PAMSIMAS Tirtowening.
                                </p>
                            </div>

                            {/* list with flaticon checkmarks */}
                            <ul className="relative block mb-[37px]">
                                {benefits.map((item, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: idx * 0.15 }}
                                        className="relative block text-white"
                                        style={{
                                            marginBottom: "13px",
                                            paddingLeft: "38px",
                                            fontSize: "15px",
                                            fontFamily: "'Spartan', sans-serif",
                                            fontWeight: 500
                                        }}
                                    >
                                        {/* checkmark circle */}
                                        <span
                                            className="absolute left-0 top-[1px] inline-flex items-center justify-center rounded-full"
                                            style={{
                                                width: "22px",
                                                height: "22px",
                                                backgroundColor: "rgba(255, 255, 255, 0.2)"
                                            }}
                                        >
                                            <i
                                                className="flaticon-draw-check-mark"
                                                style={{ fontSize: "8px", color: "#fff" }}
                                            ></i>
                                        </span>
                                        {item}
                                    </motion.li>
                                ))}
                            </ul>

                            {/* btn-box with theme-btn btn-one */}
                            <div className="relative block">
                                <a
                                    href="#cek-tagihan"
                                    className="relative inline-block text-white font-[600] uppercase tracking-wider rounded-[30px] overflow-hidden transition-all duration-500 hover:bg-white hover:text-[#002c8f]"
                                    style={{
                                        padding: "14px 45px",
                                        fontSize: "15px",
                                        backgroundColor: "#00d1f9",
                                        fontFamily: "'Open Sans', sans-serif"
                                    }}
                                >
                                    Mulai Sekarang
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
