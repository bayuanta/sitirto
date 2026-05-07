"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export type UndepositedSummary = {
    total_amount: number;
    transaction_amount: number;
    installation_amount: number;
    transaction_count: number;
    installation_count: number;
    total_count: number;
};

export type UndepositedDetail = {
    id: number;
    type: 'transaction' | 'installation';
    customer_name: string;
    amount: number;
    date: string;
};

export type DepositHistory = {
    id: number;
    collector_name: string;
    deposit_date: string;
    total_cash: number;
    notes: string;
    evidence_url: string | null;
    created_at: string;
    type: 'air' | 'sr' | 'mixed';
};

// ============================================
// GET UNDEPOSITED CASH SUMMARY
// ============================================

export async function getUndepositedSummary(): Promise<UndepositedSummary> {
    const supabase = await createClient();

    try {
        // 1. Get undeposited water bill transactions
        const { data: transactions, error: txError } = await supabase
            .from("transactions")
            .select("total_amount")
            .eq("method", "cash")
            .eq("is_deposited", false);

        if (txError) {
            console.error("Error fetching undeposited transactions:", txError);
        }

        // 2. Get undeposited installation payments
        const { data: installations, error: instError } = await supabase
            .from("installation_payments")
            .select("amount")
            .eq("method", "cash")
            .eq("is_deposited", false);

        if (instError) {
            console.error("Error fetching undeposited installations:", instError);
        }

        // 3. Calculate totals
        const transactionTotal = (transactions || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
        const installationTotal = (installations || []).reduce((sum, i) => sum + (i.amount || 0), 0);

        return {
            total_amount: transactionTotal + installationTotal,
            transaction_amount: transactionTotal,
            installation_amount: installationTotal,
            transaction_count: transactions?.length || 0,
            installation_count: installations?.length || 0,
            total_count: (transactions?.length || 0) + (installations?.length || 0)
        };
    } catch (error) {
        console.error("Error in getUndepositedSummary:", error);
        return {
            total_amount: 0,
            transaction_amount: 0,
            installation_amount: 0,
            transaction_count: 0,
            installation_count: 0,
            total_count: 0
        };
    }
}

// ============================================
// GET UNDEPOSITED DETAILS
// ============================================

export async function getUndepositedDetails(): Promise<UndepositedDetail[]> {
    const supabase = await createClient();

    try {
        // 1. Get undeposited water bill transactions with customer info
        const { data: transactions, error: txError } = await supabase
            .from("transactions")
            .select(`
                id,
                total_amount,
                created_at,
                customers (
                    name
                )
            `)
            .eq("method", "cash")
            .eq("is_deposited", false)
            .order("created_at", { ascending: false });

        if (txError) {
            console.error("Error fetching transaction details:", txError);
        }

        // 2. Get undeposited installation payments with customer info
        const { data: installations, error: instError } = await supabase
            .from("installation_payments")
            .select(`
                id,
                amount,
                payment_date,
                installation_fees (
                    customers (
                        name
                    )
                )
            `)
            .eq("method", "cash")
            .eq("is_deposited", false)
            .order("payment_date", { ascending: false });

        if (instError) {
            console.error("Error fetching installation details:", instError);
        }

        // 3. Transform and combine
        const txDetails: UndepositedDetail[] = (transactions || []).map((t: any) => ({
            id: t.id,
            type: 'transaction' as const,
            customer_name: t.customers?.name || 'Pelanggan Tidak Dikenal',
            amount: t.total_amount || 0,
            date: t.created_at
        }));

        const instDetails: UndepositedDetail[] = (installations || []).map((i: any) => ({
            id: i.id,
            type: 'installation' as const,
            customer_name: i.installation_fees?.customers?.name || 'Pelanggan Tidak Dikenal',
            amount: i.amount || 0,
            date: i.payment_date
        }));

        // Combine and sort by date
        const combined = [...txDetails, ...instDetails];
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return combined;

    } catch (error) {
        console.error("Error in getUndepositedDetails:", error);
        return [];
    }
}

// ============================================
// CREATE DEPOSIT
// ============================================

export async function createDeposit(
    collectorName: string,
    notes: string = "",
    evidenceUrl: string = "",
    selectedTransactionIds: number[] = [],
    selectedInstallationIds: number[] = []
): Promise<{ success: boolean; message: string; depositId?: number }> {
    const supabase = await createClient();

    try {
        // 1. Validate selection
        if (selectedTransactionIds.length === 0 && selectedInstallationIds.length === 0) {
            return {
                success: false,
                message: "Pilih minimal 1 transaksi untuk disetor"
            };
        }

        // 2. Calculate total from selected items
        let totalCash = 0;

        // Get selected transactions
        if (selectedTransactionIds.length > 0) {
            const { data: txData, error: txError } = await supabase
                .from("transactions")
                .select("total_amount")
                .in("id", selectedTransactionIds)
                .eq("method", "cash")
                .eq("is_deposited", false);

            if (txError) {
                console.error("Error fetching selected transactions:", txError);
            } else {
                totalCash += (txData || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);
            }
        }

        // Get selected installations
        if (selectedInstallationIds.length > 0) {
            const { data: instData, error: instError } = await supabase
                .from("installation_payments")
                .select("amount")
                .in("id", selectedInstallationIds)
                .eq("method", "cash")
                .eq("is_deposited", false);

            if (instError) {
                console.error("Error fetching selected installations:", instError);
            } else {
                totalCash += (instData || []).reduce((sum, i) => sum + (i.amount || 0), 0);
            }
        }

        if (totalCash === 0) {
            return {
                success: false,
                message: "Total setoran tidak boleh Rp 0"
            };
        }

        // 3. Insert into cash_deposits
        const { data: deposit, error: depositError } = await supabase
            .from("cash_deposits")
            .insert({
                collector_name: collectorName,
                total_cash: totalCash,
                total_transfer: 0,
                notes: notes,
                evidence_url: evidenceUrl || null
            })
            .select("id")
            .single();

        if (depositError || !deposit) {
            console.error("Error creating deposit:", depositError);
            return {
                success: false,
                message: "Gagal membuat setoran: " + depositError?.message
            };
        }

        const depositId = deposit.id;

        // 4. Update only selected transactions and installation_payments
        const updatePromises = [];

        if (selectedTransactionIds.length > 0) {
            updatePromises.push(
                supabase
                    .from("transactions")
                    .update({
                        is_deposited: true,
                        deposit_id: depositId
                    })
                    .in("id", selectedTransactionIds)
                    .eq("method", "cash")
                    .eq("is_deposited", false)
            );
        }

        if (selectedInstallationIds.length > 0) {
            updatePromises.push(
                supabase
                    .from("installation_payments")
                    .update({
                        is_deposited: true,
                        deposit_id: depositId
                    })
                    .in("id", selectedInstallationIds)
                    .eq("method", "cash")
                    .eq("is_deposited", false)
            );
        }

        const results = await Promise.all(updatePromises);

        results.forEach((result, index) => {
            if (result.error) {
                console.error(`Error updating ${index === 0 ? 'transactions' : 'installations'}:`, result.error);
            }
        });

        revalidatePath("/setoran");
        
        return {
            success: true,
            message: `Berhasil menyetor ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalCash)}`,
            depositId
        };

    } catch (error) {
        console.error("Error in createDeposit:", error);
        return {
            success: false,
            message: "Terjadi kesalahan saat membuat setoran"
        };
    }
}

// ============================================
// GET DEPOSIT HISTORY
// ============================================

export async function getDepositHistory(): Promise<DepositHistory[]> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("cash_deposits")
            .select("*")
            .order("deposit_date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching deposit history:", error);
            return [];
        }

        return (data || []).map(d => {
            const notes = d.notes || "";
            let type: 'air' | 'sr' | 'mixed' = 'mixed';
            if (notes.startsWith('[AIR]')) type = 'air';
            else if (notes.startsWith('[SR]')) type = 'sr';

            return {
                id: d.id,
                collector_name: d.collector_name,
                deposit_date: d.deposit_date,
                total_cash: d.total_cash || 0,
                notes: notes,
                evidence_url: d.evidence_url,
                created_at: d.created_at,
                type
            };
        });

    } catch (error) {
        console.error("Error in getDepositHistory:", error);
        return [];
    }
}

// ============================================
// DELETE DEPOSIT
// ============================================

export async function deleteDeposit(depositId: number): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    try {
        // 1. Reset is_deposited flag for related transactions
        const [txUpdate, instUpdate] = await Promise.all([
            supabase
                .from("transactions")
                .update({
                    is_deposited: false,
                    deposit_id: null
                })
                .eq("deposit_id", depositId),

            supabase
                .from("installation_payments")
                .update({
                    is_deposited: false,
                    deposit_id: null
                })
                .eq("deposit_id", depositId)
        ]);

        if (txUpdate.error) {
            console.error("Error resetting transactions:", txUpdate.error);
        }

        if (instUpdate.error) {
            console.error("Error resetting installation_payments:", instUpdate.error);
        }

        // 2. Delete the deposit record
        const { error: deleteError } = await supabase
            .from("cash_deposits")
            .delete()
            .eq("id", depositId);

        if (deleteError) {
            console.error("Error deleting deposit:", deleteError);
            return {
                success: false,
                message: "Gagal menghapus setoran: " + deleteError.message
            };
        }

        revalidatePath("/setoran");
        
        return {
            success: true,
            message: "Setoran berhasil dihapus"
        };

    } catch (error) {
        console.error("Error in deleteDeposit:", error);
        return {
            success: false,
            message: "Terjadi kesalahan saat menghapus setoran"
        };
    }
}

// === UNIFIED DATA FUNCTION (OPTIMIZED) ===
export async function getUnifiedSetoranData() {
    try {
        const [summaryResult, historyResult, detailsResult] = await Promise.all([
            getUndepositedSummary(),
            getDepositHistory(),
            getUndepositedDetails()
        ]);

        return {
            summary: summaryResult,
            history: historyResult,
            details: detailsResult
        };
    } catch (error) {
        console.error("Error in getUnifiedSetoranData:", error);
        return {
            summary: { total_amount: 0, transaction_amount: 0, installation_amount: 0, transaction_count: 0, installation_count: 0, total_count: 0 },
            history: [],
            details: []
        };
    }
}
