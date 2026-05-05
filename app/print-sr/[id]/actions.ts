"use server";

import { createClient } from "@/lib/supabase/server";

export type PrintSRData = {
    paymentId: number;
    amount: number;
    paymentDate: string;
    method: string;
    customerName: string;
    customerNumber: string;
    customerAddress: string;
    totalFee: number;
    paidAmount: number;
    remainingAmount: number;
};

export async function getPrintSRData(id: number): Promise<PrintSRData | null> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("installation_payments")
            .select(`
                id,
                amount,
                payment_date,
                method,
                installation_fees (
                    total_amount,
                    paid_amount,
                    remaining_amount,
                    customers (
                        name,
                        connection_number,
                        address
                    )
                )
            `)
            .eq("id", id)
            .single();

        if (error || !data) {
            console.error("Error fetching SR payment for print:", error);
            return null;
        }

        const fee = data.installation_fees as any;
        const cust = fee?.customers;

        return {
            paymentId: data.id,
            amount: data.amount,
            paymentDate: data.payment_date,
            method: data.method || "cash",
            customerName: cust?.name || "Unknown",
            customerNumber: cust?.connection_number || "-",
            customerAddress: cust?.address || "-",
            totalFee: fee?.total_amount || 0,
            paidAmount: fee?.paid_amount || 0,
            remainingAmount: fee?.remaining_amount || 0,
        };

    } catch (error) {
        console.error("Error getPrintSRData:", error);
        return null;
    }
}
