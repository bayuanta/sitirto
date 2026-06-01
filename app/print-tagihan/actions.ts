"use server";

import { createClient } from "@/lib/supabase/server";

export type PrintBillData = {
    printDate: string;
    customerName: string;
    customerNumber: string;
    customerAddress: string;
    totalAmount: number;
    details: {
        month: number;
        year: number;
        usage: number;
        meterLast: number;
        meterCurrent: number;
        billAmount: number;
        remaining: number;
    }[];
};

export async function getBillsForPrint(billIds: number[]): Promise<PrintBillData | null> {
    const supabase = await createClient();

    if (!billIds || billIds.length === 0) return null;

    const { data: records, error } = await supabase
        .from("meter_records")
        .select(`
            id,
            month,
            year,
            usage,
            meter_last,
            meter_current,
            bill_amount,
            paid_amount,
            customer:customers (
                name,
                connection_number,
                address
            )
        `)
        .in("id", billIds)
        .order("year", { ascending: true })
        .order("month", { ascending: true });

    if (error || !records || records.length === 0) {
        console.error("Error fetching bills for print:", error);
        return null;
    }

    let totalAmount = 0;
    const details = records.map((r: any) => {
        const remaining = r.bill_amount - (r.paid_amount || 0);
        totalAmount += remaining;
        return {
            month: r.month,
            year: r.year,
            usage: r.usage,
            meterLast: r.meter_last,
            meterCurrent: r.meter_current,
            billAmount: r.bill_amount,
            remaining: remaining
        };
    });

    const customer = records[0].customer as any;

    return {
        printDate: new Date().toISOString(),
        customerName: customer?.name || "Unknown",
        customerNumber: customer?.connection_number || "-",
        customerAddress: customer?.address || "-",
        totalAmount,
        details
    };
}
