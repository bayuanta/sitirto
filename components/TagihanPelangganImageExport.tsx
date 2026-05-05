"use client";

import React, { forwardRef } from 'react';

const formatRupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export type BillForExport = {
    id: number;
    month: number;
    year: number;
    usage: number;
    meter_last: number;
    meter_current: number;
    bill_amount: number;
    paid_amount: number;
    remaining: number;
    status: string;
};

export type CustomerInfoForExport = {
    nama: string;
    no_pelanggan: string;
    alamat?: string;
    wilayah?: string;
};

interface TagihanPelangganImageExportProps {
    customer: CustomerInfoForExport;
    bills: BillForExport[];
    /** Mode: 'single' = satu tagihan, 'all' = semua tunggakan */
    mode: 'single' | 'all';
    /** Jika mode='single', bill yang dipilih */
    selectedBill?: BillForExport;
}

export const TagihanPelangganImageExport = forwardRef<HTMLDivElement, TagihanPelangganImageExportProps>(
    ({ customer, bills, mode, selectedBill }, ref) => {

        const unpaidBills = mode === 'all'
            ? bills.filter(b => b.status !== 'paid').sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            })
            : selectedBill ? [selectedBill] : [];

        const totalRemaining = unpaidBills.reduce((sum, b) => sum + b.remaining, 0);
        const printDate = new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return (
            <div className="fixed -left-[9999px] top-0 pointer-events-none z-0">
                <div
                    ref={ref}
                    style={{ backgroundColor: '#ffffff', width: '600px', fontFamily: 'Arial, sans-serif' }}
                    className="p-8 flex flex-col"
                >
                    {/* Header */}
                    <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '16px', marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px' }}>
                            PAMSIMAS TIRTOWENING
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginTop: '2px' }}>
                            {mode === 'single' ? 'KUITANSI TAGIHAN AIR' : 'RINCIAN TUNGGAKAN AIR'}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        marginBottom: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nama Pelanggan</span>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', textAlign: 'right', maxWidth: '340px' }}>{customer.nama}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>No. Pelanggan</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', fontFamily: 'monospace' }}>{customer.no_pelanggan}</span>
                        </div>
                        {customer.wilayah && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wilayah</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>{customer.wilayah}</span>
                            </div>
                        )}
                    </div>

                    {/* Bills Table */}
                    {/* Table Header */}
                    <div style={{
                        display: 'flex',
                        backgroundColor: '#1e293b',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '8px 10px',
                        borderRadius: '6px 6px 0 0'
                    }}>
                        <div style={{ width: '36px', textAlign: 'center' }}>NO</div>
                        <div style={{ flex: 1 }}>BULAN</div>
                        <div style={{ width: '80px', textAlign: 'center' }}>PEMAKAIAN</div>
                        <div style={{ width: '120px', textAlign: 'right' }}>TOTAL TAGIHAN</div>
                        {mode === 'all' && <div style={{ width: '100px', textAlign: 'right' }}>SISA BAYAR</div>}
                    </div>

                    {/* Table Body */}
                    <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden', marginBottom: '16px' }}>
                        {unpaidBills.map((bill, idx) => (
                            <div
                                key={bill.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 10px',
                                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                    borderBottom: idx < unpaidBills.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    fontSize: '13px'
                                }}
                            >
                                <div style={{ width: '36px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>{idx + 1}</div>
                                <div style={{ flex: 1, fontWeight: '700', color: '#0f172a' }}>
                                    {monthNames[bill.month - 1]} {bill.year}
                                    {bill.status === 'partial' && (
                                        <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '99px', marginLeft: '6px', fontWeight: '700' }}>Cicilan</span>
                                    )}
                                </div>
                                <div style={{ width: '80px', textAlign: 'center', color: '#475569', fontWeight: '600', fontFamily: 'monospace' }}>{bill.usage} m³</div>
                                <div style={{ width: '120px', textAlign: 'right', fontWeight: '800', color: '#1e293b' }}>{formatRupiah(bill.bill_amount)}</div>
                                {mode === 'all' && (
                                    <div style={{ width: '100px', textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>{formatRupiah(bill.remaining)}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Total Row */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '24px'
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: '700' }}>
                            {mode === 'all' ? `TOTAL TUNGGAKAN (${unpaidBills.length} bulan)` : 'TOTAL TAGIHAN'}
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>
                            {formatRupiah(mode === 'all' ? totalRemaining : (selectedBill?.bill_amount || 0))}
                        </span>
                    </div>

                    {/* Notice */}
                    <div style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '20px',
                        fontSize: '11px',
                        color: '#1d4ed8',
                        lineHeight: '1.6'
                    }}>
                        Mohon melakukan pembayaran secepatnya agar layanan air Anda tetap berjalan lancar.
                        Untuk informasi lebih lanjut, hubungi pengurus Pamsimas Tirtowening.
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        Dicetak otomatis oleh Sistem Pamsimas Tirtowening • {printDate}
                    </div>
                </div>
            </div>
        );
    }
);

TagihanPelangganImageExport.displayName = 'TagihanPelangganImageExport';
