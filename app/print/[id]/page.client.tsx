"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Droplets, MessageCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import * as htmlToImage from 'html-to-image';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PrintData } from './actions';
import { cn } from '@/lib/utils';

export default function PrintClient({ data, initialFormat }: { data: PrintData, initialFormat: string }) {
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const [formatOption, setFormatOption] = useState<'thermal58' | 'thermal' | 'hemat' | 'full'>(initialFormat as any || 'thermal58');
    const [isSharing, setIsSharing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePrint = () => {
        window.print();
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

    const handleShareWA = async () => {
        if (!printRef.current) return;
        setIsSharing(true);

        try {
            // Generate image from the receipt element
            const dataUrl = await htmlToImage.toPng(printRef.current, {
                quality: 1,
                backgroundColor: '#ffffff',
                pixelRatio: 3, // Higher quality for text
                style: {
                    margin: '0',
                    boxShadow: 'none',
                    border: 'none',
                    transform: 'none'
                }
            });

            // Summary text for WA
            const text = `Halo Bapak/Ibu *${data.customerName}*, ini adalah bukti pembayaran PAMSIMAS Tirtowening untuk transaksi *#${data.transactionId}*.

*Total Bayar:* ${formatRupiah(data.totalPaid)}
*Sisa Deposit:* ${formatRupiah(data.newCredit)}

Terima kasih atas pembayaran Anda. 🙏`;

            // Check if Web Share API is available (especially for Mobile)
            if (navigator?.share && typeof navigator.canShare === 'function') {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], `Struk_Pamsimas_${data.transactionId}.jpg`, { type: 'image/jpeg' });
                
                try {
                    await navigator.share({ 
                        files: [file], 
                        title: 'Bukti Pembayaran Pamsimas',
                        text: text.replace(/ {2,}/g, '')
                    });
                    setIsSharing(false);
                    return; // Success
                } catch (e) {
                    // User cancelled or failed, proceed to fallback
                    console.log("Share cancelled or failed, using fallback");
                }
            }

            // FALLBACK (for Desktop or if sharing fails): Download + Open WA link
            const link = document.createElement('a');
            link.download = `Struk_Pamsimas_${data.customerNumber}_${data.transactionId}.jpg`;
            link.href = dataUrl;
            link.click();

            setTimeout(() => {
                const encodedText = encodeURIComponent(text.replace(/ {2,}/g, ''));
                window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                setIsSharing(false);
            }, 500);

        } catch (error) {
            console.error("Error generating image:", error);
            setIsSharing(false);
        }
    };

    // --- RECEIPT COMPONENT ---
    const ReceiptContent = () => (
        <div className="flex flex-col h-full bg-white text-black">
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-black pb-2 border-dashed">
                <div className="flex justify-center mb-2">
                    {(formatOption !== 'thermal' && formatOption !== 'thermal58') && (
                        <Image src="/logo-pamsimas.png" alt="Logo Pamsimas" width={140} height={50} className="object-contain brightness-0" priority />
                    )}
                </div>
                <h2 className="font-black text-lg uppercase tracking-tight leading-none mb-1">{pamsimasInfo.name}</h2>
                <p className="text-xs">{pamsimasInfo.address}</p>
                <p className="text-xs">{pamsimasInfo.contact}</p>
            </div>

            {/* Info */}
            <div className="text-xs mb-4 grid grid-cols-[80px_10px_1fr] gap-y-1">
                <div className="text-gray-600">No. TRX</div><div>:</div><div className="font-mono">#{data.transactionId}</div>
                <div className="text-gray-600">Tanggal</div><div>:</div><div>{mounted ? format(new Date(data.paymentDate), 'dd MMM yyyy HH:mm', { locale: localeId }) : '...'}</div>
                <div className="text-gray-600">Pelanggan</div><div>:</div><div className="font-bold">{data.customerName}</div>
                <div className="text-gray-600">No. Samb.</div><div>:</div><div className="font-mono">{data.customerNumber}</div>
            </div>

            <div className="border-t border-black border-dashed my-2"></div>

            {/* Details */}
            <div className="text-xs mb-4">
                <div className="font-bold mb-2 uppercase text-[10px]">Detail Pembayaran:</div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-black text-[10px]">
                            <th className="text-left pb-1 font-normal">Bulan</th>
                            <th className="text-right pb-1 font-normal">Mtr</th>
                            <th className="text-right pb-1 font-normal">Total</th>
                            <th className="text-right pb-1 font-normal">Dibayar</th>
                        </tr>
                    </thead>
                    <tbody className="align-top">
                        {data.details.map((d, idx) => (
                            <tr key={idx} className="border-b border-gray-200 border-dashed">
                                <td className="py-1">
                                    <div className="font-bold">{mounted ? formatBulan(d.month, d.year) : '...'}</div>
                                    {d.usage > 0 && <div className="text-[9px] text-gray-500">{d.usage} m³</div>}
                                </td>
                                <td className="py-1 text-right text-[10px] font-mono">
                                    {(d.meterLast === 0 && d.meterCurrent === 0) ? "-" : `${d.meterLast}-${d.meterCurrent}`}
                                </td>
                                <td className="py-1 text-right text-[10px] font-mono">
                                    {formatRupiah(d.billAmount).replace('Rp', '')}
                                </td>
                                <td className="py-1 text-right font-bold font-mono">
                                    <div>{formatRupiah(d.amount).replace('Rp', '')}</div>
                                    {d.remaining > 0 && (
                                        <div className="text-[8px] text-rose-600 font-bold leading-none mt-0.5">
                                            KEKURANGAN: {formatRupiah(d.remaining).replace('Rp', '')}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="text-xs space-y-1 ml-auto w-48 border-t border-black border-dashed pt-2">
                <div className="flex justify-between">
                    <span>Total Bayar:</span>
                    <span className="font-black text-sm">{formatRupiah(data.totalPaid)}</span>
                </div>
                {data.appliedCredit > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>Potong Deposit:</span>
                        <span>{formatRupiah(data.appliedCredit)}</span>
                    </div>
                )}
                <div className="flex justify-between text-gray-600">
                    <span>Metode:</span>
                    <span className="uppercase">{data.method}</span>
                </div>
                {data.newCredit > 0 && (
                    <div className="flex justify-between text-gray-600 border-t border-gray-200 mt-1 pt-1">
                        <span>Sisa Deposit:</span>
                        <span className="font-bold">{formatRupiah(data.newCredit)}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-[10px] text-gray-500">
                <p>Terima kasih atas pembayaran Anda.</p>
                <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
            </div>
        </div>
    );

    // Dynamic classes based on format
    const getFormatWrapperClass = () => {
        switch (formatOption) {
            case 'thermal58':
                return "w-[58mm] min-h-[80mm] mx-auto bg-white p-2 print:p-0 print:w-full border shadow-sm text-[10px]";
            case 'thermal':
                return "w-[80mm] min-h-[100mm] mx-auto bg-white p-4 print:p-0 print:w-full border shadow-sm";
            case 'hemat':
                return "w-[210mm] min-h-[55mm] h-auto mx-auto bg-white p-4 border shadow-sm flex print:border-b-dashed print:border-b-2 print:border-b-gray-400 print:border-x-0 print:border-t-0 print:shadow-none print:p-0 print:pr-4 relative";
            case 'full':
                return "w-[210mm] min-h-[297mm] mx-auto bg-white p-12 border shadow-sm print:border-none print:shadow-none print:p-8";
            default:
                return "w-[58mm] mx-auto bg-white p-2 border shadow-sm text-[10px]";
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
        <div className="min-h-screen bg-slate-100 print:bg-white font-sans pb-20 print:pb-0">
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
                            <h1 className="font-bold text-slate-800">Cetak Struk</h1>
                            <p className="text-xs text-slate-500">Trx #{data.transactionId}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        <div className="bg-slate-100 p-1 rounded-lg flex gap-1 shrink-0">
                            <button
                                onClick={() => setFormatOption('thermal58')}
                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", formatOption === 'thermal58' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:bg-slate-200")}
                            >
                                Thermal 58mm
                            </button>
                            <button
                                onClick={() => setFormatOption('thermal')}
                                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", formatOption === 'thermal' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:bg-slate-200")}
                            >
                                Thermal 80mm
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

                        <button
                            onClick={handleShareWA}
                            disabled={isSharing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shrink-0 transition-colors disabled:opacity-50"
                        >
                            {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                            Share WA
                        </button>

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
                    <div ref={printRef} className={cn(getFormatWrapperClass())}>
                        {/* Kiri: Info Perusahaan */}
                        <div className="w-[30%] border-r-2 border-black border-dashed pr-4 flex flex-col justify-center text-center">
                            <div className="flex justify-center mb-2">
                                <Image src="/logo-pamsimas.png" alt="Logo Pamsimas" width={100} height={35} className="object-contain brightness-0" priority />
                            </div>
                            <h2 className="font-black text-sm uppercase tracking-tight leading-none mb-1">{pamsimasInfo.name}</h2>
                            <p className="text-[9px]">{pamsimasInfo.address}</p>
                            <p className="text-[9px]">{pamsimasInfo.contact}</p>
                            <div className="mt-2 text-[10px] font-bold py-1 border-t border-b border-black">BUKTI PEMBAYARAN</div>
                        </div>

                        {/* Tengah: Detail Pelanggan & Tagihan */}
                        <div className="w-[45%] px-4 flex flex-col">
                            <div className="text-[10px] grid grid-cols-[60px_5px_1fr] gap-y-0.5 mb-2">
                                <div className="text-gray-600">Trx / Tgl</div><div>:</div><div className="font-mono">#{data.transactionId} / {mounted ? format(new Date(data.paymentDate), 'dd/MM/yy', { locale: localeId }) : '...'}</div>
                                <div className="text-gray-600">Pelanggan</div><div>:</div><div className="font-bold truncate">{data.customerName}</div>
                                <div className="text-gray-600">No. Samb.</div><div>:</div><div className="font-mono">{data.customerNumber}</div>
                            </div>
                            <div className="flex-1">
                                <table className="w-full text-[9px] border-t border-black pt-1 mt-1">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left font-normal pb-0.5">Bulan</th>
                                            <th className="text-right font-normal pb-0.5">Tagihan</th>
                                            <th className="text-right font-bold pb-0.5">Dibayar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.details.map((d, idx) => (
                                            <tr key={idx}>
                                                <td>{mounted ? formatBulan(d.month, d.year) : '...'} <span className="text-gray-400">({d.usage}m³)</span></td>
                                                <td className="text-right font-mono">{formatRupiah(d.billAmount).replace('Rp', '')}</td>
                                                <td className="text-right font-mono font-bold">
                                                    <div>{formatRupiah(d.amount).replace('Rp', '')}</div>
                                                    {d.remaining > 0 && (
                                                        <div className="text-[7px] text-rose-600 font-bold leading-none">
                                                            KEKURANGAN: {formatRupiah(d.remaining).replace('Rp', '')}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Kanan: Total & TTD */}
                        <div className="w-[25%] pl-4 border-l border-gray-200 flex flex-col justify-between">
                            <div className="text-[10px]">
                                <div className="flex justify-between mb-1">
                                    <span>Total:</span>
                                    <span className="font-black text-sm">{formatRupiah(data.totalPaid)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Metode:</span>
                                    <span className="uppercase">{data.method}</span>
                                </div>
                                {data.newCredit > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>Sisa Saldo:</span>
                                        <span>{formatRupiah(data.newCredit)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-center mt-2">
                                <div className="h-8 border-b border-black w-full mb-1"></div>
                                <span className="text-[8px] text-gray-500">Petugas / Kasir</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    // THERMAL & FULL A4: STRUK VERTIKAL NORMAL
                    <div ref={printRef} className={cn(getFormatWrapperClass())}>
                        <ReceiptContent />
                    </div>
                )}
            </div>

            {/* Global Print Styles explicitly for this page to override anything else */}
            <style jsx global>{`
                @media print {
                    @page {
                        /* Provide reasonable default, browser usually manages orientation well */
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
