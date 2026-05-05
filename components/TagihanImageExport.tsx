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

export const TagihanImageExport = forwardRef<HTMLDivElement, TagihanImageExportProps>(
    ({ month, year, group, areaName, customers }, ref) => {
        // Only include customers that have been saved
        const savedCustomers = customers.filter(c => c.is_saved);

        return (
            // This container will be kept completely off-screen
            <div className="fixed -left-[9999px] top-0 pointer-events-none z-0">
                <div 
                    ref={ref}
                    className="bg-white px-8 py-10 w-[700px] flex flex-col font-sans"
                    style={{
                        // Setting a background color ensures the image doesn't have a transparent background
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

                    {/* Table List */}
                    {savedCustomers.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            {Object.entries(savedCustomers.reduce((acc, c) => {
                                const area = c.area_name || 'Tanpa Wilayah';
                                if (!acc[area]) acc[area] = [];
                                acc[area].push(c);
                                return acc;
                            }, {} as Record<string, CustomerForExport[]>)).map(([area, areaCustomers]) => (
                                <div key={area} className="flex flex-col">
                                    {/* Area Header */}
                                    <div className="bg-slate-100 border-l-4 border-slate-600 px-3 py-1.5 mb-2 rounded-r-md">
                                        <h3 className="font-black text-slate-800 text-sm tracking-wide uppercase">
                                            Wilayah: {area}
                                        </h3>
                                    </div>
                                    
                                    {/* Table Header */}
                                    <div className="flex font-bold text-[11px] bg-slate-800 text-white p-2 rounded-t-md">
                                        <div className="w-10 text-center">NO</div>
                                        <div className="w-24 text-center">NO PEL</div>
                                        <div className="flex-1">NAMA PELANGGAN</div>
                                        <div className="w-20 text-center">PAKAI</div>
                                        <div className="w-32 text-right pr-2">TAGIHAN</div>
                                    </div>
                                    
                                    {/* Table Body */}
                                    <div className="border border-slate-200 border-t-0 rounded-b-md">
                                        {areaCustomers.map((c, idx) => {
                                            const usage = (c.current_value_if_saved || 0) - c.meter_lalu;
                                            return (
                                                <div 
                                                    key={c.id} 
                                                    className={`flex text-sm p-2 border-b border-slate-100 last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                                >
                                                    <div className="w-10 text-center text-slate-500 font-medium">{idx + 1}</div>
                                                    <div className="w-24 text-center font-mono text-slate-700 text-xs mt-0.5">{c.no_pelanggan}</div>
                                                    <div className="flex-1 font-bold text-slate-900">{c.nama}</div>
                                                    <div className="w-20 text-center font-mono text-slate-600">{usage} m³</div>
                                                    <div className="w-32 text-right font-black text-slate-800 pr-2">
                                                        {formatRupiah(c.saved_bill_amount || 0).replace('Rp', '')}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
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
