"use server";

import { supabase } from "@/lib/supabase";

// --- DASHBOARD ACTIONS (Refactored for New Schema) ---
// Schema context:
// customers (id, name, status, credit_balance, area_id)
// meter_records (id, customer_id, month, year, usage [gen], bill_amount [gen], paid_amount, status)
// transactions (id, total_amount, method, created_at, customer:customers(name))
// areas (id, name)

export async function getDashboardStats() {
    try {
        // 1. Active Customers
        const { count: activeCustomers } = await supabase
            .from("customers")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");

        // 2. Arrears & Usage (Aggregating all meter_records)
        // Note: For large datasets, this aggregation should be improved via RPC or monthly summary table.
        // For now, client-side aggregation of recent records is acceptable or simpler queries.

        // We fetch ALL unpaid or partial records for arrears, but ONLY for active customers
        const { data: unpaidRecords } = await supabase
            .from("meter_records")
            .select("bill_amount, paid_amount, customers!inner(status)")
            .neq("status", "paid")
            .eq("customers.status", "active");

        let totalArrears = 0;
        if (unpaidRecords) {
            unpaidRecords.forEach(r => {
                totalArrears += (r.bill_amount - r.paid_amount);
            });
        }

        // 3. TARGET MONTH CALCULATION (Previous Month)
        // User logic: "Pakai dulu baru catat", so we track the completion of the previous month's recording.
        const date = new Date();
        const currentMonth = date.getMonth() + 1;
        const currentYear = date.getFullYear();

        let targetMonth = currentMonth - 1;
        let targetYear = currentYear;
        if (targetMonth === 0) {
            targetMonth = 12;
            targetYear = currentYear - 1;
        }

        // 4. Total Usage (Based on TARGET MONTH)
        const { data: targetMonthRecords } = await supabase
            .from("meter_records")
            .select("meter_current, meter_last")
            .eq("month", targetMonth)
            .eq("year", targetYear);

        let totalUsage = 0;
        if (targetMonthRecords) {
            targetMonthRecords.forEach(r => {
                totalUsage += (r.meter_current - r.meter_last);
            });
        }

        const { count: recordedCountVal } = await supabase
            .from("meter_records")
            .select("*", { count: 'exact', head: true })
            .eq("month", targetMonth)
            .eq("year", targetYear);

        const recordedCount = recordedCountVal || 0;
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const targetPeriodName = `${months[targetMonth - 1]} ${targetYear}`;

        return {
            activeCustomers: activeCustomers || 0,
            totalArrears,
            totalUsage, 
            recordedCount,
            targetPercentage: activeCustomers ? Math.round((recordedCount / activeCustomers) * 100) : 0,
            targetPeriodName
        };
    } catch (error) {
        console.error("Dashboard stats error", error);
        return {
            activeCustomers: 0,
            totalArrears: 0,
            totalUsage: 0,
            recordedCount: 0,
            targetPercentage: 0,
            targetPeriodName: "-"
        };
    }
}

export async function getPeriodRevenueStats() {
    // We use the `transactions` table for revenue stats as it tracks actual money IN.
    const today = new Date();
    // const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
    // const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

    const { data: txs, error } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .gte("created_at", startOfYear);

    if (error || !txs) return { daily: 0, monthly: 0, yearly: 0 };

    let daily = 0;
    let monthly = 0;
    let yearly = 0;

    // Helper to check date parts (since created_at is ISO string)
    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    txs.forEach(t => {
        const amt = t.total_amount || 0;
        const tDate = t.created_at.split('T')[0]; // YYYY-MM-DD
        const tMonth = tDate.substring(0, 7); // YYYY-MM

        yearly += amt;
        if (tMonth === thisMonthStr) monthly += amt;
        if (tDate === todayStr) daily += amt;
    });

    return { daily, monthly, yearly };
}

export async function getRevenueTrend() {
    // Last 6 months revenue trend based on Transactions
    const { data: txs } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .order("created_at", { ascending: true });

    if (!txs || txs.length === 0) {
        // Return last 6 months with zero values
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        const today = new Date();
        const result = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            result.push({
                name: `${months[d.getMonth()]} ${d.getFullYear()}`,
                value: 0
            });
        }
        return result;
    }

    const grouped: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

    txs.forEach(t => {
        const date = new Date(t.created_at);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`; // "Jan 2026"
        grouped[key] = (grouped[key] || 0) + t.total_amount;
    });

    // Convert to array with 'value' key (not 'total')
    const result = Object.entries(grouped).map(([name, value]) => ({ name, value }));

    // Return last 6 months
    return result.slice(-6);
}

export async function getTopDebtors() {
    // Find customers with unpaid meter_records (arrears)
    // We need to sum up arrears per customer

    // Fetch all unpaid bills with customer info
    const { data, error } = await supabase
        .from("meter_records")
        .select(`
            bill_amount, 
            paid_amount, 
            customer:customers!inner(id, name, status, area:areas(name))
        `)
        .neq("status", "paid")
        .eq("customer.status", "active");

    if (error || !data) return [];

    const debtMap: Record<number, { id: string, name: string, area: string, amount: number }> = {};

    data.forEach((r: any) => {
        if (!r.customer) return;
        const cid = r.customer.id;
        const debt = (r.bill_amount - r.paid_amount);

        if (!debtMap[cid]) {
            debtMap[cid] = {
                id: cid,
                name: r.customer.name,
                area: r.customer.area?.name || "-",
                amount: 0
            };
        }
        debtMap[cid].amount += debt;
    });

    return Object.values(debtMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
}

export async function getPaymentMethods() {
    // From transactions table
    const { data } = await supabase.from("transactions").select("method");

    if (!data || data.length === 0) {
        return [
            { name: "Tunai", value: 0, fill: "#6366f1" },
            { name: "Transfer", value: 0, fill: "#10b981" }
        ];
    }

    let cash = 0;
    let transfer = 0;

    data.forEach(t => {
        if (t.method === "transfer") transfer++;
        else cash++;
    });

    return [
        { name: "Tunai", value: cash, fill: "#6366f1" },
        { name: "Transfer", value: transfer, fill: "#10b981" }
    ];
}

export async function getRecentActivity() {
    // Fetch recent transaction logs + maybe generic logs if we had them.
    // For now, fetch transactions as activity.
    const { data, error } = await supabase
        .from("transactions")
        .select(`
            *,
            customer:customers(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error || !data) return [];

    return data.map((t: any) => ({
        user: t.customer?.name || "Unknown",
        action: `Bayar Tagihan ${t.method}`,
        time: new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        avatar: (t.customer?.name || "U").substring(0, 2).toUpperCase(),
        color: t.method === 'cash' ? "bg-emerald-500" : "bg-blue-500"
    }));
}

export async function getPaymentStatusStats() {
    const date = new Date();
    const currentYear = date.getFullYear();

    // Get counts for current year
    const { data: records, error } = await supabase
        .from("meter_records")
        .select("status, customers!inner(status)")
        .eq("year", currentYear)
        .eq("customers.status", "active");

    if (error || !records) {
        return {
            paid: 0,
            unpaid: 0,
            total: 0,
            percentage: 0
        };
    }

    let paid = 0;
    let unpaid = 0;

    records.forEach(r => {
        if (r.status === 'paid') paid++;
        else unpaid++;
    });

    const total = paid + unpaid;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

    return {
        paid,
        unpaid,
        total,
        percentage
    };
}

export async function getPaymentStatistics(year: number) {
    // Fetch all meter records for the selected year
    const { data: records, error } = await supabase
        .from("meter_records")
        .select("month, bill_amount, paid_amount, customers!inner(status)")
        .eq("year", year)
        .eq("customers.status", "active");

    if (error || !records) {
        // Return empty data if error
        return {
            monthly: Array(12).fill({ name: "", total_bill: 0, paid: 0, unpaid: 0 }),
            summary: { totalBill: 0, totalPaid: 0, totalUnpaid: 0 }
        };
    }

    // Initialize 12 months data
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const monthlyData = months.map(m => ({ name: m, total_bill: 0, paid: 0, unpaid: 0 }));

    let totalBillYearly = 0;
    let totalPaidYearly = 0;

    records.forEach(r => {
        const mIndex = r.month - 1; // month is 1-12
        if (mIndex >= 0 && mIndex < 12) {
            const bill = r.bill_amount || 0;
            const paid = r.paid_amount || 0;

            monthlyData[mIndex].total_bill += bill;
            monthlyData[mIndex].paid += paid;

            totalBillYearly += bill;
            totalPaidYearly += paid;
        }
    });

    // Calculate unpaid for each month and format
    const formattedData = monthlyData.map(m => ({
        ...m,
        unpaid: m.total_bill - m.paid
    }));

    return {
        monthly: formattedData,
        summary: {
            totalBill: totalBillYearly,
            totalPaid: totalPaidYearly,
            totalUnpaid: totalBillYearly - totalPaidYearly
        }
    };
}
