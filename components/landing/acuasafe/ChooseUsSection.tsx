"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * ChooseUsSection - Rebuilt to match the original Acuasafe template
 * 
 * Dark navy blue (#002c8f) background with water-bg.jpg overlay
 * blended using mix-blend-mode for a natural water effect.
 */

const benefits = [
    {
        title: "Kualitas Terjamin",
        desc: "Air bersih yang memenuhi standar kesehatan dan diolah dengan teknologi modern."
    },
    {
        title: "Pembayaran Mudah",
        desc: "Sistem tagihan transparan dengan berbagai metode pembayaran yang fleksibel."
    }
];

export function ChooseUsSection() {
    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: "#002c8f" }}>

            {/* Water background image - blended with the navy blue */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: "url(/acuasafe/images/shape/water-bg.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center bottom",
                    backgroundRepeat: "no-repeat",
                    mixBlendMode: "luminosity"
                }}
            />

            {/* Wave curve at top - smooth transition from white section above */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-[2]" style={{ transform: "translateY(-98%)" }}>
                <svg
                    className="relative block w-full"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1920 120"
                    preserveAspectRatio="none"
                    style={{ height: "120px" }}
                >
                    <path
                        d="M0,120 L0,80 Q320,0 640,60 Q960,120 1280,60 Q1600,0 1920,60 L1920,120 Z"
                        fill="#002c8f"
                    />
                </svg>
            </div>

            {/* Main content area with padding */}
            <div className="relative" style={{ padding: "80px 0px 88px 0px" }}>

                {/* shape-layer decorations */}
                <div className="pointer-events-none">
                    {/* shape-1: shape-6.png */}
                    <div
                        className="absolute left-0 top-0"
                        style={{
                            width: "604px",
                            height: "395px",
                            backgroundImage: "url(/acuasafe/images/shape/shape-6.png)",
                            backgroundRepeat: "no-repeat"
                        }}
                    />

                    {/* shape-2: animated circle */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute rounded-full"
                        style={{
                            top: "-50px",
                            right: "230px",
                            width: "330px",
                            height: "330px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)"
                        }}
                    />

                    {/* shape-3: static circle */}
                    <div
                        className="absolute rounded-full"
                        style={{
                            top: "-40px",
                            right: "-120px",
                            width: "560px",
                            height: "560px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)"
                        }}
                    />

                    {/* shape-4: bottom wave strip */}
                    <div
                        className="absolute left-0 bottom-0 w-full"
                        style={{
                            height: "62px",
                            backgroundImage: "url(/acuasafe/images/shape/shape-32.png)",
                            backgroundSize: "cover",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "top center"
                        }}
                    />
                </div>

                {/* Auto Container */}
                <div className="max-w-[1200px] mx-auto px-[15px] relative z-[1]">
                    <div className="flex flex-col lg:flex-row items-start">

                        {/* Left: Content Column */}
                        <div className="w-full lg:w-1/2">
                            <div className="relative block lg:mr-[35px]">
                                {/* sec-title light */}
                                <div className="relative block mb-[30px]">
                                    <h2
                                        className="relative block text-[28px] lg:text-[40px] leading-[38px] lg:leading-[55px] font-[700] text-white"
                                        style={{ fontFamily: "'Spartan', sans-serif" }}
                                    >
                                        Lindungi Keluarga Anda dengan Sistem Air Bersih Terbaik.
                                    </h2>
                                </div>

                                {/* inner-box with single-items */}
                                <div className="relative block">
                                    {benefits.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                                            className="relative block"
                                            style={{
                                                paddingLeft: "85px",
                                                marginBottom: idx < benefits.length - 1 ? "27px" : "0px",
                                                minHeight: "90px"
                                            }}
                                        >
                                            {/* icon-box */}
                                            <div
                                                className="absolute left-0 inline-flex items-center justify-center rounded-full text-white"
                                                style={{
                                                    top: "4px",
                                                    width: "60px",
                                                    height: "60px",
                                                    fontSize: "20px",
                                                    lineHeight: "66px",
                                                    backgroundColor: "#00d1f9"
                                                }}
                                            >
                                                <i className="flaticon-draw-check-mark"></i>
                                            </div>

                                            {/* text */}
                                            <div>
                                                <h4
                                                    className="block text-white mb-[8px]"
                                                    style={{
                                                        fontSize: "20px",
                                                        lineHeight: "30px",
                                                        fontWeight: 500,
                                                        fontFamily: "'Spartan', sans-serif"
                                                    }}
                                                >
                                                    {item.title}
                                                </h4>
                                                <p
                                                    className="text-white"
                                                    style={{
                                                        fontSize: "15px",
                                                        lineHeight: "26px",
                                                        fontFamily: "'Open Sans', sans-serif"
                                                    }}
                                                >
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Image Column */}
                        <div className="w-full lg:w-1/2 mt-12 lg:mt-0">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5 }}
                                className="relative block z-[1]"
                                style={{
                                    marginRight: "-140px",
                                    top: "100px"
                                }}
                            >
                                {/* image with white border frame */}
                                <figure
                                    className="relative block overflow-hidden"
                                    style={{
                                        background: "#fff",
                                        border: "15px solid #fff",
                                        boxShadow: "0px 10px 50px 0px rgb(0 0 0 / 10%)"
                                    }}
                                >
                                    <Image
                                        src="/acuasafe/images/resource/chooseus-1.jpg"
                                        alt="Choose Us"
                                        width={570}
                                        height={450}
                                        className="w-full object-cover"
                                    />
                                </figure>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
