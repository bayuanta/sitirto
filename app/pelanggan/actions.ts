"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export type Customer = {
    id: number;
    no_pelanggan: string;
    nama: string;
    alamat: string;
    wilayah_id: number;
    wilayah?: { nama_wilayah: string; kode_wilayah: string };
    status: string;
    rates?: { name: string; code: string };
    hp?: string;
    installation_status?: string;
    meter_reading_group?: string;
    credit_balance?: number;
};

export type Wilayah = {
    id: number;
    nama_wilayah: string;
    kode_wilayah: string;
};

export type InstallationFee = {
    id: number;
    total_amount: number;
    paid_amount: number;
    remaining_amount?: number; // Generated
    status: string;
};

export type UnifiedCustomerData = {
    customers: any[];
    wilayah: Wilayah[];
    rates: { id: number; name: string; code: string }[];
};

export async function getUnifiedCustomerData(
    query: string = "",
    areaId?: string | number,
    status?: string,
    installationStatus?: string,
    sortBy: string = "no_pelanggan",
    groupFilter?: string
): Promise<UnifiedCustomerData> {
    const [customers, wilayah, rates] = await Promise.all([
        getCustomers(query, areaId, status, installationStatus, sortBy, groupFilter),
        getWilayahList(),
        getRatesList()
    ]);

    return { customers, wilayah, rates };
}

export async function getCustomers(
    query: string = "",
    areaId?: string | number,
    status?: string,
    installationStatus?: string,
    sortBy: string = "no_pelanggan",
    groupFilter?: string
) {
    let dbQuery = supabase
        .from("customers")
        .select(`
            *,
            area:areas(id, name, code),
            rate:rates(id, name, code),
            installation:installation_fees(status)
        `)
        .order(sortBy === "no_pelanggan" ? "connection_number" : "name", { ascending: true })
        .limit(1000);

    if (groupFilter && groupFilter !== "all") {
        dbQuery = dbQuery.eq("meter_reading_group", groupFilter);
    }

    if (areaId && areaId !== "all") {
        dbQuery = dbQuery.eq("area_id", areaId);
    }

    if (status && status !== "all") {
        dbQuery = dbQuery.eq("status", status);
    }

    if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,connection_number.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error("Error fetching customers:", error);
        throw new Error("Gagal mengambil data pelanggan");
    }

    let customers = (data || []).map((item: any) => ({
        id: item.id,
        no_pelanggan: item.connection_number,
        nama: item.name,
        alamat: item.address || "",
        hp: item.phone || "",
        status: item.status || "Aktif",
        wilayah_id: item.area_id,
        wilayah: item.area ? {
            nama_wilayah: item.area.name,
            kode_wilayah: item.area.code
        } : null,
        rate_id: item.rate_id,
        kategori: item.rate ? item.rate.code : "-",
        meter_reading_group: item.meter_reading_group || "A",
        credit_balance: item.credit_balance || 0,
        // Helper to show if they have pending install fee
        installation_status: item.installation?.[0]?.status || "none"
    }));

    // Filter by installation status (client-side since it's from joined data)
    if (installationStatus && installationStatus !== "all") {
        customers = customers.filter((c: any) => {
            if (installationStatus === "none") {
                return c.installation_status === "none";
            } else if (installationStatus === "paid") {
                return c.installation_status === "paid";
            } else if (installationStatus === "unpaid") {
                return c.installation_status === "unpaid" || c.installation_status === "partial";
            }
            return true;
        });
    }

    return customers as any[];
}

export async function getWilayahList() {
    const { data, error } = await supabase
        .from("areas")
        .select("id, name, code")
        .order("name");

    if (error) return [];

    return (data || []).map((item: any) => ({
        id: item.id,
        nama_wilayah: item.name,
        kode_wilayah: item.code
    })) as Wilayah[];
}

// Fetch detail biaya pasang customer
export async function getCustomerInstallation(customerId: number) {
    const { data, error } = await supabase
        .from("installation_fees")
        .select(`
            *,
            payments:installation_payments(*)
        `)
        .eq("customer_id", customerId)
        .single();

    if (error) return null;

    // Sort payments descending
    if (data && data.payments) {
        data.payments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return data as InstallationFee & { payments: any[] };
}

export async function createCustomer(formData: FormData) {
    try {
        const no_pelanggan = formData.get("no_pelanggan") as string;
        const nama = formData.get("nama") as string;
        const alamat = formData.get("alamat") as string;
        const wilayah_id = formData.get("wilayah_id") as string;
        const rate_id = formData.get("rate_id") as string;
        const hp = formData.get("hp") as string;
        const meter_reading_group = formData.get("meter_reading_group") as string || "A";

        // Fee Data
        const biaya_pasang_str = formData.get("biaya_pasang") as string;
        const dp_pasang_str = formData.get("dp_pasang") as string;
        const biaya_pasang = biaya_pasang_str ? parseInt(biaya_pasang_str) : 0;
        const dp_pasang = dp_pasang_str ? parseInt(dp_pasang_str) : 0;

        if (!no_pelanggan || !nama || !wilayah_id || !rate_id) {
            return { error: "Mohon lengkapi data wajib (No. Pelanggan, Nama, Wilayah, Golongan)" };
        }

        // 1. Create Customer
        const payload = {
            connection_number: no_pelanggan,
            name: nama,
            address: alamat,
            area_id: parseInt(wilayah_id),
            phone: hp,
            status: 'active',
            rate_id: parseInt(rate_id),
            meter_reading_group
        };

        const { data: newCustomer, error: custError } = await supabase
            .from("customers")
            .insert(payload)
            .select()
            .single();

        if (custError) throw custError;

        // 2. Create Installation Fee Record (If applicable)
        if (biaya_pasang > 0 && newCustomer) {
            const status = dp_pasang >= biaya_pasang ? 'paid' : (dp_pasang > 0 ? 'partial' : 'pending');

            const { data: feeData, error: feeError } = await supabase
                .from("installation_fees")
                .insert({
                    customer_id: newCustomer.id,
                    total_amount: biaya_pasang,
                    paid_amount: dp_pasang,
                    status: status
                })
                .select()
                .single();

            if (feeError) {
                console.error("Error creating installation fee:", feeError);
                // Non-blocking, but good to log
            }

            // 3. Log DP Payment if exists
            if (dp_pasang > 0 && feeData) {
                await supabase.from("installation_payments").insert({
                    installation_fee_id: feeData.id,
                    amount: dp_pasang,
                    method: 'cash',
                    notes: 'DP Pemasangan Baru'
                });
            }
        }

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        console.error("Create customer error:", err);
        if (err.code === "23505") return { error: "No. Pelanggan (SR) sudah terdaftar." };
        return { error: "Gagal menyimpan: " + err.message };
    }
}

// Update Customer Information
export async function updateCustomer(customerId: number, formData: FormData) {
    try {
        const no_pelanggan = formData.get("no_pelanggan") as string;
        const nama = formData.get("nama") as string;
        const alamat = formData.get("alamat") as string;
        const wilayah_id = formData.get("wilayah_id") as string;
        const rate_id = formData.get("rate_id") as string;
        const hp = formData.get("hp") as string;
        const meter_reading_group = formData.get("meter_reading_group") as string || "A";

        // Fee Data
        const biaya_pasang_str = formData.get("biaya_pasang") as string;
        const dp_pasang_str = formData.get("dp_pasang") as string;
        const biaya_pasang = biaya_pasang_str ? parseInt(biaya_pasang_str) : 0;
        const dp_pasang = dp_pasang_str ? parseInt(dp_pasang_str) : 0;

        if (!no_pelanggan || !nama || !wilayah_id || !rate_id) {
            return { error: "Mohon lengkapi data wajib (No. Pelanggan, Nama, Wilayah, Golongan)" };
        }

        // 1. Update Customer Basic Info
        const payload = {
            connection_number: no_pelanggan,
            name: nama,
            address: alamat,
            area_id: parseInt(wilayah_id),
            phone: hp,
            rate_id: parseInt(rate_id),
            meter_reading_group
        };

        const { error: updateError } = await supabase
            .from("customers")
            .update(payload)
            .eq("id", customerId);

        if (updateError) {
            if (updateError.code === "23505") return { error: "No. Pelanggan (SR) sudah terdaftar." };
            throw updateError;
        }

        // 2. Update or Create Installation Fee
        if (biaya_pasang > 0) {
            const status = dp_pasang >= biaya_pasang ? 'paid' : (dp_pasang > 0 ? 'partial' : 'pending');
            
            // Check if exists
            const { data: existingFee } = await supabase
                .from("installation_fees")
                .select("id")
                .eq("customer_id", customerId)
                .single();

            if (existingFee) {
                // Update
                await supabase
                    .from("installation_fees")
                    .update({
                        total_amount: biaya_pasang,
                        paid_amount: dp_pasang,
                        status: status
                    })
                    .eq("id", existingFee.id);
            } else {
                // Create
                await supabase
                    .from("installation_fees")
                    .insert({
                        customer_id: customerId,
                        total_amount: biaya_pasang,
                        paid_amount: dp_pasang,
                        status: status
                    });
            }
        }

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        console.error("Update customer error:", err);
        return { error: "Gagal menyimpan perubahan: " + err.message };
    }
}

// Add Payment for Installation (Cicilan)
export async function addInstallationPayment(feeId: number, amount: number) {
    try {
        // 1. Get current fee state
        const { data: fee, error: fetchError } = await supabase
            .from("installation_fees")
            .select("*")
            .eq("id", feeId)
            .single();

        if (fetchError || !fee) return { error: "Data biaya pasang tidak ditemukan" };

        const newPaid = (fee.paid_amount || 0) + amount;
        const newStatus = newPaid >= fee.total_amount ? 'paid' : 'partial';

        // 2. Update Fee Record
        const { error: updateError } = await supabase
            .from("installation_fees")
            .update({ paid_amount: newPaid, status: newStatus })
            .eq("id", feeId);

        if (updateError) throw updateError;

        // 3. Log Transaction
        await supabase.from("installation_payments").insert({
            installation_fee_id: feeId,
            amount: amount,
            method: 'cash',
            notes: 'Pembayaran Cicilan'
        });

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        return { error: "Gagal memproses pembayaran: " + err.message };
    }
}
// ... existing code ...

// Get List of Rates (Golongan)
export async function getRatesList() {
    const { data, error } = await supabase
        .from("rates")
        .select("id, name, code")
        .order("id");

    if (error) return [];

    return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code
    }));
}

// Update Customer Rate
export async function updateCustomerRate(customerId: number, rateId: number) {
    try {
        const { error } = await supabase
            .from("customers")
            .update({ rate_id: rateId })
            .eq("id", customerId);

        if (error) throw error;

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        return { error: "Gagal update tarif: " + err.message };
    }
}

// Get Rate Details (for default pricing in legacy input)
export async function getRateDetails(rateId: number) {
    const { data, error } = await supabase
        .from("rates")
        .select("flat_rate, maintenance_fee")
        .eq("id", rateId)
        .single();

    if (error) return { flat_rate: 0, maintenance_fee: 0 };

    return {
        flat_rate: data.flat_rate || 0,
        maintenance_fee: data.maintenance_fee || 0
    };
}

// Insert Legacy Record (Migrasi Data Historis)
export async function insertLegacyRecord(payload: {
    customerId: number;
    month: number;
    year: number;
    meterLast: number;
    meterCurrent: number;
    rateSnapshot: number;
    maintenanceSnapshot: number;
    isPaid: boolean;
}) {
    try {
        const { customerId, month, year, meterLast, meterCurrent, rateSnapshot, maintenanceSnapshot, isPaid } = payload;

        // Calculate bill amount
        const usage = meterCurrent - meterLast;
        const billAmount = (usage * rateSnapshot) + maintenanceSnapshot;

        // 1. Insert meter record
        const { data: meterRecord, error: meterError } = await supabase
            .from("meter_records")
            .insert({
                customer_id: customerId,
                month: month,
                year: year,
                meter_last: meterLast,
                meter_current: meterCurrent,
                rate_snapshot: rateSnapshot,
                maintenance_snapshot: maintenanceSnapshot,
                status: isPaid ? 'paid' : 'unpaid',
                paid_amount: isPaid ? billAmount : 0
            })
            .select()
            .single();

        if (meterError) {
            if (meterError.code === '23505') {
                return { error: "Data untuk bulan dan tahun tersebut sudah ada" };
            }
            throw meterError;
        }

        // 2. If paid, create transaction record
        if (isPaid && meterRecord) {
            // Use the end of the specified month/year for historical accuracy
            const legacyDate = new Date(year, month, 0).toISOString();
            
            await supabase
                .from("transactions")
                .insert({
                    customer_id: customerId,
                    total_amount: billAmount,
                    method: 'cash',
                    notes: 'Migrasi Data Historis',
                    payment_date: legacyDate,
                    created_at: legacyDate, // Also set created_at to avoid showing up in current month reports
                    is_deposited: true      // Mark as already deposited to avoid setoran menu
                });
        }

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        console.error("Insert legacy record error:", err);
        return { error: "Gagal menyimpan data: " + err.message };
    }
}

// Get Meter Records for a Customer
export async function getMeterRecords(customerId: number) {
    const { data, error } = await supabase
        .from("meter_records")
        .select("*")
        .eq("customer_id", customerId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

    if (error) {
        console.error("Error fetching meter records:", error);
        return [];
    }

    return data || [];
}

// Delete Meter Record (with transaction cleanup)
export async function deleteMeterRecord(recordId: number) {
    try {
        // 1. Get record details first
        const { data: record, error: fetchError } = await supabase
            .from("meter_records")
            .select("customer_id, month, year, bill_amount, status")
            .eq("id", recordId)
            .single();

        if (fetchError || !record) {
            return { error: "Data tidak ditemukan" };
        }

        // 2. Delete meter record
        const { error: deleteError } = await supabase
            .from("meter_records")
            .delete()
            .eq("id", recordId);

        if (deleteError) throw deleteError;

        // 3. If paid, delete related transaction
        if (record.status === 'paid') {
            // Safe delete: match by customer_id, notes, and amount
            await supabase
                .from("transactions")
                .delete()
                .eq("customer_id", record.customer_id)
                .eq("notes", "Migrasi Data Historis")
                .eq("total_amount", record.bill_amount);
        }

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        console.error("Delete meter record error:", err);
        return { error: "Gagal menghapus data: " + err.message };
    }
}

// Update Meter Record (with transaction handling)
export async function updateMeterRecord(recordId: number, payload: {
    customerId: number;
    month: number;
    year: number;
    meterLast: number;
    meterCurrent: number;
    rateSnapshot: number;
    maintenanceSnapshot: number;
    isPaid: boolean;
}) {
    try {
        const { customerId, month, year, meterLast, meterCurrent, rateSnapshot, maintenanceSnapshot, isPaid } = payload;

        // 1. Get old record status
        const { data: oldRecord, error: fetchError } = await supabase
            .from("meter_records")
            .select("status, bill_amount, customer_id")
            .eq("id", recordId)
            .single();

        if (fetchError || !oldRecord) {
            return { error: "Data tidak ditemukan" };
        }

        // 2. Calculate new bill
        const usage = meterCurrent - meterLast;
        const newBillAmount = (usage * rateSnapshot) + maintenanceSnapshot;

        // 3. Update meter record
        const { error: updateError } = await supabase
            .from("meter_records")
            .update({
                month,
                year,
                meter_last: meterLast,
                meter_current: meterCurrent,
                rate_snapshot: rateSnapshot,
                maintenance_snapshot: maintenanceSnapshot,
                status: isPaid ? 'paid' : 'unpaid',
                paid_amount: isPaid ? newBillAmount : 0
            })
            .eq("id", recordId);

        if (updateError) throw updateError;

        // 4. Handle transaction changes based on status transition
        const wasPayd = oldRecord.status === 'paid';
        const nowPaid = isPaid;

        if (wasPayd && !nowPaid) {
            // Was paid, now unpaid → delete transaction
            await supabase
                .from("transactions")
                .delete()
                .eq("customer_id", oldRecord.customer_id)
                .eq("notes", "Migrasi Data Historis")
                .eq("total_amount", oldRecord.bill_amount);
        } else if (!wasPayd && nowPaid) {
            // Was unpaid, now paid → create transaction
            // Use the end of the specified month/year for historical accuracy
            const legacyDate = new Date(year, month, 0).toISOString();
            await supabase
                .from("transactions")
                .insert({
                    customer_id: customerId,
                    total_amount: newBillAmount,
                    method: 'cash',
                    notes: 'Migrasi Data Historis',
                    payment_date: legacyDate,
                    created_at: legacyDate, // Also set created_at
                    is_deposited: true      // Mark as already deposited
                });
        } else if (wasPayd && nowPaid && oldRecord.bill_amount !== newBillAmount) {
            // Still paid, but amount changed → update transaction
            // Delete old and create new (safer than update without FK)
            await supabase
                .from("transactions")
                .delete()
                .eq("customer_id", oldRecord.customer_id)
                .eq("notes", "Migrasi Data Historis")
                .eq("total_amount", oldRecord.bill_amount);

            const legacyDate = new Date(year, month, 0).toISOString();
            await supabase
                .from("transactions")
                .insert({
                    customer_id: customerId,
                    total_amount: newBillAmount,
                    method: 'cash',
                    notes: 'Migrasi Data Historis',
                    payment_date: legacyDate,
                    created_at: legacyDate, // Also set created_at
                    is_deposited: true      // Mark as already deposited
                });
        }

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        console.error("Update meter record error:", err);
        return { error: "Gagal mengupdate data: " + err.message };
    }
}

// ============================================================================
// COMPREHENSIVE CUSTOMER DETAILS (NEW - FOR DETAIL DRAWER)
// ============================================================================

export type CustomerDetails = {
    customer: {
        id: number;
        no_pelanggan: string;
        nama: string;
        alamat: string;
        hp: string;
        status: string;
        wilayah: { nama_wilayah: string; kode_wilayah: string } | null;
        rate: { name: string; code: string } | null;
        rate_id: number;
        credit_balance: number;
        installation_status: string;
    };
    stats: {
        total_arrears: number;
        avg_usage: number;
        last_payment_date: string | null;
        total_bills: number;
    };
    bills: Array<{
        id: number;
        month: number;
        year: number;
        meter_last: number;
        meter_current: number;
        usage: number;
        bill_amount: number;
        paid_amount: number;
        remaining: number;
        status: string;
        water_cost: number;
        maintenance_snapshot: number;
        rate_snapshot: number;
    }>;
    history: Array<{
        id: number;
        date: string;
        type: string;
        amount: number;
        method: string;
        notes: string;
        related_bills: string;
    }>;
    installation: any;
};

export async function getCustomerDetails(customerId: number): Promise<CustomerDetails | null> {
    try {
        // 1. Parallel fetch using Promise.all for maximum speed
        const [custRes, billsRes, txRes, installRes] = await Promise.all([
            supabase
                .from("customers")
                .select(`
                    *,
                    area:areas(id, name, code),
                    rate:rates(id, name, code)
                `)
                .eq("id", customerId)
                .single(),
            supabase
                .from("meter_records")
                .select("*")
                .eq("customer_id", customerId)
                .order("year", { ascending: false })
                .order("month", { ascending: false }),
            supabase
                .from("transactions")
                .select("*")
                .eq("customer_id", customerId)
                .order("payment_date", { ascending: false })
                .limit(50),
            supabase
                .from("installation_fees")
                .select(`
                    *,
                    payments:installation_payments(*)
                `)
                .eq("customer_id", customerId)
                .single()
        ]);

        if (custRes.error || !custRes.data) {
            console.error("Error fetching customer:", custRes.error);
            return null;
        }

        const customer = custRes.data;
        const billsData = billsRes.data || [];
        const transactionsData = txRes.data || [];
        const installationData = installRes.data || null;

        // Sort installation payments descending if exists
        if (installationData && installationData.payments) {
            installationData.payments.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        // 2. Process Bills
        const bills = billsData.map((record: any) => {
            const usage = record.meter_current - record.meter_last;
            const water_cost = usage * record.rate_snapshot;
            const remaining = record.bill_amount - (record.paid_amount || 0);

            return {
                id: record.id,
                month: record.month,
                year: record.year,
                meter_last: record.meter_last,
                meter_current: record.meter_current,
                usage,
                bill_amount: record.bill_amount,
                paid_amount: record.paid_amount || 0,
                remaining,
                status: record.status,
                water_cost,
                maintenance_snapshot: record.maintenance_snapshot,
                rate_snapshot: record.rate_snapshot,
            };
        });

        // 3. Calculate Stats
        const total_arrears = bills
            .filter(b => b.status === 'unpaid' || b.status === 'partial')
            .reduce((sum, b) => sum + b.remaining, 0);

        const total_bills = bills.filter(b => b.status === 'unpaid' || b.status === 'partial').length;

        // Average Usage: Last 6 months
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const recentBills = bills.filter(b => {
            const billDate = new Date(b.year, b.month - 1, 1);
            return billDate >= sixMonthsAgo;
        });

        const avg_usage = recentBills.length > 0
            ? recentBills.reduce((sum, b) => sum + b.usage, 0) / recentBills.length
            : 0;

        // 4. Process Transaction History
        const history = transactionsData.map((tx: any) => {
            let type = "Pembayaran Tagihan";
            if (tx.notes?.toLowerCase().includes("pasang")) type = "Biaya Pasang";
            else if (tx.notes?.toLowerCase().includes("auto-debit") || tx.applied_credit > 0) type = "Auto-Debit Saldo";
            else if (tx.new_credit > tx.applied_credit) type = "Deposit Saldo";

            let related_bills = "";
            try {
                const allocations = JSON.parse(tx.allocation_details || "[]");
                if (allocations.length > 0) {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                    related_bills = allocations
                        .map((a: any) => `${months[a.month - 1]} ${a.year}`)
                        .join(", ");
                }
            } catch (e) {}

            return {
                id: tx.id,
                date: tx.payment_date || tx.created_at,
                type,
                amount: tx.total_amount,
                method: tx.method === 'cash' ? 'Tunai' : 'Transfer',
                notes: tx.notes || "",
                related_bills,
            };
        });

        const last_payment_date = history.length > 0 ? history[0].date : null;

        // 5. Return Unified Object
        return {
            customer: {
                id: customer.id,
                no_pelanggan: customer.connection_number,
                nama: customer.name,
                alamat: customer.address || "",
                hp: customer.phone || "",
                status: customer.status || "active",
                wilayah: customer.area ? {
                    nama_wilayah: customer.area.name,
                    kode_wilayah: customer.area.code
                } : null,
                rate: customer.rate ? {
                    name: customer.rate.name,
                    code: customer.rate.code
                } : null,
                rate_id: customer.rate_id,
                credit_balance: customer.credit_balance || 0,
                installation_status: installationData?.status || "none",
            },
            stats: {
                total_arrears,
                avg_usage: Math.round(avg_usage * 10) / 10,
                last_payment_date,
                total_bills,
            },
            bills,
            history,
            installation: installationData,
        };
    } catch (err: any) {
        console.error("Get customer details error:", err);
        return null;
    }
}

// ============================================================================
// CUSTOMER MANAGEMENT ACTIONS (NEW)
// ============================================================================

export async function toggleCustomerStatus(customerId: number, newStatus: 'active' | 'inactive') {
    try {
        // Update status (no validation - allow deactivation even with unpaid bills)
        const { error } = await supabase
            .from("customers")
            .update({ status: newStatus })
            .eq("id", customerId);

        if (error) throw error;

        revalidatePath("/pelanggan");
        revalidatePath("/laporan/tunggakan");
        revalidatePath("/");
        return { success: true };
    } catch (err: any) {
        console.error("Toggle customer status error:", err);
        return { error: "Gagal mengubah status: " + err.message };
    }
}

export async function deleteCustomer(customerId: number) {
    try {
        // 1. Check if customer has any transactions
        const { data: transactions, error: txError } = await supabase
            .from("transactions")
            .select("id")
            .eq("customer_id", customerId)
            .limit(1);

        if (txError) throw txError;

        if (transactions && transactions.length > 0) {
            return { error: "Tidak dapat menghapus pelanggan yang sudah memiliki riwayat transaksi. Gunakan fitur Nonaktifkan sebagai gantinya." };
        }

        // 2. Delete related records (cascade)
        // Delete installation fees first
        await supabase
            .from("installation_fees")
            .delete()
            .eq("customer_id", customerId);

        // Delete meter records
        await supabase
            .from("meter_records")
            .delete()
            .eq("customer_id", customerId);

        // 3. Delete customer
        const { error: deleteError } = await supabase
            .from("customers")
            .delete()
            .eq("id", customerId);

        if (deleteError) throw deleteError;

        revalidatePath("/pelanggan");
        revalidatePath("/laporan/tunggakan");
        revalidatePath("/");
        return { success: true };
    } catch (err: any) {
        console.error("Delete customer error:", err);
        return { error: "Gagal menghapus pelanggan: " + err.message };
    }
}

export async function reinstallCustomer(
    customerId: number,
    installationFee: number,
    paymentMethod: 'cash' | 'transfer'
) {
    try {
        // 1. Validate customer is inactive
        const { data: customer, error: custError } = await supabase
            .from("customers")
            .select("status")
            .eq("id", customerId)
            .single();

        if (custError || !customer) {
            return { error: "Pelanggan tidak ditemukan" };
        }

        if (customer.status === 'active') {
            return { error: "Pelanggan sudah dalam status aktif" };
        }

        // 2. Update customer status to active
        const { error: updateError } = await supabase
            .from("customers")
            .update({
                status: 'active',
                installation_date: new Date().toISOString()
            })
            .eq("id", customerId);

        if (updateError) throw updateError;

        // 3. Create installation fee record if fee > 0
        if (installationFee > 0) {
            const { data: feeData, error: feeError } = await supabase
                .from("installation_fees")
                .insert({
                    customer_id: customerId,
                    total_amount: installationFee,
                    paid_amount: installationFee,
                    status: 'paid'
                })
                .select()
                .single();

            if (feeError) throw feeError;

            // 4. Create installation payment record
            if (feeData) {
                await supabase
                    .from("installation_payments")
                    .insert({
                        installation_fee_id: feeData.id,
                        amount: installationFee,
                        method: paymentMethod,
                        notes: 'Pembayaran Pasang Baru / Sambung Ulang'
                    });
            }

            // 5. Create transaction record
            await supabase
                .from("transactions")
                .insert({
                    customer_id: customerId,
                    total_amount: installationFee,
                    method: paymentMethod,
                    notes: 'Biaya Pasang Baru / Sambung Ulang',
                    payment_date: new Date().toISOString()
                });
        }

        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        console.error("Reinstall customer error:", err);
        return { error: "Gagal memproses pemasangan ulang: " + err.message };
    }
}

