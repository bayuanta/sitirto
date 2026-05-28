"use client";

import React, { forwardRef } from 'react';
import { CustomerSearch } from '@/app/input-meteran/actions';

const formatRupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

export type CustomerForExport = CustomerSearch & {
    is_saved: boolean;
    saved_bill_amount?: number | null;
    current_value_if_saved?: number | null;
    meter_lalu: number;
    area_name?: string;
};

interface TagihanImageExportProps {
    month: number;
    year: number;
    group: string;
    areaName: string;
    customers: CustomerForExport[];
}

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

type RenderItem = 
    | { type: 'area-header', area: string }
    | { type: 'table-header' }
    | { type: 'row', data: CustomerForExport, index: number };

export const TagihanImageExport = forwardRef<HTMLDivElement, TagihanImageExportProps>(
    ({ month, year, group, areaName, customers }, ref) => {
        // Only include customers that have been saved
        const savedCustomers = customers.filter(c => c.is_saved);

        const totalCustomers = savedCustomers.length;
        const numCols = totalCustomers > 160 ? 3 : totalCustomers > 80 ? 2 : 1;
        const maxRowsPerCol = Math.ceil(totalCustomers / numCols);

        const columnsData: RenderItem[][] = Array.from({ length: numCols }, () => []);
        let currentColIndex = 0;
        let rowsInCurrentCol = 0;

        const grouped = Object.entries(savedCustomers.reduce((acc, c) => {
            const area = c.area_name || 'Tanpa Wilayah';
            if (!acc[area]) acc[area] = [];
            acc[area].push(c);
            return acc;
        }, {} as Record<string, CustomerForExport[]>));

        for (const [area, areaCustomers] of grouped) {
            const addHeaders = (colIdx: number, areaName: string) => {
                columnsData[colIdx].push({ type: 'area-header', area: areaName });
                columnsData[colIdx].push({ type: 'table-header' });
            };

            addHeaders(currentColIndex, area);

            for (let i = 0; i < areaCustomers.length; i++) {
                if (rowsInCurrentCol >= maxRowsPerCol && currentColIndex < numCols - 1) {
                    currentColIndex++;
                    rowsInCurrentCol = 0;
                    addHeaders(currentColIndex, area); // Lanjutan
                }
                columnsData[currentColIndex].push({ type: 'row', data: areaCustomers[i], index: i + 1 });
                rowsInCurrentCol++;
            }
        }

        return (
            // This container will be kept completely off-screen
            <div className="fixed -left-[9999px] top-0 pointer-events-none z-0">
                <div 
                    ref={ref}
                    className="bg-white px-8 py-10 flex flex-col font-sans w-max min-w-[700px]"
                    style={{
                        backgroundColor: '#ffffff'
                    }}
                >
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8 border-b-2 border-slate-800 pb-4">
                        <h1 className="text-2xl font-black text-slate-900 tracking-wider">PAMSIMAS TIRTOWENING</h1>
                        <h2 className="text-lg font-bold text-slate-700 mt-1">DAFTAR TAGIHAN AIR</h2>
                        <div className="mt-3 text-base font-black bg-slate-100 px-6 py-2 rounded-full text-slate-800 text-center uppercase tracking-wide border border-slate-200">
                            Bulan: {monthNames[month - 1]} {year}
                        </div>
                    </div>

                    {/* Table List (Multi-Column Poster Layout) */}
                    {savedCustomers.length > 0 ? (
                        <div className="flex gap-8 items-start">
                            {columnsData.map((col, cIdx) => (
                                <div key={cIdx} className="flex-1 flex flex-col w-[600px]">
                                    {col.map((item, i) => {
                                        if (item.type === 'area-header') {
                                            return (
                                                <div key={i} className="bg-slate-100 border-l-4 border-slate-600 px-3 py-1.5 mb-2 rounded-r-md mt-4 first:mt-0">
                                                    <h3 className="font-black text-slate-800 text-sm tracking-wide uppercase">
                                                        Wilayah: {item.area} {cIdx > 0 && i === 0 ? '(Lanjutan)' : ''}
                                                    </h3>
                                                </div>
                                            );
                                        }
                                        if (item.type === 'table-header') {
                                            return (
                                                <div key={i} className="flex font-bold text-[11px] bg-slate-800 text-white p-2 rounded-t-md">
                                                    <div className="w-10 text-center">NO</div>
                                                    <div className="w-24 text-center">NO PEL</div>
                                                    <div className="flex-1">NAMA PELANGGAN</div>
                                                    <div className="w-20 text-center">PAKAI</div>
                                                    <div className="w-32 text-right pr-2">TAGIHAN</div>
                                                </div>
                                            );
                                        }
                                        if (item.type === 'row') {
                                            const c = item.data;
                                            const usage = (c.current_value_if_saved || 0) - c.meter_lalu;
                                            const isLastInCol = i === col.length - 1;
                                            const isNextHeader = !isLastInCol && col[i+1].type !== 'row';
                                            const roundedBottom = isLastInCol || isNextHeader;
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`flex text-sm p-2 border-x border-b border-slate-200 ${item.index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${roundedBottom ? 'rounded-b-md mb-4' : ''}`}
                                                >
                                                    <div className="w-10 text-center text-slate-500 font-medium">{item.index}</div>
                                                    <div className="w-24 text-center font-mono text-slate-700 text-xs mt-0.5">{c.no_pelanggan}</div>
                                                    <div className="flex-1 font-bold text-slate-900">{c.nama}</div>
                                                    <div className="w-20 text-center font-mono text-slate-600">{usage} m³</div>
                                                    <div className="w-32 text-right font-black text-slate-800 pr-2">
                                                        {formatRupiah(c.saved_bill_amount || 0).replace('Rp', '')}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 italic font-medium">
                            Belum ada data tagihan yang tersimpan untuk kelompok ini.
                        </div>
                    )}

                    {/* Footer / Watermark */}
                    <div className="mt-8 pt-4 text-center text-xs text-slate-400 border-t border-slate-200">
                        Dicetak otomatis oleh Sistem Pamsimas Tirtowening pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        );
    }
);

TagihanImageExport.displayName = 'TagihanImageExport';
