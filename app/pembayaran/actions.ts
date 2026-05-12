"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---

export type CustomerSearch = {
    id: number;
    no_pelanggan: string;
    nama: string;
    alamat: string;
    credit_balance: number;
    wilayah: string;
};

export type Bill = {
    id: number;
    month: number;
    year: number;
    meter_last: number;
    meter_current: number;
    usage: number;
    bill_amount: number;
    paid_amount: number;
    remaining: number;
    status: string;
    // NEW: Cost breakdown
    water_cost: number;
    maintenance_snapshot: number;
    rate_snapshot: number;
};

export type TodayStats = {
    total_cash: number;
    total_transfer: number;
    transaction_count: number;
};

// --- READ ACTIONS ---

export async function getAreas() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("areas")
        .select("id, name")
        .order("name");

    if (error) {
        console.error("Error fetching areas:", error);
        return [];
    }
    return data || [];
}

export async function searchCustomers(query: string, areaId?: string | number): Promise<CustomerSearch[]> {
    if ((!query || query.length < 2) && !areaId) return [];

    const supabase = await createClient();
    let dbQuery = supabase
        .from("customers")
        .select(`
            id, 
            connection_number, 
            name, 
            address, 
            credit_balance, 
            status,
            areas ( name )
        `)
        .eq("status", "active");

    if (areaId && areaId !== "all") {
        dbQuery = dbQuery.eq("area_id", areaId);
    }

    if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,connection_number.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery.limit(20);

    if (error) {
        console.error("Error searching customers:", error);
        return [];
    }

    return (data || []).map((c: any) => ({
        id: c.id,
        no_pelanggan: c.connection_number,
        nama: c.name,
        alamat: c.address || "",
        credit_balance: c.credit_balance || 0,
        wilayah: c.areas?.name || "Wilayah -"
    }));
}

export async function getCustomerStats(customerId: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("customers")
        .select("credit_balance")
        .eq("id", customerId)
        .single();

    if (error) return { credit_balance: 0 };
    return data;
}

export async function getUnpaidBills(customerId: number): Promise<Bill[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("meter_records")
        .select(`
            id,
            month,
            year,
            meter_last,
            meter_current,
            usage,
            bill_amount,
            paid_amount,
            status,
            rate_snapshot,
            maintenance_snapshot
        `)
        .eq("customer_id", customerId)
        .in("status", ["unpaid", "partial"])
        .order("year", { ascending: true })
        .order("month", { ascending: true });

    if (error) {
        console.error("Error fetching unpaid bills:", error);
        return [];
    }

    return (data || []).map((record: any) => {
        const remaining = record.bill_amount - (record.paid_amount || 0);
        const water_cost = record.usage * record.rate_snapshot;

        return {
            id: record.id,
            month: record.month,
            year: record.year,
            bill_amount: record.bill_amount,
            paid_amount: record.paid_amount || 0,
            remaining,
            status: record.status,
            // Meter details
            meter_last: record.meter_last,
            meter_current: record.meter_current,
            usage: record.usage,
            // Cost breakdown
            water_cost,
            maintenance_snapshot: record.maintenance_snapshot,
            rate_snapshot: record.rate_snapshot
        };
    });
}

export async function getTodayStats(): Promise<TodayStats> {
    const supabase = await createClient();

    // Get today's date range (midnight to now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
        .from("transactions")
        .select("total_amount, method")
        .gte("payment_date", todayISO);

    if (error) {
        console.error("Error fetching stats:", error);
        return { total_cash: 0, total_transfer: 0, transaction_count: 0 };
    }

    const stats = (data || []).reduce((acc, tx) => {
        if (tx.method === "cash") {
            acc.total_cash += tx.total_amount;
        } else if (tx.method === "transfer") {
            acc.total_transfer += tx.total_amount;
        }
        acc.transaction_count++;
        return acc;
    }, { total_cash: 0, total_transfer: 0, transaction_count: 0 });

    return stats;
}

// --- WRITE ACTION (COMPLEX PAYMENT LOGIC) ---

export async function processPayment(
    customerId: number,
    selectedBillIds: number[], // NEW: User selects which bills to pay
    paymentAmount: number,
    method: "cash" | "transfer",
    notes: string,
    useCredit: boolean // Whether to include existing credit balance
) {
    if (!paymentAmount && !useCredit) {
        return { error: "Jumlah pembayaran tidak valid." };
    }

    if (!selectedBillIds || selectedBillIds.length === 0) {
        return { error: "Pilih minimal satu tagihan." };
    }

    try {
        const supabase = await createClient();

        // Call the Database Transaction Function (RPC)
        const { data, error: rpcError } = await supabase.rpc('process_bulk_payment', {
            p_customer_id: customerId,
            p_bill_ids: selectedBillIds,
            p_payment_amount: paymentAmount,
            p_method: method,
            p_notes: notes,
            p_use_credit: useCredit
        });

        if (rpcError) {
            console.error("RPC Error:", rpcError);
            throw new Error(rpcError.message);
        }

        revalidatePath("/pembayaran");
        revalidatePath("/pelanggan");
        revalidatePath("/laporan/tunggakan");
        revalidatePath("/");

        return {
            success: true,
            allocated: data.allocated,
            newCredit: data.newCredit,
            txId: data.txId
        };

    } catch (err: any) {
        console.error("Payment processing error:", err);
        return { error: "Gagal memproses pembayaran: " + err.message };
    }
}
