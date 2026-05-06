"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES - Water Bill Transactions
// ============================================

export type AllocationDetail = {
    record_id?: number;
    bill_id?: number;
    month?: number;
    year?: number;
    amount: number;
};

export type WaterBillTransaction = {
    id: number;
    created_at: string;
    customer_id: number;
    customer_name: string;
    customer_address: string;
    total_amount: number;
    method: "cash" | "transfer";
    applied_credit: number;
    new_credit: number;
    allocation_details: AllocationDetail[];
    notes: string;
};

export type WaterBillSummary = {
    total_amount: number;
    count: number;
};

// ============================================
// TYPES - Installation Payments
// ============================================

export type InstallationPayment = {
    id: number;
    payment_date: string;
    customer_id: number;
    customer_name: string;
    customer_address: string;
    amount: number;
    method: "cash" | "transfer";
    installation_fee_id: number;
    total_fee: number;
    paid_amount: number;
    remaining_amount: number;
    status: "pending" | "partial" | "paid";
    notes: string;
};

export type InstallationSummary = {
    total_amount: number;
    count: number;
};

// ============================================
// WATER BILL TRANSACTIONS
// ============================================

export async function getWaterBillTransactions(
    startDate: string,
    endDate: string,
    searchTerm: string = "",
    methodFilter: "all" | "cash" | "transfer" = "all"
): Promise<{ data: WaterBillTransaction[]; summary: WaterBillSummary }> {
    const supabase = await createClient();

    let query = supabase
        .from("transactions")
        .select(`
            id,
            created_at,
            customer_id,
            total_amount,
            method,
            applied_credit,
            new_credit,
            allocation_details,
            notes,
            customers (
                name,
                address
            )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

    // Date filter
    if (startDate && endDate) {
        const endDay = new Date(endDate);
        endDay.setHours(23, 59, 59, 999);
        query = query.gte("created_at", startDate).lte("created_at", endDay.toISOString());
    }

    // Payment method filter
    if (methodFilter !== "all") {
        query = query.eq("method", methodFilter);
    }

    const { data: rawData, error } = await query;

    if (error) {
        console.error("Error fetching water bill transactions:", error);
        return { data: [], summary: { total_amount: 0, count: 0 } };
    }

    // Transform data
    let processedData: WaterBillTransaction[] = (rawData || []).map((t: any) => ({
        id: t.id,
        created_at: t.created_at,
        customer_id: t.customer_id,
        customer_name: t.customers?.name || "Pelanggan Tidak Dikenal",
        customer_address: t.customers?.address || "-",
        total_amount: t.total_amount || 0,
        method: t.method || "cash",
        applied_credit: t.applied_credit || 0,
        new_credit: t.new_credit || 0,
        allocation_details: Array.isArray(t.allocation_details)
            ? t.allocation_details
            : typeof t.allocation_details === 'string'
                ? JSON.parse(t.allocation_details)
                : [],
        notes: t.notes || ""
    }));

    // Search filter (client-side)
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        processedData = processedData.filter(
            (item) =>
                item.customer_name.toLowerCase().includes(lowerSearch) ||
                item.id.toString().includes(lowerSearch)
        );
    }

    // Calculate summary
    const total_amount = processedData.reduce((sum, item) => sum + item.total_amount, 0);

    return {
        data: processedData,
        summary: {
            total_amount,
            count: processedData.length
        }
    };
}

// ============================================
// INSTALLATION PAYMENTS
// ============================================

export async function getInstallationPayments(
    startDate: string,
    endDate: string,
    searchTerm: string = "",
    methodFilter: "all" | "cash" | "transfer" = "all"
): Promise<{ data: InstallationPayment[]; summary: InstallationSummary }> {
    const supabase = await createClient();

    let query = supabase
        .from("installation_payments")
        .select(`
            id,
            payment_date,
            amount,
            method,
            notes,
            installation_fee_id,
            installation_fees (
                customer_id,
                total_amount,
                paid_amount,
                remaining_amount,
                status,
                customers (
                    name,
                    address
                )
            )
        `)
        .order("payment_date", { ascending: false })
        .limit(200);

    // Date filter
    if (startDate && endDate) {
        const endDay = new Date(endDate);
        endDay.setHours(23, 59, 59, 999);
        query = query.gte("payment_date", startDate).lte("payment_date", endDay.toISOString());
    }

    // Payment method filter
    if (methodFilter !== "all") {
        query = query.eq("method", methodFilter);
    }

    const { data: rawData, error } = await query;

    if (error) {
        console.error("Error fetching installation payments:", error);
        return { data: [], summary: { total_amount: 0, count: 0 } };
    }

    // Transform data
    let processedData: InstallationPayment[] = (rawData || []).map((p: any) => {
        const fee = p.installation_fees;
        return {
            id: p.id,
            payment_date: p.payment_date,
            customer_id: fee?.customer_id || 0,
            customer_name: fee?.customers?.name || "Pelanggan Tidak Dikenal",
            customer_address: fee?.customers?.address || "-",
            amount: p.amount || 0,
            method: p.method || "cash",
            installation_fee_id: p.installation_fee_id,
            total_fee: fee?.total_amount || 0,
            paid_amount: fee?.paid_amount || 0,
            remaining_amount: fee?.remaining_amount || 0,
            status: fee?.status || "pending",
            notes: p.notes || ""
        };
    });

    // Search filter (client-side)
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        processedData = processedData.filter(
            (item) =>
                item.customer_name.toLowerCase().includes(lowerSearch) ||
                item.id.toString().includes(lowerSearch)
        );
    }

    // Calculate summary
    const total_amount = processedData.reduce((sum, item) => sum + item.amount, 0);

    return {
        data: processedData,
        summary: {
            total_amount,
            count: processedData.length
        }
    };
}

// ============================================
// DELETE ACTIONS
// ============================================

export async function deleteWaterTransaction(id: number) {
    const supabase = await createClient();

    console.log("[DELETE] Starting deleteWaterTransaction for ID:", id);

    // 1. Get Transaction Data
    const { data: tx, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

    if (txError || !tx) {
        console.error("[DELETE] Transaction not found:", txError);
        return { success: false, message: "Transaksi tidak ditemukan." };
    }

    try {
        // 2. Parse Allocation Details
        let allocationDetails: AllocationDetail[] = [];
        if (Array.isArray(tx.allocation_details)) {
            allocationDetails = tx.allocation_details;
        } else if (typeof tx.allocation_details === 'string') {
            allocationDetails = JSON.parse(tx.allocation_details);
        }

        console.log("[DELETE] Rolling back allocation details:", allocationDetails.length);

        // 3. Rollback Meter Records (Revert Payment)
        for (const detail of allocationDetails) {
            const targetId = detail.record_id || detail.bill_id;
            if (!targetId) {
                console.warn("[DELETE] Skipping detail due to missing ID:", detail);
                continue;
            }

            // Get current record
            const { data: record } = await supabase
                .from("meter_records")
                .select("bill_amount, paid_amount")
                .eq("id", targetId)
                .single();

            if (record) {
                const newPaidAmount = Math.max(0, record.paid_amount - detail.amount);

                // Correct status logic:
                let finalStatus = "unpaid";
                if (newPaidAmount >= record.bill_amount) finalStatus = "paid";
                else if (newPaidAmount > 0) finalStatus = "partial";

                await supabase
                    .from("meter_records")
                    .update({
                        paid_amount: newPaidAmount,
                        status: finalStatus
                    })
                    .eq("id", targetId);
            }
        }

        // 4. Rollback Customer Credit Balance
        // Logic: logic bayar = (tagihan - credit_terpakai) + sisa_ke_credit = uang_cash
        // Rollback: balance_sekarang + credit_terpakai - sisa_ke_credit
        if (tx.applied_credit > 0 || tx.new_credit > 0) {
            const { data: customer } = await supabase
                .from("customers")
                .select("credit_balance")
                .eq("id", tx.customer_id)
                .single();

            if (customer) {
                const currentBalance = Number(customer.credit_balance || 0);
                const revertedBalance = currentBalance + Number(tx.applied_credit || 0) - Number(tx.new_credit || 0);

                console.log("[DELETE] Rolling back credit. Current:", currentBalance, "Reverted:", revertedBalance);

                await supabase
                    .from("customers")
                    .update({ credit_balance: Math.max(0, revertedBalance) })
                    .eq("id", tx.customer_id);
            }
        }

        // 5. Delete Transaction
        const { error: deleteError } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        console.log("[DELETE] Transaction deleted successfully");
        
        // REVALIDATE ALL RELATED PATHS
        revalidatePath("/riwayat");
        revalidatePath("/pembayaran");
        revalidatePath("/pelanggan");
        revalidatePath("/laporan/tunggakan");
        revalidatePath("/");
        
        return { success: true, message: "Transaksi pembayaran air berhasil dihapus." };

    } catch (error) {
        console.error("Delete transaction error:", error);
        return { success: false, message: "Gagal menghapus transaksi. Terjadi kesalahan sistem." };
    }
}

export async function deleteInstallationPayment(id: number) {
    const supabase = await createClient();

    console.log("[DELETE] Starting deleteInstallationPayment for ID:", id);

    // 1. Get Payment Data
    const { data: payment, error: fetchError } = await supabase
        .from("installation_payments")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !payment) {
        return { success: false, message: "Pembayaran tidak ditemukan." };
    }

    try {
        // 2. Rollback Installation Fee
        const { data: fee } = await supabase
            .from("installation_fees")
            .select("total_amount, paid_amount")
            .eq("id", payment.installation_fee_id)
            .single();

        if (fee) {
            const newPaidAmount = Math.max(0, fee.paid_amount - payment.amount);

            let newStatus = "pending";
            if (newPaidAmount >= fee.total_amount) newStatus = "paid";
            else if (newPaidAmount > 0) newStatus = "partial";

            await supabase
                .from("installation_fees")
                .update({
                    paid_amount: newPaidAmount,
                    status: newStatus
                })
                .eq("id", payment.installation_fee_id);
        }

        // 3. Delete Payment Log
        const { error: deleteError } = await supabase
            .from("installation_payments")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        revalidatePath("/riwayat");
        revalidatePath("/pelanggan");

        return { success: true, message: "Pembayaran instalasi berhasil dihapus." };

    } catch (error) {
        console.error("Delete installation payment error:", error);
        return { success: false, message: "Gagal menghapus pembayaran." };
    }
}
