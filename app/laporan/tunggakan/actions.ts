"use server";

import { createClient } from "@/lib/supabase/server";

// Date range filter type
interface DateRangeFilter {
    startMonth?: number;
    startYear?: number;
    endMonth?: number;
    endYear?: number;
}

// Helper to build date range condition
function isInDateRange(month: number, year: number, filter?: DateRangeFilter): boolean {
    if (!filter?.startMonth || !filter?.startYear || !filter?.endMonth || !filter?.endYear) {
        return true; // No filter = include all
    }

    const recordDate = year * 12 + month;
    const startDate = filter.startYear * 12 + filter.startMonth;
    const endDate = filter.endYear * 12 + filter.endMonth;

    return recordDate >= startDate && recordDate <= endDate;
}

// === SUMMARY STATS ===
export async function getArrearsSummary(dateFilter?: DateRangeFilter) {
    const supabase = await createClient();

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
                area:areas (name)
            )
        `)
        .neq("status", "paid");

    if (error || !records) {
        console.error("Error fetching arrears summary", error);
        return {
            totalArrears: 0,
            totalCustomers: 0,
            totalRecords: 0,
            byStatus: { unpaid: 0, partial: 0 }
        };
    }

    let totalArrears = 0;
    const customerSet = new Set<number>();
    let unpaidCount = 0;
    let partialCount = 0;

    records.forEach((r: any) => {
        // Apply date filter
        if (!isInDateRange(r.month, r.year, dateFilter)) return;

        const outstanding = (r.bill_amount || 0) - (r.paid_amount || 0);
        totalArrears += outstanding;

        if (r.customer?.id) customerSet.add(r.customer.id);

        if (r.status === 'unpaid') unpaidCount++;
        else if (r.status === 'partial') partialCount++;
    });

    return {
        totalArrears,
        totalCustomers: customerSet.size,
        totalRecords: unpaidCount + partialCount,
        byStatus: { unpaid: unpaidCount, partial: partialCount }
    };
}

// === ARREARS BY AREA ===
export async function getArrearsByArea(dateFilter?: DateRangeFilter) {
    const supabase = await createClient();

    const { data: records, error } = await supabase
        .from("meter_records")
        .select(`
            month,
            year,
            bill_amount,
            paid_amount,
            customer:customers (
                area:areas (name)
            )
        `)
        .neq("status", "paid");

    if (error || !records) return [];

    const areaMap: Record<string, { amount: number; count: number }> = {};

    records.forEach((r: any) => {
        // Apply date filter
        if (!isInDateRange(r.month, r.year, dateFilter)) return;

        const outstanding = (r.bill_amount || 0) - (r.paid_amount || 0);
        const areaName = r.customer?.area?.name || "Lain-lain";

        if (!areaMap[areaName]) areaMap[areaName] = { amount: 0, count: 0 };
        areaMap[areaName].amount += outstanding;
        areaMap[areaName].count += 1;
    });

    const total = Object.values(areaMap).reduce((sum, a) => sum + a.amount, 0);

    return Object.entries(areaMap)
        .map(([name, data]) => ({
            name,
            amount: data.amount,
            count: data.count,
            percentage: total > 0 ? parseFloat(((data.amount / total) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.amount - a.amount);
}

// === ARREARS BY MONTH (Aging) ===
export async function getArrearsByAge(dateFilter?: DateRangeFilter) {
    const supabase = await createClient();
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const { data: records, error } = await supabase
        .from("meter_records")
        .select("month, year, bill_amount, paid_amount")
        .neq("status", "paid");

    if (error || !records) return [];

    // Calculate months old
    const aging = {
        "1 Bulan": 0,
        "2-3 Bulan": 0,
        "4-6 Bulan": 0,
        "7-12 Bulan": 0,
        "> 12 Bulan": 0
    };

    records.forEach((r: any) => {
        // Apply date filter
        if (!isInDateRange(r.month, r.year, dateFilter)) return;

        const outstanding = (r.bill_amount || 0) - (r.paid_amount || 0);
        const monthsOld = (currentYear - r.year) * 12 + (currentMonth - r.month);

        if (monthsOld <= 1) aging["1 Bulan"] += outstanding;
        else if (monthsOld <= 3) aging["2-3 Bulan"] += outstanding;
        else if (monthsOld <= 6) aging["4-6 Bulan"] += outstanding;
        else if (monthsOld <= 12) aging["7-12 Bulan"] += outstanding;
        else aging["> 12 Bulan"] += outstanding;
    });

    return Object.entries(aging).map(([range, amount]) => ({
        range,
        amount,
        color: range === "1 Bulan" ? "#10b981" :
            range === "2-3 Bulan" ? "#f59e0b" :
                range === "4-6 Bulan" ? "#f97316" :
                    range === "7-12 Bulan" ? "#ef4444" : "#991b1b"
    }));
}

// === DETAILED ARREARS LIST ===
export async function getArrearsDetailList(dateFilter?: DateRangeFilter) {
    const supabase = await createClient();

    let query = supabase
        .from("meter_records")
        .select(`
            id,
            month,
            year,
            bill_amount,
            paid_amount,
            status,
            usage,
            customer:customers (
                id,
                name,
                connection_number,
                phone,
                area_id,
                area:areas (id, name)
            )
        `)
        .neq("status", "paid");

    const { data, error } = await query.order("year", { ascending: true }).order("month", { ascending: true });

    if (error || !data) return [];

    // Process and group by customer
    const customerMap: Record<string, {
        customerId: number;
        customerName: string;
        connectionNumber: string;
        phone: string;
        areaId: number;
        areaName: string;
        totalArrears: number;
        arrearRecords: Array<{
            recordId: number;
            month: number;
            year: number;
            billAmount: number;
            paidAmount: number;
            outstanding: number;
            status: string;
            usage: number;
        }>;
        oldestMonth: string;
        monthsCount: number;
    }> = {};

    const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];

    data.forEach((r: any) => {
        // Apply date filter
        if (!isInDateRange(r.month, r.year, dateFilter)) return;

        const custId = r.customer?.id?.toString() || 'unknown';
        const outstanding = (r.bill_amount || 0) - (r.paid_amount || 0);

        if (!customerMap[custId]) {
            customerMap[custId] = {
                customerId: r.customer?.id || 0,
                customerName: r.customer?.name || "Unknown",
                connectionNumber: r.customer?.connection_number || "-",
                phone: r.customer?.phone || "-",
                areaId: r.customer?.area?.id || 0,
                areaName: r.customer?.area?.name || "-",
                totalArrears: 0,
                arrearRecords: [],
                oldestMonth: `${months[r.month - 1]} ${r.year}`,
                monthsCount: 0
            };
        }

        customerMap[custId].totalArrears += outstanding;
        customerMap[custId].monthsCount += 1;
        customerMap[custId].arrearRecords.push({
            recordId: r.id,
            month: r.month,
            year: r.year,
            billAmount: r.bill_amount,
            paidAmount: r.paid_amount,
            outstanding,
            status: r.status,
            usage: r.usage
        });
    });

    let result = Object.values(customerMap);

    // Default: sort by total arrears desc
    result.sort((a, b) => b.totalArrears - a.totalArrears);

    return result;
}

// === GET ALL AREAS (for filter) ===
export async function getAreasList() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("areas")
        .select("id, name")
        .order("name");

    if (error || !data) return [];
    return data;
}

// === TOP DEBTORS ===
export async function getTopDebtors(limit: number = 10, dateFilter?: DateRangeFilter) {
    const supabase = await createClient();

    const { data: records, error } = await supabase
        .from("meter_records")
        .select(`
            month,
            year,
            bill_amount,
            paid_amount,
            customer:customers (
                id,
                name,
                connection_number,
                area:areas (name)
            )
        `)
        .neq("status", "paid");

    if (error || !records) return [];

    const customerMap: Record<string, {
        id: number;
        name: string;
        connectionNumber: string;
        area: string;
        totalArrears: number;
        recordsCount: number;
    }> = {};

    records.forEach((r: any) => {
        // Apply date filter
        if (!isInDateRange(r.month, r.year, dateFilter)) return;

        const custId = r.customer?.id?.toString() || 'unknown';
        const outstanding = (r.bill_amount || 0) - (r.paid_amount || 0);

        if (!customerMap[custId]) {
            customerMap[custId] = {
                id: r.customer?.id || 0,
                name: r.customer?.name || "Unknown",
                connectionNumber: r.customer?.connection_number || "-",
                area: r.customer?.area?.name || "-",
                totalArrears: 0,
                recordsCount: 0
            };
        }

        customerMap[custId].totalArrears += outstanding;
        customerMap[custId].recordsCount += 1;
    });

    return Object.values(customerMap)
        .sort((a, b) => b.totalArrears - a.totalArrears)
        .slice(0, limit);
}
