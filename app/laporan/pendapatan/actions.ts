"use server";

import { createClient } from "@/lib/supabase/server";

// --- HELPERS ---
const getMonthRange = (month: number, year: number) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    return { startDate, endDate };
};

const getDateRange = (filterType: string, month: number, year: number) => {
    const today = new Date();

    switch (filterType) {
        case '7days':
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return {
                startDate: sevenDaysAgo.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
            };
        case 'thisMonth':
            return getMonthRange(today.getMonth() + 1, today.getFullYear());
        case 'lastMonth':
            const lastMonth = today.getMonth() === 0 ? 12 : today.getMonth();
            const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
            return getMonthRange(lastMonth, lastMonthYear);
        default:
            return getMonthRange(month, year);
    }
};

const getPreviousMonthParams = (month: number, year: number) => {
    if (month === 1) return { month: 12, year: year - 1 };
    return { month: month - 1, year };
};

// === MAIN DATA FUNCTIONS ===

export async function getRevenueReportSummary(month: number, year: number) {
    const supabase = await createClient();

    const current = getMonthRange(month, year);
    const prevParams = getPreviousMonthParams(month, year);
    const prev = getMonthRange(prevParams.month, prevParams.year);

    // Fetch Current Month
    const { data: currData, error: currError } = await supabase
        .from("transactions")
        .select("total_amount, method")
        .gte("created_at", current.startDate)
        .lt("created_at", current.endDate);

    // Fetch Previous Month
    const { data: prevData } = await supabase
        .from("transactions")
        .select("total_amount")
        .gte("created_at", prev.startDate)
        .lt("created_at", prev.endDate);

    if (currError || !currData) {
        console.error("Error fetching revenue summary", currError);
        return {
            totalRevenue: 0,
            totalCash: 0,
            totalTransfer: 0,
            transactionCount: 0,
            averageTransaction: 0,
            growth: 0
        };
    }

    let totalRevenue = 0;
    let totalCash = 0;
    let totalTransfer = 0;

    currData.forEach(p => {
        const amt = p.total_amount || 0;
        totalRevenue += amt;
        if (p.method === 'cash') totalCash += amt;
        else totalTransfer += amt;
    });

    let prevRevenue = 0;
    if (prevData) {
        prevData.forEach(p => prevRevenue += (p.total_amount || 0));
    }

    let growth = 0;
    if (prevRevenue > 0) {
        growth = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
    } else if (totalRevenue > 0) {
        growth = 100;
    }

    const averageTransaction = currData.length > 0 ? totalRevenue / currData.length : 0;

    return {
        totalRevenue,
        totalCash,
        totalTransfer,
        transactionCount: currData.length,
        averageTransaction: Math.round(averageTransaction),
        growth: parseFloat(growth.toFixed(1))
    };
}

export async function getDailyRevenueTrend(month: number, year: number) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);

    const { data: payments, error } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .gte("created_at", startDate)
        .lt("created_at", endDate)
        .order("created_at", { ascending: true });

    if (error || !payments) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return { day, revenue: 0, count: 0 };
    });

    payments.forEach(p => {
        const date = new Date(p.created_at);
        const day = date.getDate();
        if (day >= 1 && day <= daysInMonth) {
            dailyData[day - 1].revenue += p.total_amount;
            dailyData[day - 1].count += 1;
        }
    });

    // Calculate running average
    let runningTotal = 0;
    let runningCount = 0;
    dailyData.forEach(d => {
        if (d.revenue > 0) {
            runningTotal += d.revenue;
            runningCount += 1;
        }
    });
    const avgRevenue = runningCount > 0 ? runningTotal / runningCount : 0;

    return dailyData.map(d => ({ ...d, average: Math.round(avgRevenue) }));
}

export async function getWeeklyBreakdown(month: number, year: number) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);

    const { data: payments, error } = await supabase
        .from("transactions")
        .select("total_amount, created_at")
        .gte("created_at", startDate)
        .lt("created_at", endDate);

    if (error || !payments) return [];

    const weeks = [
        { week: 'Minggu 1', revenue: 0, days: '1-7' },
        { week: 'Minggu 2', revenue: 0, days: '8-14' },
        { week: 'Minggu 3', revenue: 0, days: '15-21' },
        { week: 'Minggu 4', revenue: 0, days: '22-31' }
    ];

    payments.forEach(p => {
        const day = new Date(p.created_at).getDate();
        if (day <= 7) weeks[0].revenue += p.total_amount;
        else if (day <= 14) weeks[1].revenue += p.total_amount;
        else if (day <= 21) weeks[2].revenue += p.total_amount;
        else weeks[3].revenue += p.total_amount;
    });

    return weeks;
}

export async function getRevenueByArea(month: number, year: number) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);

    const { data: payments, error } = await supabase
        .from("transactions")
        .select(`
            total_amount,
            customer:customers (
                area:areas (
                    name
                )
            )
        `)
        .gte("created_at", startDate)
        .lt("created_at", endDate);

    if (error || !payments) return [];

    const areaMap: Record<string, { revenue: number; count: number }> = {};

    payments.forEach((p: any) => {
        const amt = p.total_amount || 0;
        const areaName = p.customer?.area?.name || "Lain-lain";

        if (!areaMap[areaName]) areaMap[areaName] = { revenue: 0, count: 0 };
        areaMap[areaName].revenue += amt;
        areaMap[areaName].count += 1;
    });

    const totalRevenue = Object.values(areaMap).reduce((sum, a) => sum + a.revenue, 0);

    return Object.entries(areaMap)
        .map(([name, data]) => ({
            name,
            revenue: data.revenue,
            count: data.count,
            percentage: totalRevenue > 0 ? parseFloat(((data.revenue / totalRevenue) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);
}

export async function getRevenueByPaymentMethod(month: number, year: number) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);

    const { data: payments, error } = await supabase
        .from("transactions")
        .select("total_amount, method")
        .gte("created_at", startDate)
        .lt("created_at", endDate);

    if (error || !payments) return [];

    let cash = 0;
    let transfer = 0;
    let cashCount = 0;
    let transferCount = 0;

    payments.forEach(p => {
        if (p.method === 'cash') {
            cash += p.total_amount;
            cashCount += 1;
        } else {
            transfer += p.total_amount;
            transferCount += 1;
        }
    });

    const total = cash + transfer;

    return [
        {
            name: 'Tunai',
            value: cash,
            count: cashCount,
            percentage: total > 0 ? parseFloat(((cash / total) * 100).toFixed(1)) : 0,
            color: '#10b981'
        },
        {
            name: 'Transfer',
            value: transfer,
            count: transferCount,
            percentage: total > 0 ? parseFloat(((transfer / total) * 100).toFixed(1)) : 0,
            color: '#6366f1'
        },
    ];
}

export async function getDepositStatus(month: number, year: number) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);

    // Get all transactions for the month
    const { data: allTx, error } = await supabase
        .from("transactions")
        .select("total_amount, method, is_deposited")
        .gte("created_at", startDate)
        .lt("created_at", endDate);

    if (error || !allTx) {
        return {
            totalCash: 0,
            depositedCash: 0,
            pendingCash: 0,
            depositedCount: 0,
            pendingCount: 0
        };
    }

    let totalCash = 0;
    let depositedCash = 0;
    let pendingCash = 0;
    let depositedCount = 0;
    let pendingCount = 0;

    allTx.forEach(tx => {
        if (tx.method === 'cash') {
            totalCash += tx.total_amount;
            if (tx.is_deposited) {
                depositedCash += tx.total_amount;
                depositedCount += 1;
            } else {
                pendingCash += tx.total_amount;
                pendingCount += 1;
            }
        }
    });

    return {
        totalCash,
        depositedCash,
        pendingCash,
        depositedCount,
        pendingCount
    };
}

export async function getTransactionsList(month: number, year: number) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            id,
            total_amount,
            method,
            created_at,
            is_deposited,
            customer:customers (
                name,
                connection_number,
                area:areas(name)
            )
        `)
        .gte("created_at", startDate)
        .lt("created_at", endDate)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((t: any) => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        timestamp: t.created_at,
        customerName: t.customer?.name || "Pelanggan Umum",
        connectionNumber: t.customer?.connection_number || "-",
        area: t.customer?.area?.name || "-",
        amount: t.total_amount,
        method: t.method,
        isDeposited: t.is_deposited || false
    }));
}

export async function getTopCustomers(month: number, year: number, limit: number = 5) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            total_amount,
            customer:customers (
                id,
                name,
                connection_number
            )
        `)
        .gte("created_at", startDate)
        .lt("created_at", endDate);

    if (error || !data) return [];

    const customerMap: Record<string, { name: string; total: number; count: number }> = {};

    data.forEach((t: any) => {
        const custId = t.customer?.id || 'unknown';
        const custName = t.customer?.name || 'Pelanggan Umum';

        if (!customerMap[custId]) {
            customerMap[custId] = { name: custName, total: 0, count: 0 };
        }
        customerMap[custId].total += t.total_amount;
        customerMap[custId].count += 1;
    });

    return Object.entries(customerMap)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
}
