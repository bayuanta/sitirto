"use server";

import { createAdminClient } from "@/lib/supabase-admin";

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
    paidBills: {
        id: string;
        month: number;
        year: number;
        usage: number;
        amount: number;
        paidAt: string;
        period: string;
    }[];
    totalAmount: number;
};

export async function checkBill(connectionNumber: string): Promise<{ success: boolean; data?: BillDetails; error?: string }> {
    try {
        const supabase = createAdminClient();

        // 1. Find Customer
        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("id, name, connection_number, address")
            .ilike("connection_number", connectionNumber)
            .single();

        if (customerError || !customer) {
            console.error("Customer Error:", customerError);
            return { success: false, error: "Nomor Pelanggan tidak ditemukan atau database sibuk." };
        }

        // 2. Find Unpaid Bills
        const { data: bills, error: billsError } = await supabase
            .from("meter_records")
            .select("month, year, usage, bill_amount, paid_amount")
            .eq("customer_id", customer.id)
            .in("status", ["unpaid", "partial"]) // Explicitly get only unpaid/partial
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

        const { data: transactions, error: txError } = await supabase
            .from("transactions")
            .select("id, total_amount, payment_date, notes, method")
            .eq("customer_id", customer.id)
            .order("payment_date", { ascending: false })
            .limit(100);

        if (txError) {
            console.error("Fetch Transactions Error:", txError);
        }

        const paidBills = (transactions || []).map(tx => {
            let displayPeriod = tx.notes || "Pembayaran Air";
            
            // If it's a migration record, use the payment_date to show the month/year
            if (displayPeriod === "Migrasi Data Historis" && tx.payment_date) {
                const date = new Date(tx.payment_date);
                displayPeriod = `${months[date.getMonth()]} ${date.getFullYear()}`;
            }

            return {
                id: tx.id.toString(),
                month: 0, 
                year: 0,
                usage: 0,
                amount: tx.total_amount || 0,
                paidAt: tx.payment_date || "",
                period: displayPeriod
            };
        });

        const totalAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

        return {
            success: true,
            data: {
                customerName: customer.name,
                customerNumber: customer.connection_number,
                address: customer.address || "-",
                unpaidBills,
                paidBills,
                totalAmount
            }
        };

    } catch (error: any) {
        console.error("Check Bill Error:", error);
        return { success: false, error: `Gagal menyambung ke server: ${error.message || "Cek koneksi database"}` };
    }
}
