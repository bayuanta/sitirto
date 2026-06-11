'use client';

import { useEffect } from 'react';
import { Printer, ArrowLeft, Droplets, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { DunningLetterData } from './actions';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function PrintSuratTagihanClient({ data }: { data: DunningLetterData[] }) {
    useEffect(() => {
        // Auto print after data is likely rendered
        const timer = setTimeout(() => {
            window.print();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const pamsimasInfo = {
        name: "PAMSIMAS TIRTOWENING",
        address: "Desa Kemasan, Kec. Sawit",
        contact: "085867714590"
    };

    const LetterItem = ({ item }: { item: DunningLetterData }) => (
        <div className="w-full h-[59.4mm] px-10 py-6 bg-white relative flex flex-row gap-8 border-b-2 border-dashed border-slate-300 box-border print:break-inside-avoid items-center">
            {/* Left Column (Content) */}
            <div className="flex-1 flex flex-col h-full justify-center">
                {/* Header Section */}
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center justify-center">
                            <Image src="/logo-pamsimas.png" alt="Logo Pamsimas" width={60} height={20} className="object-contain brightness-0" priority />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter block leading-none">{pamsimasInfo.name}</span>
                            <span className="text-[7px] text-slate-400 font-medium">{pamsimasInfo.address} • {pamsimasInfo.contact}</span>
                        </div>
                    </div>
                    <h2 className="text-[16px] font-black text-slate-900 leading-tight uppercase tracking-tight">
                        Surat Tagihan Air
                    </h2>
                </div>

                {/* Recipient Box */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 mb-3 space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-400 font-bold uppercase w-20">Pelanggan</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase">{item.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-400 font-bold uppercase w-20">No. Sambung</span>
                        <span className="text-[11px] font-bold text-slate-700 font-mono">{item.connectionNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-400 font-bold uppercase w-20">Wilayah</span>
                        <span className="text-[10px] text-slate-600 font-medium italic">{item.areaName}</span>
                    </div>
                </div>

                {/* Message */}
                <p className="text-[10px] leading-relaxed text-slate-500 italic pr-4">
                    Berdasarkan catatan kami, terdapat tunggakan pembayaran rekening air sebanyak <span className="font-bold text-slate-800">{item.monthsCount} bulan</span>. Mohon segera melunasi kewajiban Anda. Abaikan surat ini jika sudah membayar.
                </p>
            </div>

            {/* Right Column (Highlight Box - White B&W) */}
            <div className="w-[75mm] h-[42mm] bg-white rounded-[24px] flex flex-col justify-center items-center text-slate-900 shadow-none border-[3px] border-slate-900 p-5 relative overflow-hidden">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-2 relative z-10 text-slate-500">Total Tunggakan</span>
                <span className="text-[32px] font-black tracking-tighter leading-none mb-3 relative z-10">
                    {formatCurrency(item.totalArrears)}
                </span>
                
                <div className="bg-slate-100 px-4 py-1 rounded-full border border-slate-200 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">
                        {item.monthsCount} Bulan Belum Lunas
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 font-sans print:bg-white flex flex-col items-center">
            {/* Print Settings to remove browser header/footer */}
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 0mm; }
                    html { background-color: #FFFFFF; margin: 0px; }
                    body { margin: 0px; }
                `}
            </style>

            {/* Screen Controls */}
            <div className="w-full bg-white shadow-sm border-b border-slate-200 print:hidden p-4 sticky top-0 z-50">
                <div className="max-w-[210mm] mx-auto flex items-center justify-between">
                    <button
                        onClick={() => window.close()}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Tutup
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 font-medium">
                            Siap Cetak: <span className="text-indigo-600 font-black">{data.length}</span> Surat Tagihan
                        </span>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black shadow-md shadow-indigo-100 transition-all active:scale-95"
                        >
                            <Printer className="w-5 h-5" /> Cetak Sekarang
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Container */}
            <div className="w-full max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none print:m-0">
                <div className="print:p-0 flex flex-col">
                    {data.map((item) => (
                        <LetterItem key={item.customerId} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
