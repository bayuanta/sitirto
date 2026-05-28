import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { cn } from "@/lib/utils";

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatRupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

type CustomerForExport = {
    id: number;
    no_pelanggan: string;
    nama: string;
    meter_lalu: number;
    current_value_if_saved?: number | null;
    saved_bill_amount?: number | null;
    area_name?: string;
};

type Props = {
    month: number;
    year: number;
    group: string;
    customers: CustomerForExport[];
};

export type MultiPageExportHandle = {
    getPageRefs: () => HTMLDivElement[];
};

export const MultiPageImageExport = forwardRef<MultiPageExportHandle, Props>(({
    month, year, group, customers
}, ref) => {
    
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<HTMLDivElement[]>([]);

    useImperativeHandle(ref, () => ({
        getPageRefs: () => {
            return pageRefs.current.filter(el => el !== null);
        }
    }));

    // Group customers by area
    const grouped = customers.reduce((acc, c) => {
        const area = c.area_name || 'Tanpa Wilayah';
        if (!acc[area]) acc[area] = [];
        acc[area].push(c);
        return acc;
    }, {} as Record<string, CustomerForExport[]>);

    // Chunk size
    const MAX_ROWS = 45;

    const pages: { area: string; part: number; totalParts: number; data: CustomerForExport[] }[] = [];

    Object.entries(grouped).forEach(([area, list]) => {
        const totalParts = Math.ceil(list.length / MAX_ROWS);
        for (let i = 0; i < totalParts; i++) {
            pages.push({
                area,
                part: i + 1,
                totalParts,
                data: list.slice(i * MAX_ROWS, (i + 1) * MAX_ROWS)
            });
        }
    });

    const monthName = MONTHS[month - 1];

    // Reset refs on each render so we don't hold onto stale pages
    pageRefs.current = [];

    return (
        <div 
            ref={containerRef}
            className="absolute left-[-9999px] top-[-9999px] flex flex-col gap-10"
            style={{ width: '800px' }}
        >
            {pages.map((page, pIdx) => (
                <div 
                    key={pIdx} 
                    ref={el => {
                        if (el) pageRefs.current[pIdx] = el;
                    }}
                    className="bg-white p-8 font-sans"
                    style={{ width: '800px', minHeight: '1130px', border: '1px solid #eee' }}
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight m-0">PAMSIMAS TIRTOWENING</h2>
                        <h3 className="text-lg font-bold text-slate-700 mt-1 mb-1">DAFTAR TAGIHAN AIR</h3>
                        <p className="text-sm font-medium text-slate-500">
                            Periode: {monthName} {year} {group !== 'ALL' ? `| Kelompok: ${group}` : ''}
                        </p>
                    </div>

                    <div className="mb-4 flex justify-between items-end border-b-2 border-slate-800 pb-2">
                        <div>
                            <p className="text-lg font-black text-slate-800">WILAYAH: {page.area.toUpperCase()}</p>
                        </div>
                        {page.totalParts > 1 && (
                            <p className="text-sm font-bold text-slate-500">Halaman {page.part} dari {page.totalParts}</p>
                        )}
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white text-[13px]">
                                <th className="py-2.5 px-3 text-center w-12 font-bold border border-slate-800">NO</th>
                                <th className="py-2.5 px-3 text-center w-32 font-bold border border-slate-800">NO PELANGGAN</th>
                                <th className="py-2.5 px-3 text-left font-bold border border-slate-800">NAMA PELANGGAN</th>
                                <th className="py-2.5 px-3 text-center w-28 font-bold border border-slate-800">PEMAKAIAN</th>
                                <th className="py-2.5 px-3 text-right w-40 font-bold border border-slate-800">TOTAL TAGIHAN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {page.data.map((c, idx) => {
                                const usage = (c.current_value_if_saved || 0) - c.meter_lalu;
                                return (
                                    <tr key={c.id} className="text-[13px] text-slate-800">
                                        <td className="py-2 px-3 text-center font-medium border border-slate-300">{(page.part - 1) * MAX_ROWS + idx + 1}</td>
                                        <td className="py-2 px-3 text-center font-bold text-slate-600 border border-slate-300">{c.no_pelanggan}</td>
                                        <td className="py-2 px-3 text-left font-bold text-slate-900 border border-slate-300">{c.nama}</td>
                                        <td className="py-2 px-3 text-center font-medium border border-slate-300">{usage} m³</td>
                                        <td className="py-2 px-3 text-right font-black text-slate-900 border border-slate-300">{formatRupiah(c.saved_bill_amount || 0)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="mt-8 text-right text-xs font-bold text-slate-400">
                        Dicetak secara otomatis oleh Sistem Pamsimas
                    </div>
                </div>
            ))}
        </div>
    );
});
