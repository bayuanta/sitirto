"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Droplets, Wallet, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PrintSetoranData } from './actions';
import { cn } from '@/lib/utils';

export default function PrintSetoranClient({ data }: { data: PrintSetoranData }) {
    const router = useRouter();
    // Default to 'hemat' for SR, allow 'hemat' or 'komplit' for Air
    const [formatOption, setFormatOption] = useState<'hemat' | 'komplit'>('hemat');

    const handlePrint = () => {
        window.print();
    };

    const formatRupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    // Pamsimas Info (Hardcoded for now)
    const pamsimasInfo = {
        name: "PAMSIMAS TIRTOWENING",
        address: "Desa Kemasan, Kec. Sawit",
        contact: "085867714590"
    };

    const isAir = data.type === 'air';

    // --- RECEIPT COMPONENT ---
    const getFormatWrapperClass = () => {
        switch (formatOption) {
            case 'hemat':
                return "w-[210mm] h-[55mm] mx-auto bg-white p-4 border shadow-sm overflow-hidden flex print:border-none print:shadow-none print:p-0 relative";
            case 'komplit':
                return "w-[210mm] min-h-[297mm] mx-auto bg-white p-12 border shadow-sm print:border-none print:shadow-none print:p-8";
            default:
                return "w-[210mm] mx-auto bg-white p-4 border shadow-sm";
        }
    };

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
                            <h1 className="font-bold text-slate-800">Cetak Setoran</h1>
                            <p className="text-xs text-slate-500">Setoran #{data.id} - {isAir ? 'Air' : 'Pasang Baru'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        {isAir && (
                            <div className="bg-slate-100 p-1 rounded-lg flex gap-1 shrink-0">
                                <button
                                    onClick={() => setFormatOption('hemat')}
                                    className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", formatOption === 'hemat' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:bg-slate-200")}
                                >
                                    Hemat Kertas
                                </button>
                                <button
                                    onClick={() => setFormatOption('komplit')}
                                    className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", formatOption === 'komplit' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:bg-slate-200")}
                                >
                                    Komplit
                                </button>
                            </div>
                        )}

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
                    <div className={getFormatWrapperClass()}>
                        {/* Kiri: Info Perusahaan */}
                        <div className="w-[30%] border-r-2 border-black border-dashed pr-4 flex flex-col justify-center text-center">
                            <div className="flex justify-center mb-1">
                                <Droplets className="w-8 h-8 text-black" />
                            </div>
                            <h2 className="font-black text-sm uppercase tracking-tight leading-none mb-1">{pamsimasInfo.name}</h2>
                            <p className="text-[9px]">{pamsimasInfo.address}</p>
                            <p className="text-[9px]">{pamsimasInfo.contact}</p>
                            <div className="mt-2 text-[10px] font-bold py-1 border-t border-b border-black">BUKTI SETORAN</div>
                        </div>

                        {/* Tengah: Detail Setoran */}
                        <div className="w-[45%] px-4 flex flex-col justify-center">
                            <div className="text-[12px] grid grid-cols-[80px_5px_1fr] gap-y-1 mb-2">
                                <div className="text-gray-600 font-bold">No. Setoran</div><div>:</div><div className="font-mono">#{data.id}</div>
                                <div className="text-gray-600 font-bold">Tanggal</div><div>:</div><div>{format(new Date(data.depositDate), 'dd MMMM yyyy', { locale: localeId })}</div>
                                <div className="text-gray-600 font-bold">Tipe Setoran</div><div>:</div><div className="font-bold">{isAir ? 'Tagihan Air' : 'Pasang Baru (SR)'}</div>
                                <div className="text-gray-600 font-bold">Petugas</div><div>:</div><div className="font-bold">{data.collectorName}</div>
                            </div>
                            {data.notes && (
                                <p className="text-[9px] text-gray-500 italic mt-1 bg-gray-50 p-1 rounded border border-gray-100">
                                    Catatan: {data.notes.replace('[AIR] ', '').replace('[SR] ', '')}
                                </p>
                            )}
                        </div>

                        {/* Kanan: Total & TTD */}
                        <div className="w-[25%] pl-4 border-l border-gray-200 flex flex-col justify-between py-1">
                            <div className="text-[10px]">
                                <div className="mb-1 text-gray-500 uppercase tracking-widest text-[8px] font-bold">Total Setoran</div>
                                <div className="font-black text-lg text-black font-mono tracking-tighter">
                                    {formatRupiah(data.totalCash)}
                                </div>
                                <div className="text-[9px] text-gray-400 mt-1">
                                    Terkumpul dari {data.details.length} transaksi
                                </div>
                            </div>
                            <div className="text-center mt-2 flex justify-between gap-2">
                                <div className="w-1/2">
                                    <div className="h-8 border-b border-black w-full mb-1"></div>
                                    <span className="text-[7px] text-gray-500 uppercase">Penyetor</span>
                                </div>
                                <div className="w-1/2">
                                    <div className="h-8 border-b border-black w-full mb-1"></div>
                                    <span className="text-[7px] text-gray-500 uppercase">Bendahara</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // KOMPLIT: FULL A4
                    <div className={getFormatWrapperClass()}>
                        <div className="flex flex-col h-full bg-white text-black">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6 border-dashed">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-2xl uppercase tracking-tight leading-none mb-1">LAPORAN SETORAN</h2>
                                        <p className="text-sm font-medium">{pamsimasInfo.name} - {pamsimasInfo.address}</p>
                                    </div>
                                </div>
                                <div className="text-right text-sm">
                                    <div className="font-mono text-xl font-bold">#{data.id}</div>
                                    <div className="text-gray-500">{format(new Date(data.depositDate), 'dd MMMM yyyy', { locale: localeId })}</div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex justify-between">
                                <div className="grid grid-cols-[100px_10px_1fr] gap-y-2 text-sm">
                                    <div className="text-gray-500 font-medium">Petugas</div><div>:</div><div className="font-bold">{data.collectorName}</div>
                                    <div className="text-gray-500 font-medium">Kategori</div><div>:</div><div className="font-bold uppercase">{isAir ? 'Tagihan Air' : 'Pasang Baru (SR)'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Total Setoran</div>
                                    <div className="text-3xl font-black font-mono tracking-tight text-emerald-600">
                                        {formatRupiah(data.totalCash)}
                                    </div>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-bold text-lg">Daftar Transaksi</h3>
                                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{data.details.length} Data</span>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-black">
                                            <th className="text-left py-2 px-2 font-bold w-12">No.</th>
                                            <th className="text-left py-2 px-2 font-bold">Tanggal</th>
                                            <th className="text-left py-2 px-2 font-bold">No. Samb.</th>
                                            <th className="text-left py-2 px-2 font-bold">Nama Pelanggan</th>
                                            <th className="text-right py-2 px-2 font-bold">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="align-top">
                                        {data.details.map((d, idx) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-2 text-gray-500 font-mono">{idx + 1}.</td>
                                                <td className="py-3 px-2 font-mono text-gray-600">{format(new Date(d.date), 'dd/MM/yy HH:mm')}</td>
                                                <td className="py-3 px-2 font-mono">{d.connectionNumber}</td>
                                                <td className="py-3 px-2 font-bold">{d.customerName}</td>
                                                <td className="py-3 px-2 text-right font-mono font-bold">{formatRupiah(d.amount)}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-t-2 border-black bg-gray-50">
                                            <td colSpan={4} className="py-3 px-2 text-right font-bold uppercase tracking-widest text-xs">Total Transaksi :</td>
                                            <td className="py-3 px-2 text-right font-black font-mono text-base">{formatRupiah(data.totalCash)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Signatures */}
                            <div className="mt-12 flex justify-between px-12">
                                <div className="text-center w-48">
                                    <p className="text-sm text-gray-500 mb-16">Dibuat Oleh (Petugas)</p>
                                    <div className="border-b border-black w-full mb-1"></div>
                                    <p className="font-bold text-sm">{data.collectorName}</p>
                                </div>
                                <div className="text-center w-48">
                                    <p className="text-sm text-gray-500 mb-16">Diterima Oleh (Bendahara)</p>
                                    <div className="border-b border-black w-full mb-1"></div>
                                    <p className="font-bold text-sm">( ............................ )</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Print Styles explicitly for this page to override anything else */}
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
