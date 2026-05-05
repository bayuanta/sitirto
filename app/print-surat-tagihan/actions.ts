"use server";

import { createClient } from "@/lib/supabase/server";

export type DunningLetterData = {
    customerId: number;
    customerName: string;
    connectionNumber: string;
    address: string;
    areaName: string;
    totalArrears: number;
    monthsCount: number;
    arrearRecords: Array<{
        month: number;
        year: number;
        outstanding: number;
    }>;
};

export async function getDunningLettersData(ids: number[]): Promise<DunningLetterData[]> {
    const supabase = await createClient();

    try {
        const { data: records, error } = await supabase
            .from("meter_records")
            .select(`
                id,
                month,
                year,
                bill_amount,
                paid_amount,
                status,
                customer:customers (
                    id,
                    name,
                    connection_number,
                    address,
                    area:areas (name)
                )
            `)
            .in("customer_id", ids)
            .neq("status", "paid")
            .order("year", { ascending: true })
            .order("month", { ascending: true });

        if (error || !records) {
            console.error("Error fetching dunning letters data:", error);
            return [];
        }

        // Group by customer
        const customerMap: Record<string, DunningLetterData> = {};

        records.forEach((r: any) => {
            const custId = r.customer?.id?.toString();
            if (!custId) return;

            const outstanding = (r.bill_amount || 0) - (r.paid_amount || 0);

            if (!customerMap[custId]) {
                customerMap[custId] = {
                    customerId: r.customer.id,
                    customerName: r.customer.name || "Pelanggan",
                    connectionNumber: r.customer.connection_number || "-",
                    address: r.customer.address || "-",
                    areaName: r.customer.area?.name || "-",
                    totalArrears: 0,
                    monthsCount: 0,
                    arrearRecords: []
                };
            }

            customerMap[custId].totalArrears += outstanding;
            customerMap[custId].monthsCount += 1;
            customerMap[custId].arrearRecords.push({
                month: r.month,
                year: r.year,
                outstanding
            });
        });

        // Return data in the order of requested IDs if possible, or at least consistently
        return ids.map(id => customerMap[id.toString()]).filter(Boolean);

    } catch (error) {
        console.error("Error in getDunningLettersData:", error);
        return [];
    }
}
