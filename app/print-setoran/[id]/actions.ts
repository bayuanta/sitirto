"use server";

import { createClient } from "@/lib/supabase/server";

export type PrintSetoranDetail = {
    customerName: string;
    connectionNumber: string;
    date: string;
    amount: number;
    transactionId: number;
};

export type PrintSetoranData = {
    id: number;
    type: 'air' | 'sr';
    collectorName: string;
    depositDate: string;
    totalCash: number;
    notes: string;
    createdAt: string;
    details: PrintSetoranDetail[];
};

export async function getDepositPrintData(id: number): Promise<PrintSetoranData | null> {
    const supabase = await createClient();

    try {
        // 1. Fetch the deposit record
        const { data: deposit, error: depositError } = await supabase
            .from("cash_deposits")
            .select("*")
            .eq("id", id)
            .single();

        if (depositError || !deposit) {
            console.error("Error fetching deposit:", depositError);
            return null;
        }

        const notes = deposit.notes || "";
        const isAir = notes.startsWith("[AIR]");
        const type = isAir ? 'air' : 'sr';

        let details: PrintSetoranDetail[] = [];

        // 2. Fetch related transactions
        if (isAir) {
            const { data: transactions, error: txError } = await supabase
                .from("transactions")
                .select(`
                    id,
                    total_amount,
                    created_at,
                    customers (
                        name,
                        connection_number
                    )
                `)
                .eq("deposit_id", id)
                .order("created_at", { ascending: true });

            if (!txError && transactions) {
                details = transactions.map((t: any) => ({
                    customerName: t.customers?.name || "Unknown",
                    connectionNumber: t.customers?.connection_number || "-",
                    date: t.created_at,
                    amount: t.total_amount || 0,
                    transactionId: t.id
                }));
            }
        } else {
            const { data: installations, error: instError } = await supabase
                .from("installation_payments")
                .select(`
                    id,
                    amount,
                    payment_date,
                    installation_fees (
                        customers (
                            name,
                            connection_number
                        )
                    )
                `)
                .eq("deposit_id", id)
                .order("payment_date", { ascending: true });

            if (!instError && installations) {
                details = installations.map((i: any) => ({
                    customerName: i.installation_fees?.customers?.name || "Unknown",
                    connectionNumber: i.installation_fees?.customers?.connection_number || "-",
                    date: i.payment_date,
                    amount: i.amount || 0,
                    transactionId: i.id
                }));
            }
        }

        return {
            id: deposit.id,
            type,
            collectorName: deposit.collector_name,
            depositDate: deposit.deposit_date,
            totalCash: deposit.total_cash || 0,
            notes: deposit.notes || "",
            createdAt: deposit.created_at,
            details
        };

    } catch (error) {
        console.error("Error in getDepositPrintData:", error);
        return null;
    }
}
