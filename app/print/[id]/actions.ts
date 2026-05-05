"use server";

import { createClient } from "@/lib/supabase/server";

export type PrintData = {
    transactionId: number;
    paymentDate: string;
    customerName: string;
    customerNumber: string;
    customerAddress: string;
    method: "cash" | "transfer";
    totalPaid: number;
    appliedCredit: number;
    newCredit: number;
    details: {
        month: number;
        year: number;
        amount: number; // Amount paid for this bill in this transaction
        usage: number;
        meterLast: number;
        meterCurrent: number;
        waterCost: number;
        maintenanceCost: number;
        billAmount: number; // Total original bill amount
    }[];
};

export async function getPrintData(transactionId: number): Promise<PrintData | null> {
    const supabase = await createClient();

    // 1. Fetch Transaction
    const { data: tx, error: txError } = await supabase
        .from("transactions")
        .select(`
            id,
            payment_date,
            created_at,
            total_amount,
            method,
            applied_credit,
            new_credit,
            allocation_details,
            customers (
                name,
                connection_number,
                address
            )
        `)
        .eq("id", transactionId)
        .single();

    if (txError || !tx) {
        console.error("Error fetching transaction for print:", txError);
        return null;
    }

    // 2. Parse Allocation Details
    let allocationDetails: any[] = [];
    if (Array.isArray(tx.allocation_details)) {
        allocationDetails = tx.allocation_details;
    } else if (typeof tx.allocation_details === 'string') {
        try {
            allocationDetails = JSON.parse(tx.allocation_details);
        } catch (e) {
            console.error("Error parsing allocation_details", e);
        }
    }

    const billIds = allocationDetails.map(d => d.bill_id || d.record_id).filter(Boolean);

    // 3. Fetch Meter Records for these bills
    let meterRecordsMap: Record<number, any> = {};
    if (billIds.length > 0) {
        const { data: records } = await supabase
            .from("meter_records")
            .select("*")
            .in("id", billIds);

        if (records) {
            records.forEach(r => {
                meterRecordsMap[r.id] = r;
            });
        }
    }

    // 4. Assemble Details
    const details = allocationDetails.map(detail => {
        const recordId = detail.bill_id || detail.record_id;
        const record = meterRecordsMap[recordId];

        // If record exists, use its data. If not, fallback to basic info
        return {
            month: detail.month || record?.month || 0,
            year: detail.year || record?.year || 0,
            amount: detail.amount || 0,
            usage: record?.usage || 0,
            meterLast: record?.meter_last || 0,
            meterCurrent: record?.meter_current || 0,
            waterCost: record ? (record.usage * record.rate_snapshot) : 0,
            maintenanceCost: record?.maintenance_snapshot || 0,
            billAmount: record?.bill_amount || 0,
        };
    });

    return {
        transactionId: tx.id,
        paymentDate: tx.payment_date || tx.created_at,
        customerName: (tx.customers as any)?.name || "Unknown",
        customerNumber: (tx.customers as any)?.connection_number || "-",
        customerAddress: (tx.customers as any)?.address || "-",
        method: tx.method,
        totalPaid: tx.total_amount,
        appliedCredit: tx.applied_credit,
        newCredit: tx.new_credit,
        details
    };
}
