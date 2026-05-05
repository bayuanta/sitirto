"use server";

import { createClient } from "@/lib/supabase/server";

export type DisconnectionNoticeData = {
    customer: {
        id: number;
        name: string;
        connectionNumber: string;
        address: string;
        areaName: string;
    };
    waterArrears: {
        month: number;
        year: number;
        amount: number;
    }[];
    totalWaterArrears: number;
    installationArrears: number;
    grandTotal: number;
};

export async function getDisconnectionNoticeData(customerId: number): Promise<DisconnectionNoticeData | null> {
    const supabase = await createClient();

    try {
        // 1. Fetch Customer and Area
        const { data: cust, error: custError } = await supabase
            .from("customers")
            .select(`
                id,
                name,
                connection_number,
                address,
                area:areas (name)
            `)
            .eq("id", customerId)
            .single();

        if (custError || !cust) {
            console.error("Error fetching customer for disconnection notice:", custError);
            return null;
        }

        // 2. Fetch Unpaid Water Bills (meter_records)
        const { data: records, error: recError } = await supabase
            .from("meter_records")
            .select("month, year, bill_amount, paid_amount")
            .eq("customer_id", customerId)
            .neq("status", "paid")
            .order("year", { ascending: true })
            .order("month", { ascending: true });

        const waterArrears = (records || []).map((r: any) => ({
            month: r.month,
            year: r.year,
            amount: (r.bill_amount || 0) - (r.paid_amount || 0)
        }));
        const totalWaterArrears = waterArrears.reduce((sum, r) => sum + r.amount, 0);

        // 3. Fetch Installation Arrears
        const { data: fee, error: feeError } = await supabase
            .from("installation_fees")
            .select("remaining_amount")
            .eq("customer_id", customerId)
            .single();
        
        const installationArrears = fee?.remaining_amount || 0;

        return {
            customer: {
                id: cust.id,
                name: cust.name,
                connectionNumber: cust.connection_number,
                address: cust.address,
                areaName: (cust as any).area?.name || "-"
            },
            waterArrears,
            totalWaterArrears,
            installationArrears,
            grandTotal: totalWaterArrears + installationArrears
        };

    } catch (error) {
        console.error("Error in getDisconnectionNoticeData:", error);
        return null;
    }
}
