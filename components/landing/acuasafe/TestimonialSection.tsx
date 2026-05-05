"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const testimonials = [
    {
        name: "Pak Slamet",
        role: "Warga RT 02",
        content: "Sejak ada PAMSIMAS, kami tidak perlu lagi khawatir soal air bersih. Tagihannya juga murah dan transparan.",
        rating: 5,
        image: "/acuasafe/images/resource/testimonial-1.jpg"
    },
    {
        name: "Bu Sumiati",
        role: "Warga RT 05",
        content: "Pelayanannya bagus, kalau ada masalah langsung ditangani. Airnya juga bersih dan lancar setiap hari.",
        rating: 5,
        image: "/acuasafe/images/resource/testimonial-2.jpg"
    },
    {
        name: "Pak Hadi",
        role: "Pemilik Warung",
        content: "Untuk usaha warung saya, air dari PAMSIMAS sangat membantu. Tidak perlu beli air lagi, lebih hemat.",
        rating: 5,
        image: "/acuasafe/images/resource/testimonial-1.jpg"
    },
    {
        name: "Bu Rina",
        role: "Warga RT 03",
        content: "Air bersih dari PAMSIMAS kualitasnya bagus. Anak-anak bisa mandi dan minum air yang sehat setiap hari.",
        rating: 5,
        image: "/acuasafe/images/resource/testimonial-2.jpg"
    }
];

function StarIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffb83d" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -300 : 300,
        opacity: 0
    })
};

export function TestimonialSection() {
    const [activePage, setActivePage] = useState(0);
    const [direction, setDirection] = useState(1);
    const itemsPerPage = 2;
    const totalPages = Math.ceil(testimonials.length / itemsPerPage);

    const currentItems = testimonials.slice(
        activePage * itemsPerPage,
        activePage * itemsPerPage + itemsPerPage
    );

    const goToPage = useCallback((page: number) => {
        setDirection(page > activePage ? 1 : -1);
        setActivePage(page);
    }, [activePage]);

    // Auto-play every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setActivePage((prev) => (prev + 1) % totalPages);
        }, 5000);
        return () => clearInterval(timer);
    }, [totalPages]);

    return (
        <section
            id="testimoni"
            className="relative"
            style={{ padding: "188px 0px 225px 0px", backgroundColor: "#f2f9ff" }}
        >
            {/* shape-layer */}
            <div className="pointer-events-none">
                {/* shape-1: shape-8.png at top */}
                <div
                    className="absolute left-0 top-0 w-full"
                    style={{
                        height: "80px",
                        backgroundImage: "url(/acuasafe/images/shape/shape-8.png)",
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center"
                    }}
                />

                {/* Bottom wave transition: #f2f9ff → #002c8f */}
                <div className="absolute left-0 bottom-0 w-full overflow-hidden leading-[0]" style={{ zIndex: 2 }}>
                    <svg
                        className="relative block w-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1920 134"
                        preserveAspectRatio="none"
                        style={{ height: "134px" }}
                    >
                        <path
                            d="M0,40 Q240,0 480,30 Q720,70 960,30 Q1200,-10 1440,30 Q1680,70 1920,20 L1920,134 L0,134 Z"
                            fill="#002c8f"
                        />
                    </svg>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-[15px] relative z-[1]">
                {/* sec-title */}
                <div className="relative block mb-[40px]">
                    <h2
                        className="relative block text-center text-[30px] lg:text-[40px] leading-[40px] lg:leading-[52px] font-[700] text-[#172746]"
                        style={{ fontFamily: "'Spartan', sans-serif" }}
                    >
                        Apa Kata Pelanggan Kami<br />Tentang PAMSIMAS
                    </h2>
                </div>

                {/* Carousel content */}
                <div className="relative">
                    {/* Pagination dots */}
                    <div className="absolute -top-[80px] right-0 flex gap-[15px] z-[5]">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToPage(i)}
                                className="rounded-full transition-all duration-500"
                                style={{
                                    width: "15px",
                                    height: "15px",
                                    backgroundColor: activePage === i ? "#00d1f9" : "#dfe5eb",
                                    cursor: "pointer",
                                    border: "none"
                                }}
                            />
                        ))}
                    </div>

                    {/* Testimonial cards with slide animation */}
                    <div className="relative overflow-hidden" style={{ minHeight: "260px" }}>
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={activePage}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]"
                            >
                                {currentItems.map((item, idx) => (
                                    <div key={idx} className="testimonial-block-one h-full">
                                        {/* inner-box — uniform height */}
                                        <div
                                            className="relative block bg-white h-full"
                                            style={{ padding: "45px 30px 45px 30px" }}
                                        >
                                            <div className="flex flex-col sm:flex-row gap-[25px] h-full">
                                                {/* author-thumb */}
                                                <div className="shrink-0">
                                                    <figure
                                                        className="relative block overflow-hidden mx-auto sm:mx-0"
                                                        style={{
                                                            width: "120px",
                                                            height: "150px",
                                                            borderRadius: "100px"
                                                        }}
                                                    >
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            width={120}
                                                            height={150}
                                                            className="w-full h-full object-cover"
                                                            style={{ borderRadius: "100px" }}
                                                        />
                                                    </figure>
                                                </div>

                                                {/* inner content */}
                                                <div className="relative block text-center sm:text-left flex-1">
                                                    {/* rating */}
                                                    <div className="relative flex justify-center sm:justify-start gap-[10px] mb-[17px]">
                                                        {[...Array(item.rating)].map((_, i) => (
                                                            <StarIcon key={i} />
                                                        ))}
                                                    </div>

                                                    {/* text */}
                                                    <p
                                                        className="mb-[20px]"
                                                        style={{
                                                            color: "#222222",
                                                            fontSize: "15px",
                                                            lineHeight: "26px",
                                                            fontFamily: "'Open Sans', sans-serif"
                                                        }}
                                                    >
                                                        {item.content}
                                                    </p>

                                                    {/* name */}
                                                    <h5
                                                        className="block mb-[1px]"
                                                        style={{
                                                            fontSize: "18px",
                                                            lineHeight: "28px",
                                                            fontWeight: 600,
                                                            color: "#172746",
                                                            fontFamily: "'Spartan', sans-serif"
                                                        }}
                                                    >
                                                        {item.name}
                                                    </h5>

                                                    {/* designation */}
                                                    <span
                                                        className="relative block"
                                                        style={{
                                                            fontSize: "15px",
                                                            color: "#808080",
                                                            fontFamily: "'Open Sans', sans-serif"
                                                        }}
                                                    >
                                                        {item.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
