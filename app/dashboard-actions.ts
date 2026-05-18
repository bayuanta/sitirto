"use server";

import { createClient } from "@/lib/supabase/server";

// areas (id, name)
export type DashboardData = {
    stats: {
        activeCustomers: number;
        totalArrears: number;
        totalUsage: number;
        recordedCount: number;
        targetPercentage: number;
        targetPeriodName: string;
        installationArrears: number;
    };
    revenue: {
        daily: number;
        monthly: number;
        yearly: number;
    };
    trend: { name: string; value: number }[];
    topDebtors: { id: number; name: string; area: string; amount: number }[];
    paymentMethods: { name: string; value: number; fill: string }[];
    activity: { user: string; action: string; time: string; avatar: string; color: string }[];
    paymentStatus: {
        paid: number;
        unpaid: number;
        total: number;
        percentage: number;
    };
    chartData: {
        monthly: { name: string; total_bill: number; paid: number; unpaid: number }[];
        summary: { totalBill: number; totalPaid: number; totalUnpaid: number };
    };
};

export async function getUnifiedDashboardData(year: number = new Date().getFullYear()): Promise<DashboardData> {
    try {
        const date = new Date();
        const currentMonth = date.getMonth() + 1;
        const currentYear = date.getFullYear();
        const todayStr = date.toISOString().split('T')[0];
        const thisMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        const startOfYear = `${year}-01-01T00:00:00Z`;

        // 1. Calculate Target Month (Previous Month)
        let targetMonth = currentMonth - 1;
        let targetYear = currentYear;
        if (targetMonth === 0) {
            targetMonth = 12;
            targetYear = currentYear - 1;
        }
        const monthsNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        const targetPeriodName = `${monthsNames[targetMonth - 1]} ${targetYear}`;

        const supabase = await createClient();

        // RUN QUERIES IN PARALLEL
        const [
            { count: activeCustomersCount },
            { data: transactions },
            { data: unpaidRecords },
            { data: currentYearRecords },
            { data: installationFees }
        ] = await Promise.all([
            // Q1: Active Customers Count
            supabase.from("customers").select("*", { count: "exact", head: true }).eq("status", "active"),
            
            // Q2: Transactions (Specific Year) - Excluding Legacy Data Migration
            supabase.from("transactions")
                .select("total_amount, method, created_at, customer:customers(name)")
                .gte("created_at", `${year}-01-01T00:00:00Z`)
                .lt("created_at", `${year + 1}-01-01T00:00:00Z`)
                .neq("notes", "Migrasi Data Historis")
                .order("created_at", { ascending: false })
                .limit(10000),

            // Q3a: Unpaid Records (For Arrears Calculation)
            supabase.from("meter_records")
                .select(`
                    month, year, status, bill_amount, paid_amount,
                    customer:customers!inner(id, name, status, area:areas(name))
                `)
                .neq("status", "paid")
                .eq("customers.status", "active")
                .limit(10000),

            // Q3b: Current Year Records (For Dashboard Charts & Usage)
            supabase.from("meter_records")
                .select(`
                    month, year, status, meter_current, meter_last, bill_amount, paid_amount,
                    customer:customers!inner(id, name, status)
                `)
                .eq("year", year)
                .eq("customers.status", "active")
                .limit(10000),

            // Q4: Installation Fees (Unpaid)
            supabase.from("installation_fees")
                .select(`total_amount, paid_amount, customers!inner(status)`)
                .eq("customers.status", "active")
                .neq("status", "paid")
        ]);

        const activeCustomers = activeCustomersCount || 0;
        const txs = transactions || [];
        const arrearsData = unpaidRecords || [];
        const currentData = currentYearRecords || [];

        // --- 1. KPI STATS & ARREARS ---
        let totalArrears = 0;
        let totalUsage = 0;
        let recordedCount = 0;
        const debtMap: Record<number, { id: number, name: string, area: string, amount: number }> = {};

        // Calculate Arrears from purely Unpaid records
        arrearsData.forEach((r: any) => {
            const bill = r.bill_amount || 0;
            const paid = r.paid_amount || 0;
            const debt = bill - paid;

            totalArrears += debt;
            
            // Top Debtors grouping
            const cid = r.customer.id;
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

        // Calculate Usage & Record Count from Current Year records
        currentData.forEach((r: any) => {
            if (r.month === targetMonth && r.year === targetYear) {
                totalUsage += (r.meter_current - r.meter_last);
                recordedCount++;
            }
        });

        // --- 1b. INSTALLATION ARREARS ---
        let installationArrears = 0;
        if (installationFees) {
            installationFees.forEach((f: any) => {
                installationArrears += (f.total_amount - f.paid_amount);
            });
        }

        // --- 2. REVENUE & TRENDS (From Transactions) ---
        let dailyRev = 0;
        let monthlyRev = 0;
        let yearlyRev = 0;
        let cashCount = 0;
        let transferCount = 0;
        const trendGrouped: Record<string, number> = {};

        txs.forEach((t: any) => {
            const amt = t.total_amount || 0;
            const tDateISO = t.created_at;
            const tDate = tDateISO.split('T')[0];
            const tMonth = tDate.substring(0, 7);
            const dateObj = new Date(tDateISO);

            // Period Revenue
            yearlyRev += amt;
            if (tMonth === thisMonthStr) monthlyRev += amt;
            if (tDate === todayStr) dailyRev += amt;

            // Payment Methods
            if (t.method === 'transfer') transferCount++;
            else cashCount++;

            // Trend (Last 6 Months)
            const trendKey = `${monthsShort[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
            trendGrouped[trendKey] = (trendGrouped[trendKey] || 0) + amt;
        });

        // Format Trend
        const trend = Object.entries(trendGrouped)
            .map(([name, value]) => ({ name, value }))
            .slice(-6);

        // --- 3. ACTIVITY (From Transactions) ---
        const activity = txs.slice(0, 5).map((t: any) => ({
            user: t.customer?.name || "Unknown",
            action: `Bayar Tagihan ${t.method === 'cash' ? 'Tunai' : 'Transfer'}`,
            time: new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            avatar: (t.customer?.name || "U").substring(0, 2).toUpperCase(),
            color: t.method === 'cash' ? "bg-emerald-500" : "bg-blue-500"
        }));

        // --- 4. PAYMENT STATUS & CHART (From Meter Records of selected Year) ---
        let paidCount = 0;
        let unpaidCount = 0;
        const monthlyChart = monthsShort.map(m => ({ name: m, total_bill: 0, paid: 0, unpaid: 0 }));
        let totalBillYearly = 0;
        let totalPaidYearlyFromRecords = 0;

        currentData.forEach((r: any) => {
            if (r.year === year) {
                const bill = r.bill_amount || 0;
                const paid = r.paid_amount || 0;
                const mIndex = r.month - 1;

                if (r.status === 'paid') paidCount++;
                else unpaidCount++;

                if (mIndex >= 0 && mIndex < 12) {
                    monthlyChart[mIndex].total_bill += bill;
                    monthlyChart[mIndex].paid += paid;
                    monthlyChart[mIndex].unpaid += (bill - paid);
                    totalBillYearly += bill;
                    totalPaidYearlyFromRecords += paid;
                }
            }
        });

        const totalRec = paidCount + unpaidCount;
        const totalPaidYearly = totalPaidYearlyFromRecords; // Chart Summary includes legacy

        return {
            stats: {
                activeCustomers,
                totalArrears,
                totalUsage,
                recordedCount,
                targetPercentage: activeCustomers ? Math.round((recordedCount / activeCustomers) * 100) : 0,
                targetPeriodName,
                installationArrears
            },
            revenue: { daily: dailyRev, monthly: monthlyRev, yearly: yearlyRev },
            trend,
            topDebtors: Object.values(debtMap).sort((a, b) => b.amount - a.amount).slice(0, 5),
            paymentMethods: [
                { name: "Tunai", value: cashCount, fill: "#6366f1" },
                { name: "Transfer", value: transferCount, fill: "#10b981" }
            ],
            activity,
            paymentStatus: {
                paid: paidCount,
                unpaid: unpaidCount,
                total: totalRec,
                percentage: totalRec > 0 ? Math.round((paidCount / totalRec) * 100) : 0
            },
            chartData: {
                monthly: monthlyChart,
                summary: {
                    totalBill: totalBillYearly,
                    totalPaid: totalPaidYearly,
                    totalUnpaid: totalBillYearly - totalPaidYearly
                }
            }
        };

    } catch (error) {
        console.error("Unified Dashboard Error:", error);
        throw error;
    }
}


// Schema context:
// customers (id, name, status, credit_balance, area_id)
// meter_records (id, customer_id, month, year, usage [gen], bill_amount [gen], paid_amount, status)
// transactions (id, total_amount, method, created_at, customer:customers(name))
// areas (id, name)

export async function getDashboardStats() {
    try {
        const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    // Fetch all meter records for the selected year (Includes Legacy)
    const supabase = await createClient();
    const { data: records, error } = await supabase
        .from("meter_records")
        .select("month, bill_amount, paid_amount, status, customers!inner(status)")
        .eq("year", year)
        .eq("customers.status", "active");

    if (error || !records) {
        return {
            monthly: Array(12).fill({ name: "", total_bill: 0, paid: 0, unpaid: 0 }),
            summary: { totalBill: 0, totalPaid: 0, totalUnpaid: 0 }
        };
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const monthlyData = months.map(m => ({ name: m, total_bill: 0, paid: 0, unpaid: 0 }));

    let totalBillYearly = 0;
    let totalPaidYearly = 0;

    records.forEach(r => {
        const mIndex = r.month - 1;
        if (mIndex >= 0 && mIndex < 12) {
            const bill = r.bill_amount || 0;
            const paid = r.paid_amount || 0;

            monthlyData[mIndex].total_bill += bill;
            monthlyData[mIndex].paid += paid;

            totalBillYearly += bill;
            totalPaidYearly += paid;
        }
    });

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
