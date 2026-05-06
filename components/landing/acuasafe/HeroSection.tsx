"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function HeroSection() {
    return (
        <section id="hero" className="relative overflow-hidden bg-[#002c8f]">

            {/* Bottom Wave Shape - height 68px, z-index 2 */}
            {/* Bottom Wave Shape - height 68px, z-index 2 */}
            <div
                className="absolute bottom-0 left-0 w-full h-[68px] z-[20]"
                style={{
                    backgroundImage: "url(/acuasafe/images/shape/banner-shap.png)",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    filter: "brightness(0.95)"
                }}
            />

            {/* Pattern Box */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Pattern 1 */}
                <div className="absolute left-0 -top-[250px] w-[560px] h-[560px] rounded-full bg-white/5" />

                {/* Pattern 2 */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute right-[290px] top-[140px] w-[330px] h-[330px] rounded-full bg-white/5"
                />

                {/* Pattern 3 - Shape 2 */}
                <div
                    className="absolute left-0 bottom-0 w-full h-[363px]"
                    style={{
                        backgroundImage: "url(/acuasafe/images/shape/shape-2.png)",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "top center",
                        backgroundSize: "cover"
                    }}
                />
            </div>

            {/* Auto Container: max-width 1200px + padding 15px */}
            <div className="max-w-[1200px] mx-auto px-[15px] relative z-[1]">
                {/* Inner Box: Standard block, rely on content padding for height */}
                <div className="relative w-full">

                    {/* Image Box - Absolute positioning mirroring CSS */}
                    <div className="hidden lg:block absolute right-0 bottom-[25px] z-[1]" style={{ minHeight: '700px', minWidth: '1000px' }}>

                        {/* Image 2 (splash) - Behind */}
                        <motion.figure
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 1 }}
                            className="absolute bottom-0"
                            style={{ right: '-220px', zIndex: 1 }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Image
                                    src="/acuasafe/images/banner/vector-2.png"
                                    alt="Water Splash"
                                    width={1000}
                                    height={600}
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </motion.figure>

                        {/* Image 1 (Logo) - Front */}
                        <motion.figure
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 1 }}
                            className="absolute"
                            style={{ right: '-50px', bottom: '180px', zIndex: 2 }}
                        >
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Image
                                    src="/acuasafe/images/pamsimas-logo.png"
                                    alt="PAMSIMAS Logo"
                                    width={650}
                                    height={288}
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </motion.figure>
                    </div>

                    {/* Content Box - Padding 212px top, 240px bottom */}
                    <div className="relative z-[5] max-w-[500px] pt-[250px] pb-[100px] lg:pt-[300px] lg:pb-[240px] text-center lg:text-left mx-auto lg:mx-0">
                        <motion.h2
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 1 }}
                            className="text-white text-[36px] lg:text-[50px] leading-[1.2] lg:leading-[66px] font-[800] mb-4 lg:mb-[23px]"
                            style={{ fontFamily: "'Spartan', sans-serif" }}
                        >
                            Air Bersih untuk Kehidupan Sehat
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 1.2 }}
                            className="text-white text-[16px] lg:text-[18px] leading-[26px] lg:leading-[30px] mb-8 lg:mb-[42px]"
                        >
                            PAMSIMAS Tirtowening menyediakan layanan air bersih berkualitas untuk
                            masyarakat Desa Kemasan. Unit usaha BUMDes Karya Lestari Manunggal.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 1.4 }}
                            className="flex flex-wrap justify-center lg:justify-start gap-4"
                        >
                            <a
                                href="#cek-tagihan"
                                className="inline-flex items-center justify-center px-6 py-3 lg:px-[40px] lg:py-[15px] bg-[#00d1f9] text-white font-bold text-[14px] lg:text-[15px] uppercase tracking-wide rounded-[30px] transition-all duration-500 hover:bg-white hover:text-[#002c8f]"
                            >
                                Cek Tagihan
                            </a>

                            <a
                                href="#layanan"
                                className="inline-flex items-center justify-center px-6 py-3 lg:px-[39px] lg:py-[14px] border border-white/[0.15] bg-transparent text-white font-bold text-[14px] lg:text-[15px] uppercase tracking-wide rounded-[30px] transition-all duration-500 hover:bg-white hover:text-[#002c8f] hover:border-white"
                            >
                                Layanan Kami
                            </a>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Mobile Image */}
            <div className="lg:hidden relative z-[1] -mt-20 mb-10 px-4">
                <Image
                    src="/acuasafe/images/banner/vector-2.png"
                    alt="Water Splash"
                    width={500}
                    height={300}
                    className="object-contain mx-auto"
                />
            </div>
        </section>
    );
}
