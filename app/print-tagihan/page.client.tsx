"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Droplets, Loader2, MessageCircle, FileImage, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PrintBillData } from './actions';
import { cn } from '@/lib/utils';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PrintBillsClient({ data, initialFormat }: { data: PrintBillData, initialFormat: string }) {
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const [formatOption, setFormatOption] = useState<'thermal' | 'hemat' | 'full'>(initialFormat as any || 'thermal');
    const [mounted, setMounted] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleShareWA = async (type: 'jpg' | 'pdf') => {
        if (!printRef.current) return;
        setIsSharing(true);

        try {
            // Wait for fonts/images to load properly
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 1. Generate image first
            const dataUrl = await htmlToImage.toJpeg(printRef.current, {
                quality: 1,
                backgroundColor: '#ffffff',
                pixelRatio: type === 'pdf' ? 2 : 3, // Lower ratio for PDF to save size
                style: { margin: '0', boxShadow: 'none', border: 'none', transform: 'none' }
            });

            // Summary text for WA
            const text = `Halo Bapak/Ibu *${data.customerName}*, ini adalah Rincian Tagihan Air PAMSIMAS Tirtowening Anda.

*Total Tunggakan:* ${formatRupiah(data.totalAmount)}
*Jumlah:* ${data.details.length} bulan belum lunas

Mohon untuk segera melakukan pelunasan agar layanan tetap berjalan lancar. Terima kasih. 🙏`;

            let fileToShare: File;
            const filenameBase = `Tagihan_${data.customerNumber}`;

            if (type === 'pdf') {
                const pdf = new jsPDF({
                    orientation: formatOption === 'hemat' ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [printRef.current.offsetWidth, printRef.current.offsetHeight]
                });
                pdf.addImage(dataUrl, 'JPEG', 0, 0, printRef.current.offsetWidth, printRef.current.offsetHeight);
                const pdfBlob = pdf.output('blob');
                fileToShare = new File([pdfBlob], `${filenameBase}.pdf`, { type: 'application/pdf' });
            } else {
                const imgBlob = await (await fetch(dataUrl)).blob();
                fileToShare = new File([imgBlob], `${filenameBase}.jpg`, { type: 'image/jpeg' });
            }

            // Check if Web Share API is available and can share files
            if (navigator?.share && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
                try {
                    await navigator.share({ 
                        files: [fileToShare], 
                        title: 'Rincian Tagihan Pamsimas',
                        text: text.replace(/ {2,}/g, '')
                    });
                    setIsSharing(false);
                    return; // Success
                } catch (e) {
                    console.log("Share API error or cancelled, using fallback", e);
                }
            }

            // FALLBACK (for Desktop or if sharing fails)
            const link = document.createElement('a');
            link.download = fileToShare.name;
            if (type === 'pdf') {
                link.href = URL.createObjectURL(fileToShare);
            } else {
                link.href = dataUrl;
            }
            link.click();

            setTimeout(() => {
                const encodedText = encodeURIComponent(text.replace(/ {2,}/g, ''));
                window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                setIsSharing(false);
            }, 500);

        } catch (error) {
            console.error("Error generating share file:", error);
            setIsSharing(false);
            alert("Gagal memproses file. Silakan coba lagi.");
        }
    };

    const formatRupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const formatBulan = (month: number, year: number) => {
        return format(new Date(year, month - 1), 'MMM yyyy', { locale: localeId });
    };

    // Pamsimas Info (Hardcoded for now, can be fetched from settings later)
    const pamsimasInfo = {
        name: "PAMSIMAS TIRTOWENING",
        address: "Desa Kemasan, Kec. Sawit",
        contact: "085867714590"
    };

    // --- RECEIPT COMPONENT ---
    const ReceiptContent = () => (
        <div className="flex flex-col h-full bg-white text-black">
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-black pb-2 border-dashed">
                <div className="flex justify-center mb-1">
                    <Droplets className="w-6 h-6" />
                </div>
                <h2 className="font-black text-lg uppercase tracking-tight leading-none mb-1">{pamsimasInfo.name}</h2>
                <p className="text-xs">{pamsimasInfo.address}</p>
                <p className="text-xs">{pamsimasInfo.contact}</p>
            </div>

            {/* Info */}
            <div className="text-xs mb-4 grid grid-cols-[80px_10px_1fr] gap-y-1">
                <div className="text-gray-600">Tanggal</div><div>:</div><div>{mounted ? format(new Date(data.printDate), 'dd MMM yyyy HH:mm', { locale: localeId }) : '...'}</div>
                <div className="text-gray-600">Pelanggan</div><div>:</div><div className="font-bold">{data.customerName}</div>
                <div className="text-gray-600">No. Samb.</div><div>:</div><div className="font-mono">{data.customerNumber}</div>
            </div>

            <div className="border-t border-black border-dashed my-2"></div>

            {/* Details */}
            <div className="text-xs mb-4">
                <div className="font-bold mb-2 uppercase text-[10px]">Rincian Tagihan Air:</div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-black text-[10px]">
                            <th className="text-left pb-1 font-normal">Bulan</th>
                            <th className="text-right pb-1 font-normal">Mtr</th>
                            <th className="text-right pb-1 font-normal">Pemakaian</th>
                            <th className="text-right pb-1 font-normal">Tunggakan</th>
                        </tr>
                    </thead>
                    <tbody className="align-top">
                        {data.details.map((d, idx) => (
                            <tr key={idx} className="border-b border-gray-200 border-dashed">
                                <td className="py-1">
                                    <div className="font-bold">{mounted ? formatBulan(d.month, d.year) : '...'}</div>
                                </td>
                                <td className="py-1 text-right text-[10px] font-mono">
                                    {(d.meterLast === 0 && d.meterCurrent === 0) ? "-" : `${d.meterLast}-${d.meterCurrent}`}
                                </td>
                                <td className="py-1 text-center text-[10px] font-mono">
                                    {d.usage} m³
                                </td>
                                <td className="py-1 text-right font-bold font-mono">
                                    {formatRupiah(d.remaining).replace('Rp', '')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="text-xs space-y-1 ml-auto w-48 border-t border-black border-dashed pt-2">
                <div className="flex justify-between">
                    <span>Total Tagihan:</span>
                    <span className="font-black text-sm">{formatRupiah(data.totalAmount)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-[10px] text-gray-500">
                <p>Silakan lakukan pembayaran segera untuk menghindari pemutusan sambungan.</p>
            </div>
        </div>
    );

    // Dynamic classes based on format
    const getFormatWrapperClass = () => {
        switch (formatOption) {
            case 'thermal':
                return "w-[80mm] min-h-[100mm] mx-auto bg-white p-4 print:p-0 print:w-full border shadow-sm";
            case 'hemat':
                return "w-[210mm] h-[55mm] mx-auto bg-white p-4 border shadow-sm overflow-hidden flex print:border-none print:shadow-none print:p-0 relative";
            case 'full':
                return "w-[210mm] min-h-[297mm] mx-auto bg-white p-12 border shadow-sm print:border-none print:shadow-none print:p-8";
            default:
                return "w-[80mm] mx-auto bg-white p-4 border shadow-sm";
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans pb-20">
            {/* CONTROL PANEL (Hidden in Print) */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-50 print:hidden p-4 mb-8">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => {
                                if (window.history.length > 1 && document.referrer !== '') {
                                    router.back();
                                } else {
                                    window.close();
                                }
                            }}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                            title="Tutup / Kembali"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-bold text-slate-800">Cetak Struk Tagihan</h1>
                            <p className="text-xs text-slate-500">Pelanggan: {data.customerName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        <div className="bg-slate-100 p-1 rounded-lg flex gap-1 shrink-0">
                            <button
                                onClick={() => setFormatOption('thermal')}
                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", formatOption === 'thermal' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:bg-slate-200")}
                            >
                                Thermal
                            </button>
                            <button
                                onClick={() => setFormatOption('hemat')}
                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", formatOption === 'hemat' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:bg-slate-200")}
                            >
                                Hemat Kertas
                            </button>
                            <button
                                onClick={() => setFormatOption('full')}
                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", formatOption === 'full' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:bg-slate-200")}
                            >
                                Full A4
                            </button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    disabled={isSharing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shrink-0 transition-colors disabled:opacity-50"
                                >
                                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                    Share WA
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 font-bold">
                                <DropdownMenuItem onClick={() => handleShareWA('jpg')} className="cursor-pointer text-slate-700 focus:bg-emerald-50 focus:text-emerald-700">
                                    <FileImage className="mr-2 h-4 w-4" />
                                    <span>Bagikan Gambar (JPG)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShareWA('pdf')} className="cursor-pointer text-slate-700 focus:bg-emerald-50 focus:text-emerald-700">
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Bagikan PDF</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            onClick={handlePrint}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shrink-0 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Print Sekarang
                        </button>
                    </div>
                </div>
            </div>

            {/* PRINT AREA */}
            <div className="print:m-0 print:bg-white print:w-full print:h-full">
                {formatOption === 'hemat' ? (
                    // HEMAT KERTAS: TIKET HORIZONTAL KECIL (1/5 Kertas A4)
                    <div ref={printRef} className={cn(getFormatWrapperClass(), "print:border-none print:shadow-none")}>
                        {/* Kiri: Info Perusahaan */}
                        <div className="w-[30%] border-r-2 border-black border-dashed pr-4 flex flex-col justify-center text-center">
                            <div className="flex justify-center mb-1">
                                <Droplets className="w-8 h-8 text-black" />
                            </div>
                            <h2 className="font-black text-sm uppercase tracking-tight leading-none mb-1">{pamsimasInfo.name}</h2>
                            <p className="text-[9px]">{pamsimasInfo.address}</p>
                            <p className="text-[9px]">{pamsimasInfo.contact}</p>
                            <div className="mt-2 text-[10px] font-bold py-1 border-t border-b border-black">RINCIAN TAGIHAN</div>
                        </div>

                        {/* Tengah: Detail Pelanggan & Tagihan */}
                        <div className="w-[45%] px-4 flex flex-col">
                            <div className="text-[10px] grid grid-cols-[60px_5px_1fr] gap-y-0.5 mb-2">
                                <div className="text-gray-600">Pelanggan</div><div>:</div><div className="font-bold truncate">{data.customerName}</div>
                                <div className="text-gray-600">No. Samb.</div><div>:</div><div className="font-mono">{data.customerNumber}</div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <table className="w-full text-[9px] border-t border-black pt-1 mt-1">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left font-normal pb-0.5">Bulan</th>
                                            <th className="text-center font-normal pb-0.5">Pemakaian</th>
                                            <th className="text-right font-bold pb-0.5">Tunggakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.details.map((d, idx) => (
                                            <tr key={idx}>
                                                <td>{mounted ? formatBulan(d.month, d.year) : '...'}</td>
                                                <td className="text-center">{d.usage} m³</td>
                                                <td className="text-right font-mono font-bold">
                                                    {formatRupiah(d.remaining).replace('Rp', '')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Kanan: Total */}
                        <div className="w-[25%] pl-4 border-l border-gray-200 flex flex-col justify-between">
                            <div className="text-[10px]">
                                <div className="flex justify-between mb-1">
                                    <span>Total Tagihan:</span>
                                </div>
                                <div className="font-black text-lg text-right">{formatRupiah(data.totalAmount)}</div>
                            </div>
                            <div className="text-center mt-2 text-[8px] text-gray-500">
                                <p>Segera lakukan pembayaran.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // THERMAL & FULL A4: STRUK VERTIKAL NORMAL
                    <div ref={printRef} className={cn(getFormatWrapperClass(), "print:border-none print:shadow-none")}>
                        <ReceiptContent />
                    </div>
                )}
            </div>

            {/* Global Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
