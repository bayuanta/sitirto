"use server";

import { createClient } from "@/lib/supabase/server";

// --- HELPERS ---
const getMonthRange = (month: number, year: number) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01T00:00:00Z`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00:00Z`;
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

// === UNIFIED DATA FUNCTION (OPTIMIZED) ===
export async function getUnifiedRevenueReport(month: number, year: number) {
    const supabase = await createClient();
    const current = getMonthRange(month, year);
    const prevParams = getPreviousMonthParams(month, year);
    const prev = getMonthRange(prevParams.month, prevParams.year);

    // Fetch Current Month (Full Detail) & Previous Month (Summary Only) in Parallel
    const [currResult, prevResult] = await Promise.all([
        supabase
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
            .gte("created_at", current.startDate)
            .lt("created_at", current.endDate)
            .order("created_at", { ascending: true }),
        
        supabase
            .from("transactions")
            .select("total_amount")
            .gte("created_at", prev.startDate)
            .lt("created_at", prev.endDate)
    ]);

    const currData = currResult.data || [];
    const prevData = prevResult.data || [];

    // --- 1. SUMMARY CALCULATION ---
    let totalRevenue = 0;
    let totalCash = 0;
    let totalTransfer = 0;
    let pendingCash = 0;
    let pendingCount = 0;
    let depositedCash = 0;
    let depositedCount = 0;

    currData.forEach(p => {
        const amt = p.total_amount || 0;
        totalRevenue += amt;
        if (p.method === 'cash') {
            totalCash += amt;
            if (p.is_deposited) {
                depositedCash += amt;
                depositedCount++;
            } else {
                pendingCash += amt;
                pendingCount++;
            }
        } else {
            totalTransfer += amt;
        }
    });

    const prevRevenue = prevData.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    let growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : (totalRevenue > 0 ? 100 : 0);
    const averageTransaction = currData.length > 0 ? totalRevenue / currData.length : 0;

    const summary = {
        totalRevenue,
        totalCash,
        totalTransfer,
        transactionCount: currData.length,
        averageTransaction: Math.round(averageTransaction),
        growth: parseFloat(growth.toFixed(1))
    };

    // --- 2. DAILY TREND ---
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyDataMap = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, revenue: 0, count: 0 }));
    
    currData.forEach(p => {
        const day = new Date(p.created_at).getDate();
        if (day >= 1 && day <= daysInMonth) {
            dailyDataMap[day - 1].revenue += p.total_amount;
            dailyDataMap[day - 1].count += 1;
        }
    });
    
    const activeDays = dailyDataMap.filter(d => d.revenue > 0).length;
    const avgDailyRevenue = activeDays > 0 ? totalRevenue / activeDays : 0;
    const dailyTrend = dailyDataMap.map(d => ({ ...d, average: Math.round(avgDailyRevenue) }));

    // --- 3. WEEKLY BREAKDOWN ---
    const weeks = [
        { week: 'Minggu 1', revenue: 0, days: '1-7' },
        { week: 'Minggu 2', revenue: 0, days: '8-14' },
        { week: 'Minggu 3', revenue: 0, days: '15-21' },
        { week: 'Minggu 4', revenue: 0, days: '22-31' }
    ];

    currData.forEach(p => {
        const day = new Date(p.created_at).getDate();
        if (day <= 7) weeks[0].revenue += p.total_amount;
        else if (day <= 14) weeks[1].revenue += p.total_amount;
        else if (day <= 21) weeks[2].revenue += p.total_amount;
        else weeks[3].revenue += p.total_amount;
    });

    // --- 4. AREA REVENUE ---
    const areaMap: Record<string, { revenue: number; count: number }> = {};
    currData.forEach((p: any) => {
        const areaName = p.customer?.area?.name || "Lain-lain";
        if (!areaMap[areaName]) areaMap[areaName] = { revenue: 0, count: 0 };
        areaMap[areaName].revenue += p.total_amount;
        areaMap[areaName].count += 1;
    });

    const areaRevenue = Object.entries(areaMap)
        .map(([name, data]) => ({
            name,
            revenue: data.revenue,
            count: data.count,
            percentage: totalRevenue > 0 ? parseFloat(((data.revenue / totalRevenue) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);

    // --- 5. PAYMENT METHODS ---
    const cashCount = currData.filter(p => p.method === 'cash').length;
    const transferCount = currData.length - cashCount;
    const paymentMethods = [
        { name: 'Tunai', value: totalCash, count: cashCount, percentage: totalRevenue > 0 ? parseFloat(((totalCash / totalRevenue) * 100).toFixed(1)) : 0, color: '#10b981' },
        { name: 'Transfer', value: totalTransfer, count: transferCount, percentage: totalRevenue > 0 ? parseFloat(((totalTransfer / totalRevenue) * 100).toFixed(1)) : 0, color: '#6366f1' },
    ];

    // --- 6. TRANSACTIONS LIST ---
    const transactions = [...currData].reverse().map((t: any) => ({
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

    return {
        summary,
        dailyTrend,
        weeklyData: weeks,
        paymentMethods,
        areaRevenue,
        depositStatus: {
            totalCash,
            depositedCash,
            pendingCash,
            depositedCount,
            pendingCount
        },
        transactions
    };
}

// Keep individual exports for compatibility, but mark for future removal or use unified internal
export async function getRevenueReportSummary(month: number, year: number) {
    const data = await getUnifiedRevenueReport(month, year);
    return data.summary;
}

export async function getDailyRevenueTrend(month: number, year: number) {
    const data = await getUnifiedRevenueReport(month, year);
    return data.dailyTrend;
}

export async function getWeeklyBreakdown(month: number, year: number) {
    const data = await getUnifiedRevenueReport(month, year);
    return data.weeklyData;
}

export async function getRevenueByArea(month: number, year: number) {
    const data = await getUnifiedRevenueReport(month, year);
    return data.areaRevenue;
}

export async function getRevenueByPaymentMethod(month: number, year: number) {
    const data = await getUnifiedRevenueReport(month, year);
    return data.paymentMethods;
}

export async function getDepositStatus(month: number, year: number) {
    const data = await getUnifiedRevenueReport(month, year);
    return data.depositStatus;
}

export async function getTransactionsList(month: number, year: number) {
    const data = await getUnifiedRevenueReport(month, year);
    return data.transactions;
}

export async function getTopCustomers(month: number, year: number, limit: number = 5) {
    const supabase = await createClient();
    const { startDate, endDate } = getMonthRange(month, year);
    const { data } = await supabase.from("transactions").select("total_amount, customer:customers(id, name)").gte("created_at", startDate).lt("created_at", endDate);
    if (!data) return [];
    const map: Record<string, any> = {};
    data.forEach((t: any) => {
        const id = t.customer?.id || 'unknown';
        if (!map[id]) map[id] = { name: t.customer?.name || 'Umum', total: 0, count: 0 };
        map[id].total += t.total_amount;
        map[id].count++;
    });
    return Object.entries(map).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.total - a.total).slice(0, limit);
}
