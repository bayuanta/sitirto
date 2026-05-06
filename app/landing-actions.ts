"use server";

import { supabase } from "@/lib/supabase";

export type BillDetails = {
    customerName: string;
    customerNumber: string;
    address: string;
    unpaidBills: {
        month: number;
        year: number;
        usage: number;
        amount: number;
        period: string;
    }[];
    totalAmount: number;
};

export async function checkBill(connectionNumber: string): Promise<{ success: boolean; data?: BillDetails; error?: string }> {
    try {
        // 1. Find Customer
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("id, name, connection_number, address")
            .ilike("connection_number", connectionNumber)
            .single();

        if (customerError || !customer) {
            return { success: false, error: "Nomor Pelanggan tidak ditemukan." };
        }

        // 2. Find Unpaid Bills
        const { data: bills, error: billsError } = await supabase
            .from("meter_records")
            .select("month, year, usage, bill_amount, paid_amount")
            .eq("customer_id", customer.id)
            .neq("status", "paid")
            .order("year", { ascending: true })
            .order("month", { ascending: true });

        if (billsError) {
            return { success: false, error: "Gagal mengambil data tagihan." };
        }

        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        const unpaidBills = bills.map(b => ({
            month: b.month,
            year: b.year,
            usage: b.usage || 0,
            amount: (b.bill_amount || 0) - (b.paid_amount || 0),
            period: `${months[b.month - 1]} ${b.year}`
        }));

        const totalAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

        return {
            success: true,
            data: {
                customerName: customer.name,
                customerNumber: customer.connection_number,
                address: customer.address || "-",
                unpaidBills,
                totalAmount
            }
        };

    } catch (error) {
        console.error("Check Bill Error:", error);
        return { success: false, error: "Terjadi kesalahan internal." };
    }
}
