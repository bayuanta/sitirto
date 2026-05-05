'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Printer, ArrowLeft, Droplets } from 'lucide-react';
import { PrintSRData } from './actions';

function terbilang(angka: number): string {
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let hasil = "";
    if (angka < 12) {
        hasil = " " + huruf[angka];
    } else if (angka < 20) {
        hasil = terbilang(angka - 10) + " Belas";
    } else if (angka < 100) {
        hasil = terbilang(Math.floor(angka / 10)) + " Puluh" + terbilang(angka % 10);
    } else if (angka < 200) {
        hasil = " Seratus" + terbilang(angka - 100);
    } else if (angka < 1000) {
        hasil = terbilang(Math.floor(angka / 100)) + " Ratus" + terbilang(angka % 100);
    } else if (angka < 2000) {
        hasil = " Seribu" + terbilang(angka - 1000);
    } else if (angka < 1000000) {
        hasil = terbilang(Math.floor(angka / 1000)) + " Ribu" + terbilang(angka % 1000);
    } else if (angka < 1000000000) {
        hasil = terbilang(Math.floor(angka / 1000000)) + " Juta" + terbilang(angka % 1000000);
    }
    return hasil.trim();
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function PrintSRClient({ data }: { data: PrintSRData }) {
    useEffect(() => {
        // Auto print after a short delay
        const timer = setTimeout(() => {
            window.print();
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const pamsimasInfo = {
        name: "PAMSIMAS TIRTOWENING",
        address: "Desa Kemasan, Kec. Sawit",
        contact: "085867714590"
    };

    const terbilangAmount = terbilang(data.amount) + " Rupiah";
    const receiptDate = format(new Date(data.paymentDate), 'dd MMMM yyyy', { locale: localeId });

    const KwitansiItem = () => (
        <div className="w-full h-[74mm] px-8 pt-8 pb-4 bg-white relative flex flex-col border-b border-dashed border-slate-500 box-border print:break-inside-avoid">
            {/* Print Settings to remove browser header/footer & hardware margins */}
            <style type="text/css" media="print">
                {`
                    @page { size: auto; margin: 0mm; }
                    html { background-color: #FFFFFF; margin: 0px; }
                    body { margin: 0px; }
                `}
            </style>

            {/* Background Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none mt-4">
                <Droplets className="w-48 h-48 text-indigo-900" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2 mb-2 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 border-2 border-slate-800 rounded-full flex items-center justify-center">
                        <Droplets className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-900 uppercase tracking-wide leading-tight">
                            {pamsimasInfo.name}
                        </h1>
                        <p className="text-[9px] text-slate-600 font-medium leading-tight">{pamsimasInfo.address} • Telp: {pamsimasInfo.contact}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest border-2 border-slate-800 px-3 py-0.5 bg-slate-50 inline-block">
                        KWITANSI
                    </h2>
                    <p className="text-[9px] font-bold text-slate-600 mt-1">No. Ref: SR-{data.paymentId}</p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 grid grid-cols-[140px_10px_1fr] gap-y-1.5 text-[11px] relative z-10 items-center">
                <div className="font-bold text-slate-700">Telah terima dari</div>
                <div className="font-bold text-slate-700">:</div>
                <div className="font-bold text-[12px] bg-slate-50 px-2 py-0.5 border-b border-dashed border-slate-400">
                    {data.customerName} ({data.customerNumber})
                </div>

                <div className="font-bold text-slate-700">Uang Sejumlah</div>
                <div className="font-bold text-slate-700">:</div>
                <div className="font-bold bg-slate-50 px-2 py-0.5 border-b border-dashed border-slate-400 font-mono text-[13px]">
                    {formatRupiah(data.amount)}
                </div>

                <div className="font-bold text-slate-700">Terbilang</div>
                <div className="font-bold text-slate-700">:</div>
                <div className="italic font-bold text-slate-700 bg-slate-100 px-2 py-0.5 border border-slate-300 rounded leading-tight line-clamp-1">
                    # {terbilangAmount} #
                </div>

                <div className="font-bold text-slate-700">Untuk Pembayaran</div>
                <div className="font-bold text-slate-700">:</div>
                <div className="font-medium bg-slate-50 px-2 py-0.5 border-b border-dashed border-slate-400">
                    Biaya Pasang Baru / Sambung SR PAMSIMAS Tirtowening
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-auto relative z-10">
                <div className="text-[9px] space-y-0.5">
                    <div className="flex gap-2">
                        <span className="w-20 text-slate-600">Total Biaya SR</span>
                        <span className="font-mono">: {formatRupiah(data.totalFee)}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="w-20 text-slate-600">Total Terbayar</span>
                        <span className="font-mono">: {formatRupiah(data.paidAmount)}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="w-20 text-slate-600 font-bold">Sisa Tunggakan</span>
                        <span className="font-mono font-bold text-rose-600">: {formatRupiah(data.remainingAmount)}</span>
                    </div>
                </div>

                <div className="text-center w-36 flex flex-col items-center">
                    <p className="text-[10px] mb-6">
                        Kemasan, {receiptDate}
                    </p>
                    <p className="text-[10px] font-bold border-t border-slate-800 pt-0.5 w-full text-center">
                        ( Bendahara / Petugas )
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 font-sans print:bg-white flex flex-col items-center">
            {/* Screen-only Controls */}
            <div className="w-full bg-white shadow-sm border-b border-slate-200 print:hidden p-4 sticky top-0 z-50">
                <div className="max-w-[210mm] mx-auto flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (window.history.length > 1 && document.referrer !== '') {
                                window.history.back();
                            } else {
                                window.close();
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Tutup
                    </button>
                    
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-sm transition-all"
                    >
                        <Printer className="w-4 h-4" /> Cetak Kwitansi
                    </button>
                </div>
            </div>

            {/* Print Container (A4 Portrait format but only 1 item) */}
            <div className="w-full max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none print:m-0">
                <div className="p-4 print:p-0">
                    <KwitansiItem />
                </div>
            </div>
        </div>
    );
}
