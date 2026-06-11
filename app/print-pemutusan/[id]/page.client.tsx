'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Printer, ArrowLeft, Droplets, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { DisconnectionNoticeData } from './actions';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function PrintPemutusanClient({ data }: { data: DisconnectionNoticeData }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const today = format(new Date(), 'dd MMMM yyyy', { locale: localeId });
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    return (
        <div className="min-h-screen bg-slate-100 font-sans print:bg-white flex flex-col items-center">
            {/* Print Settings */}
            <style type="text/css" media="print">
                {`
                    @page { size: auto; margin: 0mm; }
                    html, body { 
                        margin: 0px !important; 
                        padding: 0px !important; 
                        background-color: #FFFFFF;
                        -webkit-print-color-adjust: exact;
                    }
                `}
            </style>

            {/* Screen Controls */}
            <div className="w-full bg-white shadow-sm border-b border-slate-200 print:hidden p-4 sticky top-0 z-50">
                <div className="max-w-[210mm] mx-auto flex items-center justify-between">
                    <button onClick={() => window.close()} className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">
                        <ArrowLeft className="w-4 h-4" /> Tutup
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold active:scale-95 transition-all shadow-md">
                        <Printer className="w-4 h-4" /> Cetak Surat Pemutusan
                    </button>
                </div>
            </div>

            {/* Letter Container */}
            <div className="w-full max-w-[210mm] mx-auto bg-white shadow-lg p-[15mm] print:shadow-none print:p-[15mm] flex flex-col print:max-w-none print:w-full print:min-h-0">
                {/* Kop Surat */}
                <div className="flex items-center gap-6 border-b-2 border-slate-900 pb-4 mb-8">
                    <div className="flex items-center justify-center">
                        <Image src="/logo-pamsimas.png" alt="Logo Pamsimas" width={160} height={60} className="object-contain brightness-0" priority />
                    </div>
                    <div className="flex-1 text-center">
                        <h1 className="text-xl font-black uppercase tracking-[0.2em] text-slate-900 leading-tight">PAMSIMAS TIRTOWENING</h1>
                        <p className="text-[10px] font-bold italic text-slate-500 uppercase tracking-wider">Desa Kemasan, Kec. Sawit, Boyolali</p>
                        <p className="text-[10px] font-black text-slate-800">WA: 085867714590</p>
                    </div>
                </div>

                {/* Letter Header */}
                <div className="flex justify-between mb-8 text-[11px] font-medium">
                    <div className="space-y-0.5">
                        <p>Nomor : {new Date().getFullYear()}/PUM/{data.customer.id.toString().padStart(3, '0')}</p>
                        <p>Lampiran : -</p>
                        <p>Perihal : <span className="font-black underline underline-offset-2 uppercase tracking-tight">Pemberitahuan Pemutusan Air</span></p>
                    </div>
                    <div className="text-right">
                        <p>Sawit, {today}</p>
                    </div>
                </div>

                {/* Recipient */}
                <div className="mb-8 text-[12px] leading-snug space-y-0.5">
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wide mb-1">Kepada Yth.</p>
                    <p className="font-black uppercase text-[15px] text-slate-900 tracking-tight">{data.customer.name}</p>
                    <p className="font-bold text-slate-700">No. Sambung: {data.customer.connectionNumber}</p>
                    <p className="text-slate-600 font-medium">Wilayah: {data.customer.areaName}</p>
                    <p className="text-slate-500 italic mt-1 text-[11px]">Di Tempat</p>
                </div>

                {/* Content Body */}
                <div className="mb-6 text-[11.5px] leading-relaxed text-justify font-medium text-slate-800">
                    <p className="mb-4">Dengan hormat,</p>
                    <p className="mb-4">
                        Berdasarkan catatan administrasi <span className="font-bold">PAMSIMAS Tirtowening</span>, Bapak/Ibu/Sdr/i saat ini memiliki tunggakan pembayaran rekening air yang telah melewati batas waktu yang ditentukan. Kami sampaikan rincian tunggakan sebagai berikut:
                    </p>
                </div>

                {/* Arrears Table */}
                <div className="mb-6">
                    <table className="w-full border-collapse border border-slate-900 text-[11px]">
                        <thead className="bg-slate-50 uppercase font-black tracking-tighter">
                            <tr>
                                <th className="border border-slate-900 p-2 text-center w-10">No</th>
                                <th className="border border-slate-900 p-2 text-left">Uraian Tagihan</th>
                                <th className="border border-slate-900 p-2 text-right">Jumlah (Rp)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.waterArrears.map((r, i) => (
                                <tr key={i} className="font-medium">
                                    <td className="border border-slate-900 p-2 text-center">{i + 1}</td>
                                    <td className="border border-slate-900 p-2 italic">Tagihan Air Bulan {months[r.month - 1]} {r.year}</td>
                                    <td className="border border-slate-900 p-2 text-right font-mono">{formatCurrency(r.amount)}</td>
                                </tr>
                            ))}
                            {data.installationArrears > 0 && (
                                <tr className="font-bold">
                                    <td className="border border-slate-900 p-2 text-center">{data.waterArrears.length + 1}</td>
                                    <td className="border border-slate-900 p-2 italic bg-slate-50">Sisa Tunggakan Pemasangan SR (Pasang Baru)</td>
                                    <td className="border border-slate-900 p-2 text-right font-mono">{formatCurrency(data.installationArrears)}</td>
                                </tr>
                            )}
                            <tr className="bg-slate-900 text-white font-black">
                                <td colSpan={2} className="border border-slate-900 p-2 text-right uppercase tracking-wider text-[10px]">Total Keseluruhan</td>
                                <td className="border border-slate-900 p-2 text-right font-mono text-[14px]">{formatCurrency(data.grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Ultimatum */}
                <div className="mb-10 text-[11.5px] leading-relaxed text-justify border-2 border-slate-900 p-4 rounded-xl bg-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <AlertTriangle className="w-20 h-20" />
                    </div>
                    <p className="font-black flex items-center gap-2 mb-2 uppercase tracking-tight">
                        <AlertTriangle className="w-4 h-4 text-rose-600" /> Perhatian & Peringatan:
                    </p>
                    <p className="font-medium text-slate-800">
                        Mohon agar segera melakukan pelunasan selambat-lambatnya <span className="font-black underline decoration-2 underline-offset-2 italic">7 (tujuh) hari</span> sejak diterimanya surat ini.
                    </p>
                    <p className="mt-2 font-black text-rose-700 italic leading-tight">
                        Apabila sampai batas waktu tersebut pelunasan belum dilakukan, maka pengurus akan melakukan TINDAKAN PEMUTUSAN SAMBUNGAN AIR tanpa pemberitahuan lebih lanjut.
                    </p>
                </div>

                <div className="print:break-inside-avoid">
                    <div className="mb-12 text-[11px] font-medium leading-relaxed text-slate-600">
                        <p>Demikian surat pemberitahuan ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-end text-[11px]">
                        <div className="text-center w-60">
                            <p className="mb-16 font-medium text-slate-500">Hormat kami,</p>
                            <p className="font-black underline decoration-2 underline-offset-4 uppercase tracking-tighter text-slate-900">DIREKTUR</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Pamsimas Tirtowening</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
