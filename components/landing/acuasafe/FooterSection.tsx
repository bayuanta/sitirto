"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, ArrowRight, Facebook, Instagram } from "lucide-react";

export function FooterSection() {
    return (
        <footer id="kontak" className="bg-[#172746] relative overflow-hidden" style={{ marginTop: "-2px" }}>
            {/* Pattern Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute top-0 left-0 w-full h-32 opacity-30"
                    style={{
                        backgroundImage: "url(/acuasafe/images/shape/shape-12.png)",
                        backgroundSize: "cover"
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-[200px] h-[200px] opacity-20"
                    style={{
                        backgroundImage: "url(/acuasafe/images/shape/shape-13.png)",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat"
                    }}
                />
            </div>

            {/* Top CTA Bar */}
            <div className="relative z-10 border-b border-white/10">
                <div className="max-w-[1200px] mx-auto px-4 py-8">
                    <div
                        className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#1e3054] rounded-2xl p-6"
                        style={{
                            backgroundImage: "url(/acuasafe/images/shape/shape-11.png)",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            backgroundSize: "cover"
                        }}
                    >
                        <h3 className="text-2xl font-bold text-white">
                            Hubungi <span className="text-[#00d1f9]">Kami</span> untuk Layanan Terbaik
                        </h3>
                        <a
                            href="tel:+62123456789"
                            className="flex items-center gap-3 text-white bg-[#00d1f9] px-6 py-3 rounded-full font-bold hover:bg-white hover:text-[#002c8f] transition-all"
                        >
                            <Phone className="w-5 h-5" />
                            (0123) 456-789
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="relative z-10">
                <div className="max-w-[1200px] mx-auto px-4 py-16">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">

                        {/* Column 1: Logo & Info */}
                        <div>
                            <Link href="/" className="flex items-center gap-3 mb-6">
                                <div className="relative w-12 h-12">
                                    <Image
                                        src="/acuasafe/images/footer-logo.png"
                                        alt="PAMSIMAS Footer Logo"
                                        fill
                                        className="object-contain brightness-0 invert"
                                    />
                                </div>
                                <span className="font-bold text-xl text-white">PAMSIMAS</span>
                            </Link>

                            <p className="text-white/70 text-sm mb-6 leading-relaxed">
                                Unit usaha pengelolaan air bersih BUMDes Karya Lestari Manunggal untuk masyarakat Desa Tirtowening.
                            </p>

                            <div className="text-white/70 text-sm space-y-1">
                                <p className="font-semibold text-white">Jam Operasional:</p>
                                <p>Senin - Sabtu: 08.00 - 16.00</p>
                                <p>Minggu: Libur</p>
                            </div>
                        </div>

                        {/* Column 2: Address */}
                        <div>
                            <h4 className="text-lg font-bold text-white mb-6">Alamat</h4>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-white/70 text-sm">
                                    <MapPin className="w-5 h-5 text-[#00d1f9] shrink-0 mt-0.5" />
                                    <span>Desa Tirtowening, Kecamatan [Kecamatan], Kabupaten [Kabupaten]</span>
                                </li>
                                <li className="flex gap-3 text-white/70 text-sm">
                                    <Phone className="w-5 h-5 text-[#00d1f9] shrink-0" />
                                    <a href="tel:+62123456789" className="hover:text-[#00d1f9] transition-colors">
                                        (0123) 456-789
                                    </a>
                                </li>
                                <li className="flex gap-3 text-white/70 text-sm">
                                    <Mail className="w-5 h-5 text-[#00d1f9] shrink-0" />
                                    <a href="mailto:pamsimas@tirtowening.desa.id" className="hover:text-[#00d1f9] transition-colors">
                                        pamsimas@tirtowening.desa.id
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Quick Links */}
                        <div>
                            <h4 className="text-lg font-bold text-white mb-6">Link Cepat</h4>
                            <ul className="space-y-3">
                                {[
                                    { name: "Tentang Kami", href: "#tentang" },
                                    { name: "Layanan", href: "#layanan" },
                                    { name: "Tarif", href: "#tarif" },
                                    { name: "Cek Tagihan", href: "#cek-tagihan" },
                                    { name: "Kontak", href: "#kontak" }
                                ].map((link, idx) => (
                                    <li key={idx}>
                                        <a
                                            href={link.href}
                                            className="flex items-center gap-2 text-white/70 text-sm hover:text-[#00d1f9] transition-colors"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 4: BUMDes Info */}
                        <div>
                            <h4 className="text-lg font-bold text-white mb-6">BUMDes</h4>
                            <p className="text-white/70 text-sm mb-4 leading-relaxed">
                                PAMSIMAS adalah salah satu unit usaha dari BUMDes Karya Lestari Manunggal yang bergerak dalam pengelolaan air bersih.
                            </p>

                            <div className="flex gap-3 mt-6">
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#00d1f9] transition-all"
                                >
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#00d1f9] transition-all"
                                >
                                    <Instagram className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10 relative z-10">
                <div className="max-w-[1200px] mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                        <p className="text-white/60 text-sm">
                            © 2024 PAMSIMAS Tirtowening. BUMDes Karya Lestari Manunggal.
                        </p>
                        <div className="flex gap-6 text-white/60 text-sm">
                            <Link href="#" className="hover:text-[#00d1f9] transition-colors">Kebijakan Privasi</Link>
                            <Link href="#" className="hover:text-[#00d1f9] transition-colors">Syarat & Ketentuan</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
