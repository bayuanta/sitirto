"use client";

import { motion } from "framer-motion";

/**
 * TariffSection - Redesigned to match Acuasafe shop-section style
 * 
 * Uses same design pattern as shop-block-one:
 * - White card bg, box-shadow, centered content
 * - Large icon area at top (using flaticon water icons)
 * - Animated shape-7.png wave divider
 * - Price, description, and styled button
 * - sec-title heading with Spartan font
 * - 240px top padding (accounts for chooseus image overlap)
 */

const tariffItems = [
    {
        icon: "flaticon-water-drop",
        label: "Per Meter Kubik",
        title: "Biaya Pemakaian Air",
        price: "Rp 1.300",
        unit: "/ m³",
        desc: "Tarif per meter kubik pemakaian air bulanan. Dihitung berdasarkan selisih angka meteran.",
        color: "#00d1f9"
    },
    {
        icon: "flaticon-water-tap",
        label: "Bulanan Tetap",
        title: "Biaya Perawatan",
        price: "Rp 5.000",
        unit: "/ bulan",
        desc: "Biaya bulanan untuk pemeliharaan jaringan pipa dan infrastruktur distribusi air.",
        color: "#002c8f"
    }
];

export function TariffSection() {
    return (
        <section
            id="tarif"
            className="relative text-center"
            style={{ padding: "100px 0px 60px 0px", backgroundColor: "#fff" }}
        >
            <div className="max-w-[1200px] mx-auto px-[15px]">
                {/* sec-title */}
                <div className="relative block mb-[55px]">
                    <h2
                        className="relative block text-[30px] lg:text-[40px] leading-[40px] lg:leading-[52px] font-[700] text-[#172746]"
                        style={{ fontFamily: "'Spartan', sans-serif" }}
                    >
                        Tarif Layanan<br />Air Bersih Kami
                    </h2>
                </div>

                {/* tariff cards - 2 columns centered */}
                <div className="flex flex-col md:flex-row gap-[30px] justify-center items-stretch max-w-[800px] mx-auto">
                    {tariffItems.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: idx * 0.3 }}
                            className="w-full md:w-1/2 flex"
                        >
                            <div
                                className="relative block bg-white overflow-hidden text-center group w-full flex flex-col"
                                style={{
                                    padding: "23px 45px 60px 45px",
                                    boxShadow: "0px 10px 50px 0px rgb(0 0 0 / 8%)"
                                }}
                            >
                                {/* Icon area (replacing image-box) */}
                                <figure className="relative block overflow-hidden">
                                    <div
                                        className="w-full py-[40px] flex items-center justify-center transition-all duration-500 group-hover:scale-[1.06]"
                                        style={{ backgroundColor: "#f2f9ff" }}
                                    >
                                        <div
                                            className="w-[100px] h-[100px] rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            <i
                                                className={item.icon}
                                                style={{ fontSize: "40px", color: "#fff" }}
                                            ></i>
                                        </div>
                                    </div>
                                </figure>

                                {/* lower-content */}
                                <div className="relative block" style={{ paddingTop: "55px" }}>
                                    {/* Animated wave shape-7.png divider */}
                                    <div
                                        className="absolute left-0 w-full"
                                        style={{
                                            top: "13px",
                                            height: "10px",
                                            backgroundImage: "url(/acuasafe/images/shape/shape-7.png)",
                                            backgroundRepeat: "repeat-x",
                                            animation: "slide 60s linear infinite"
                                        }}
                                    />

                                    {/* label */}
                                    <span
                                        className="relative block mb-[9px]"
                                        style={{
                                            fontSize: "15px",
                                            color: "#808080",
                                            fontFamily: "'Open Sans', sans-serif"
                                        }}
                                    >
                                        {item.label}
                                    </span>

                                    {/* title */}
                                    <h4
                                        className="block mb-[20px]"
                                        style={{
                                            fontSize: "20px",
                                            lineHeight: "30px",
                                            fontWeight: 600,
                                            color: "#172746",
                                            fontFamily: "'Spartan', sans-serif"
                                        }}
                                    >
                                        {item.title}
                                    </h4>

                                    {/* price */}
                                    <h6
                                        className="block mb-[16px]"
                                        style={{
                                            fontSize: "28px",
                                            lineHeight: "36px",
                                            fontWeight: 700,
                                            color: item.color,
                                            fontFamily: "'Spartan', sans-serif"
                                        }}
                                    >
                                        {item.price}
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 400,
                                                color: "#808080",
                                                marginLeft: "4px"
                                            }}
                                        >
                                            {item.unit}
                                        </span>
                                    </h6>

                                    {/* description */}
                                    <p
                                        className="mb-[23px]"
                                        style={{
                                            fontSize: "15px",
                                            lineHeight: "26px",
                                            color: "#808080",
                                            fontFamily: "'Open Sans', sans-serif"
                                        }}
                                    >
                                        {item.desc}
                                    </p>

                                    {/* btn-box with theme-btn btn-two style */}
                                    <div className="relative block">
                                        <a
                                            href="#cek-tagihan"
                                            className="relative inline-block text-white font-[600] uppercase tracking-wider rounded-[30px] overflow-hidden transition-all duration-500 hover:opacity-90"
                                            style={{
                                                padding: "10.5px 37px",
                                                fontSize: "14px",
                                                backgroundColor: item.color,
                                                fontFamily: "'Open Sans', sans-serif"
                                            }}
                                        >
                                            Cek Tagihan
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Note */}
                <div className="relative block mt-[40px]">
                    <p
                        style={{
                            fontSize: "14px",
                            color: "#808080",
                            fontFamily: "'Open Sans', sans-serif"
                        }}
                    >
                        * Tagihan dihitung setiap bulan berdasarkan pemakaian aktual
                    </p>
                </div>
            </div>

            {/* CSS animation for the wave shape */}
            <style jsx>{`
                @keyframes slide {
                    from { background-position: 0 0; }
                    to { background-position: 1920px 0; }
                }
            `}</style>
        </section>
    );
}
