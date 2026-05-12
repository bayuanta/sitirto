"use client";

import { useEffect } from "react";

const MONTHS = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

interface PrintFormMeteranClientProps {
    data: any[];
    group?: string;
    area?: string;
    month: number;
    year: number;
}

export default function PrintFormMeteranClient({
    data,
    group,
    area,
    month,
    year
}: PrintFormMeteranClientProps) {
    useEffect(() => {
        // Trigger print automatically when component is mounted
        if (typeof window !== "undefined") {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, []);

    const monthName = MONTHS[month - 1];

    return (
        <div className="bg-white min-h-screen font-sans text-black p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 20mm; /* Margin for every printed page */
                    }
                    body {
                        background: white;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            `}</style>

            <div className="flex justify-between items-start mb-8">
                {/* Header Kiri */}
                <div>
                    <h1 className="text-2xl font-black tracking-tighter m-0 p-0 leading-none">PAMSIMAS</h1>
                    <div className="text-[10px] font-semibold leading-tight mt-1">
                        Penyediaan Air Minum dan Sanitasi<br />
                        Berbasis Masyarakat<br />
                        <span className="font-black text-[12px]">Desa Kemasan</span>
                    </div>
                </div>

                {/* Header Kanan */}
                <div className="text-right flex flex-col items-end">
                    <div className="text-[12px]">Data Angka Meteran</div>
                    <div className="text-[12px]">Pelanggan Pamsimas Desa Kemasan</div>
                    {group && group !== 'ALL' && (
                        <div className="text-[12px] font-bold">Kelompok: {group}</div>
                    )}
                    <div className="mt-4 text-[14px]">
                        Bulan: <span className="font-bold border-b border-black inline-block min-w-[150px] text-center pb-0.5">{monthName} {year}</span>
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse border border-black text-[12px]">
                <thead>
                    <tr>
                        <th className="border border-black py-2 px-3 bg-white font-normal text-center w-[10%]">
                            No. Pelanggan
                        </th>
                        <th className="border border-black py-2 px-3 bg-white font-normal text-center w-[30%]">
                            Nama Pelanggan
                        </th>
                        <th className="border border-black py-2 px-3 bg-white font-normal text-center w-[20%]">
                            Alamat
                        </th>
                        <th className="border border-black py-2 px-3 bg-white font-normal text-center w-[15%]">
                            Meter Lalu
                        </th>
                        <th className="border border-black py-2 px-3 bg-white font-normal text-center w-[25%]">
                            Angka Meteran Air
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((customer, index) => (
                        <tr key={customer.id}>
                            <td className="border border-black py-2 px-3 text-center">
                                {customer.no_pelanggan}
                            </td>
                            <td className="border border-black py-2 px-3">
                                {customer.nama}
                            </td>
                            <td className="border border-black py-2 px-3">
                                {customer.area_name}
                            </td>
                            <td className="border border-black py-2 px-3 text-center font-bold">
                                {customer.meter_lalu}
                            </td>
                            <td className="border border-black py-2 px-3 text-center">
                                {/* Empty space for writing */}
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={5} className="border border-black py-4 px-3 text-center italic text-gray-500">
                                Tidak ada data pelanggan untuk filter ini.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
