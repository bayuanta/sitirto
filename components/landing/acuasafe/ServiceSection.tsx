"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * ServiceSection - Rebuilt to match the original Acuasafe template (index-onepage.html)
 * 
 * Template structure:
 * - .service-section.bg-color-1 (#f2f9ff)
 * - .shape (shape-4.png overlay at top, 200px)
 * - .image-layer (service-1.png, centered, absolute bottom)
 * - .bg-shape (3 concentric white circles)
 * - .auto-container > .sec-title.centred h2
 * - 2-col grid: left-column (text-right, pr-180) / right-column (text-left, pl-180)
 * - .service-block-one cards: white bg, 40px padding, max-w-320, box-shadow, hover translateY
 * - Stagger: 1st left & last right offset left:70px
 */

const services = [
    {
        icon: "flaticon-water-bottle-1",
        title: "Air Rumah Tangga",
        desc: "Layanan air bersih untuk kebutuhan rumah tangga sehari-hari."
    },
    {
        icon: "flaticon-water-bottle",
        title: "Air Komersial",
        desc: "Solusi air bersih untuk warung, usaha kecil, dan bisnis."
    },
    {
        icon: "flaticon-water",
        title: "Instalasi Filtrasi",
        desc: "Pemasangan sistem penyaringan air untuk kualitas terbaik."
    },
    {
        icon: "flaticon-water-drop-1",
        title: "Perawatan Jaringan",
        desc: "Pemeliharaan berkala untuk memastikan aliran air lancar."
    }
];

export function ServiceSection() {
    return (
        <section
            id="layanan"
            className="relative overflow-hidden"
            style={{ backgroundColor: "#f2f9ff", padding: "190px 0px 80px 0px" }}
        >
            {/* Shape overlay at top - 200px height */}
            <div
                className="absolute left-0 top-0 w-full"
                style={{
                    height: "200px",
                    backgroundImage: "url(/acuasafe/images/shape/shape-4.png)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center"
                }}
            />

            {/* Center Image - Responsive positioning */}
            <figure
                className="relative lg:absolute z-[1] mt-10 lg:mt-0"
                style={{
                    left: "50%",
                    transform: "translateX(-50%)",
                    bottom: "0px",
                    marginLeft: "0px"
                }}
            >
                <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full max-w-[300px] lg:max-w-[438px] mx-auto"
                >
                    <Image
                        src="/acuasafe/images/resource/service-1.png"
                        alt="Service"
                        width={438}
                        height={534}
                        className="w-full h-auto object-contain"
                    />
                </motion.div>
            </figure>

            {/* Background Shapes - 3 concentric circles */}
            <div className="pointer-events-none">
                {/* bg-shape-1: 900px circle, bottom -300px */}
                <div
                    className="absolute rounded-full"
                    style={{
                        left: "50%",
                        bottom: "-300px",
                        transform: "translateX(-50%)",
                        background: "rgba(255, 255, 255, 0.5)",
                        width: "900px",
                        height: "900px"
                    }}
                />
                {/* bg-shape-2: 700px circle, bottom -200px */}
                <div
                    className="absolute rounded-full"
                    style={{
                        left: "50%",
                        bottom: "-200px",
                        transform: "translateX(-50%)",
                        background: "rgba(255, 255, 255, 0.6)",
                        width: "700px",
                        height: "700px",
                        boxShadow: "0px 0px 50px 0px rgb(0 0 0 / 5%)"
                    }}
                />
                {/* bg-shape-3: 500px circle, bottom -100px */}
                <div
                    className="absolute rounded-full"
                    style={{
                        left: "50%",
                        bottom: "-100px",
                        transform: "translateX(-50%)",
                        background: "rgba(255, 255, 255, 1)",
                        width: "500px",
                        height: "500px",
                        boxShadow: "0px 0px 50px 0px rgb(0 0 0 / 5%)"
                    }}
                />
            </div>

            {/* Auto Container */}
            <div className="max-w-[1200px] mx-auto px-[15px] relative z-[2]">

                {/* Section Title - Centered */}
                <div className="relative block text-center mb-[57px]">
                    <h2
                        className="relative block text-[30px] lg:text-[40px] leading-[42px] lg:leading-[55px] font-[700] text-[#172746]"
                        style={{ fontFamily: "'Spartan', sans-serif" }}
                    >
                        Lindungi Keluarga Anda dengan <br className="hidden lg:inline" />
                        Layanan Air Bersih Terbaik
                    </h2>
                </div>

                {/* 2-Column Row */}
                <div className="flex flex-col lg:flex-row">

                    {/* Left Column (col-lg-6) */}
                    <div className="w-full lg:w-1/2">
                        <div className="relative block lg:pr-[180px] lg:text-right">
                            {/* Service Block 1 - offset left:70px */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="relative w-full lg:max-w-[320px] z-[1] lg:ml-auto"
                                style={{ left: "0px" }}
                            >
                                <div
                                    className="relative block bg-white z-[1] mb-[70px] transition-all duration-500 hover:-translate-y-[10px] group"
                                    style={{
                                        padding: "40px 40px 35px 40px",
                                        boxShadow: "0px 10px 40px 0px rgb(0 0 0 / 8%)"
                                    }}
                                >
                                    <div className="relative text-[50px] leading-[50px] mb-[27px] transition-all duration-500 text-[#00d1f9]">
                                        <i className={services[0].icon}></i>
                                    </div>
                                    <h4 className="block text-[20px] leading-[30px] font-[600] mb-[14px]" style={{ fontFamily: "'Spartan', sans-serif" }}>
                                        <span className="inline-block text-[#172746] group-hover:text-[#00d1f9] transition-colors duration-500">{services[0].title}</span>
                                    </h4>
                                    <p className="text-[#808080] text-[15px] leading-[26px]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                                        {services[0].desc}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Service Block 2 */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="relative w-full lg:max-w-[320px] z-[1] lg:ml-auto"
                            >
                                <div
                                    className="relative block bg-white z-[1] mb-[70px] transition-all duration-500 hover:-translate-y-[10px] group"
                                    style={{
                                        padding: "40px 40px 35px 40px",
                                        boxShadow: "0px 10px 40px 0px rgb(0 0 0 / 8%)"
                                    }}
                                >
                                    <div className="relative text-[50px] leading-[50px] mb-[27px] transition-all duration-500 text-[#00d1f9]">
                                        <i className={services[2].icon}></i>
                                    </div>
                                    <h4 className="block text-[20px] leading-[30px] font-[600] mb-[14px]" style={{ fontFamily: "'Spartan', sans-serif" }}>
                                        <span className="inline-block text-[#172746] group-hover:text-[#00d1f9] transition-colors duration-500">{services[2].title}</span>
                                    </h4>
                                    <p className="text-[#808080] text-[15px] leading-[26px]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                                        {services[2].desc}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Column (col-lg-6) */}
                    <div className="w-full lg:w-1/2">
                        <div className="relative block lg:pl-[180px] lg:text-left">
                            {/* Service Block 3 */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="relative w-full lg:max-w-[320px] z-[1]"
                            >
                                <div
                                    className="relative block bg-white z-[1] mb-[70px] transition-all duration-500 hover:-translate-y-[10px] group"
                                    style={{
                                        padding: "40px 40px 35px 40px",
                                        boxShadow: "0px 10px 40px 0px rgb(0 0 0 / 8%)"
                                    }}
                                >
                                    <div className="relative text-[50px] leading-[50px] mb-[27px] transition-all duration-500 text-[#00d1f9]">
                                        <i className={services[1].icon}></i>
                                    </div>
                                    <h4 className="block text-[20px] leading-[30px] font-[600] mb-[14px]" style={{ fontFamily: "'Spartan', sans-serif" }}>
                                        <span className="inline-block text-[#172746] group-hover:text-[#00d1f9] transition-colors duration-500">{services[1].title}</span>
                                    </h4>
                                    <p className="text-[#808080] text-[15px] leading-[26px]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                                        {services[1].desc}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Service Block 4 - offset left:70px */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="relative w-full lg:max-w-[320px] z-[1]"
                                style={{ left: "0px" }}
                            >
                                <div
                                    className="relative block bg-white z-[1] mb-[70px] transition-all duration-500 hover:-translate-y-[10px] group"
                                    style={{
                                        padding: "40px 40px 35px 40px",
                                        boxShadow: "0px 10px 40px 0px rgb(0 0 0 / 8%)"
                                    }}
                                >
                                    <div className="relative text-[50px] leading-[50px] mb-[27px] transition-all duration-500 text-[#00d1f9]">
                                        <i className={services[3].icon}></i>
                                    </div>
                                    <h4 className="block text-[20px] leading-[30px] font-[600] mb-[14px]" style={{ fontFamily: "'Spartan', sans-serif" }}>
                                        <span className="inline-block text-[#172746] group-hover:text-[#00d1f9] transition-colors duration-500">{services[3].title}</span>
                                    </h4>
                                    <p className="text-[#808080] text-[15px] leading-[26px]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                                        {services[3].desc}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
