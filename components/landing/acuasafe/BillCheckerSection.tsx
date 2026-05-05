"use client";

import { BillChecker } from "@/components/landing/BillChecker";
import { motion } from "framer-motion";

export function BillCheckerSection() {
    return (
        <section id="cek-tagihan" className="relative z-20 px-4 pb-20">
            <div className="container max-w-[1200px] mx-auto">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[30px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.1)] p-8 lg:p-12 -mt-[150px] relative z-20"
                >
                    <div className="grid lg:grid-cols-1 gap-8 text-center place-items-center">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900">Cek Tagihan Pembayaran</h3>
                            <p className="text-slate-500">Masukkan ID Pelanggan Anda untuk melihat rincian tagihan bulan ini.</p>
                        </div>

                        <div className="max-w-xl w-full flex justify-center">
                            <BillChecker />
                        </div>
                    </div>

                </motion.div>
            </div>
        </section>
    );
}
