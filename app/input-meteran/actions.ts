"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CustomerSearch = {
    id: number;
    no_pelanggan: string;
    nama: string;
    alamat: string;
    status: string;
};

export type ActiveRate = {
    id: number;
    flat_rate: number;
    maintenance_fee: number;
    name: string;
};

export async function searchCustomers(query: string): Promise<CustomerSearch[]> {
    const supabase = await createClient();
    let queryBuilder = supabase
        .from("customers")
        .select("id, connection_number, name, address, status")
        .eq("status", "active");

    const cleanQuery = query?.trim() || "";

    if (cleanQuery.length >= 2) {
        queryBuilder = queryBuilder.or(`name.ilike.%${cleanQuery}%,connection_number.ilike.%${cleanQuery}%`);
    }

    const { data, error } = await queryBuilder
        .order("name", { ascending: true })
        .limit(50);

    if (error) {
        console.error("Error searching customers:", error);
        return [];
    }

    return (data || []).map((c: any) => ({
        id: c.id,
        no_pelanggan: c.connection_number,
        nama: c.name,
        alamat: c.address || "",
        status: c.status
    }));
}

export async function getCustomerLastMeter(customerId: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("meter_records")
        .select("meter_current, month, year")
        .eq("customer_id", customerId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching last meter:", error);
        return 0;
    }

    if (data && data.length > 0) {
        return data[0].meter_current;
    }
    return 0;
}

// Fetch active rate for a customer
// Note: In our advanced schema, customer might have specific rate_id.
// If null, they use a default/global rate.
export async function getActiveRate(customerId?: number) {
    const supabase = await createClient();
    let rateId = 1; // Default fallback

    if (customerId) {
        const { data: cust } = await supabase.from("customers").select("rate_id").eq("id", customerId).single();
        if (cust?.rate_id) rateId = cust.rate_id;
    }

    const { data, error } = await supabase
        .from("rates")
        .select("*")
        .eq("id", rateId)
        .single();

    if (error || !data) {
        console.warn("Rate not found, using generic fallback");
        return { id: 1, flat_rate: 0, maintenance_fee: 0, name: "Unknown" };
    }

    return data as ActiveRate;
}

// Get customer's default rate info (for UI display & override)
export async function getCustomerRateInfo(customerId: number): Promise<ActiveRate> {
    return await getActiveRate(customerId);
}


export async function saveMeterRecord(formData: FormData) {
    try {
        const supabase = await createClient();
        const customer_id = parseInt(formData.get("pelanggan_id") as string);
        const meteran_awal = Number(formData.get("meteran_awal"));
        const meteran_akhir = Number(formData.get("meteran_akhir"));
        const bulan = Number(formData.get("bulan"));
        const tahun = Number(formData.get("tahun"));

        // Optional overrides from UI
        const rate_override = formData.get("rate_override");
        const maintenance_override = formData.get("maintenance_override");
        const is_replacement = formData.get("is_replacement") === "true";

        if (!customer_id) throw new Error("ID Pelanggan tidak valid");

        // 1. Fetch customer to get credit_balance
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('credit_balance, name')
            .eq('id', customer_id)
            .single();

        if (customerError) {
            console.error("Customer fetch error:", customerError);
            return { error: `Gagal mengambil data pelanggan: ${customerError.message}` };
        }

        if (!customer) {
            console.error("Customer not found for ID:", customer_id);
            return { error: `Pelanggan dengan ID ${customer_id} tidak ditemukan` };
        }

        // 2. Determine rate values: use override if provided, otherwise fetch from master
        let rateValue: number;
        let maintenanceValue: number;

        if (rate_override !== null && maintenance_override !== null &&
            rate_override !== "" && maintenance_override !== "") {
            rateValue = Number(rate_override);
            maintenanceValue = Number(maintenance_override);
        } else {
            const rate = await getActiveRate(customer_id);
            rateValue = rate.flat_rate;
            maintenanceValue = rate.maintenance_fee;
        }

        // 3. Validation: only check if NOT in replacement mode
        if (!is_replacement && meteran_akhir < meteran_awal) {
            return { error: "Meteran akhir tidak boleh lebih kecil dari meteran awal." };
        }

        // 4. Calculate bill_amount (usage is auto-calculated by DB, but we need it for auto-debit)
        const usage = meteran_akhir - meteran_awal;
        const bill_amount = (usage * rateValue) + maintenanceValue;

        // 5. AUTO-DEBIT LOGIC
        let paid_amount = 0;
        let status: 'unpaid' | 'partial' | 'paid' = 'unpaid';
        let auto_debit_applied = false;
        let new_credit_balance = customer.credit_balance;

        if (customer.credit_balance > 0) {
            // Calculate auto-payment: Min(bill_amount, credit_balance)
            const auto_payment = Math.min(bill_amount, customer.credit_balance);
            paid_amount = auto_payment;
            status = auto_payment >= bill_amount ? 'paid' : 'partial';
            new_credit_balance = customer.credit_balance - auto_payment;
            auto_debit_applied = true;
        }

        // 6. Insert meter_record with auto-paid amount
        const payload = {
            customer_id,
            month: bulan,
            year: tahun,
            meter_last: meteran_awal,
            meter_current: meteran_akhir,
            rate_snapshot: rateValue,
            maintenance_snapshot: maintenanceValue,
            paid_amount,
            status
        };

        const { data: meterRecord, error: insertError } = await supabase
            .from("meter_records")
            .insert(payload)
            .select()
            .single();

        if (insertError) {
            console.error("Save meter error:", insertError);
            if (insertError.code === "23505") return { error: "Tagihan untuk periode ini sudah ada." };
            return { error: `Gagal menyimpan: ${insertError.message}` };
        }

        // 7. If auto-debit was applied, update customer balance and create transaction
        if (auto_debit_applied && meterRecord) {
            // Update customer balance
            const { error: updateError } = await supabase
                .from('customers')
                .update({ credit_balance: new_credit_balance })
                .eq('id', customer_id);

            if (updateError) {
                // Rollback meter_record if balance update fails
                await supabase.from('meter_records').delete().eq('id', meterRecord.id);
                return { error: 'Failed to update customer balance' };
            }

            // Create auto-debit transaction
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

            await supabase.from('transactions').insert({
                customer_id,
                total_amount: 0, // No cash received
                allocation_details: [{
                    record_id: meterRecord.id,
                    amount: paid_amount
                }],
                applied_credit: paid_amount,
                new_credit: 0,
                method: 'deposit',
                notes: `Auto-debit Tagihan ${monthNames[bulan - 1]} ${tahun}`
            });
        }

        revalidatePath("/input-meteran");
        revalidatePath("/pembayaran");

        return {
            success: true,
            auto_debit_applied,
            auto_debit_amount: paid_amount,
            bill_amount,
            remaining_balance: new_credit_balance,
            bill_status: status,
            customer_name: customer.name
        };
    } catch (err: any) {
        console.error("System error:", err);
        return { error: "Terjadi kesalahan sistem: " + err.message };
    }
}

// Fetch Areas for Filter
export async function getAreas() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('areas')
        .select('id, name, code')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching areas:", error);
        return [];
    }
    return data || [];
}

// Optimized Bulk Fetch with Group Support
export async function getBulkInputMeterData(
    month: number,
    year: number,
    searchTerm: string = "",
    groupFilter?: string | null,  // 'A', 'B', or null/undefined for ALL
    areaFilter?: string | null    // Area ID or null
) {
    const supabase = await createClient();

    // 1. Fetch Active Customers + Rates in one go
    let custQuery = supabase
        .from("customers")
        .select(`
            id, connection_number, name, address, status,
            meter_reading_group, route_order, area_id,
            rate:rates(id, flat_rate, maintenance_fee, name),
            area:areas(id, name)
        `)
        .eq("status", "active")
        .order("route_order", { ascending: true })  // Primary sort by custom order
        .order("name", { ascending: true })         // Fallback alphabetical
        .limit(100);

    // Group Filtering Logic
    if (groupFilter && groupFilter !== 'ALL') {
        custQuery = custQuery.eq("meter_reading_group", groupFilter);
    }

    // Area Filtering Logic
    if (areaFilter && areaFilter !== 'ALL') {
        custQuery = custQuery.eq("area_id", parseInt(areaFilter));
    }

    if (searchTerm.trim().length >= 1) {
        custQuery = custQuery.or(`name.ilike.%${searchTerm}%,connection_number.ilike.%${searchTerm}%`);
    }

    const { data: customers, error: custError } = await custQuery;

    if (custError || !customers) {
        console.error("Error fetching customers:", custError);
        return [];
    }

    // 2. Fetch Existing Records for THIS Period (Bulk)
    const customerIds = customers.map((c: any) => c.id);
    const { data: currentRecords } = await supabase
        .from("meter_records")
        .select("customer_id, meter_current, meter_last, bill_amount")
        .eq("month", month)
        .eq("year", year)
        .in("customer_id", customerIds);

    const currentRecordMap = new Map();
    (currentRecords || []).forEach((r: any) => currentRecordMap.set(r.customer_id, r));

    // 3. Process and Fetch Missing "Last Meters" (Server-Side Parallel)
    const enrichedData = await Promise.all(customers.map(async (c: any) => {
        const current = currentRecordMap.get(c.id);
        let meter_lalu = 0;
        let is_saved = false;
        let current_meter_val = 0;

        // Fetch the most recent record BEFORE the currently selected month/year
        const { data: prevRecord } = await supabase
            .from("meter_records")
            .select("meter_current, usage, bill_amount")
            .eq("customer_id", c.id)
            .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
            .order("year", { ascending: false })
            .order("month", { ascending: false })
            .limit(1)
            .single();

        if (current) {
            // Already input for this month
            meter_lalu = current.meter_last;
            current_meter_val = current.meter_current;
            is_saved = true;
        } else {
            // Not input yet, use the previous record's current meter as the new last meter
            meter_lalu = prevRecord?.meter_current || 0;
        }

        return {
            id: c.id,
            no_pelanggan: c.connection_number,
            nama: c.name,
            alamat: c.address || "",
            status: c.status,
            meter_lalu,
            prev_usage: prevRecord?.usage || 0,
            prev_bill: prevRecord?.bill_amount || 0,
            is_saved,
            current_value_if_saved: is_saved ? current_meter_val : null,
            saved_bill_amount: is_saved ? current.bill_amount : null,
            defaultRate: c.rate?.flat_rate || 0,
            defaultMaintenance: c.rate?.maintenance_fee || 0,
            rateName: c.rate?.name || "-",
            area_name: c.area?.name || "Lainnya"
        };
    }));

    return enrichedData;
}

// Update Route Order for Group
export async function updateRouteOrder(updates: Array<{ id: number; order: number }>, group: string) {
    const supabase = await createClient();

    try {
        // Batch update route_order for all customers in the group
        const promises = updates.map(({ id, order }) =>
            supabase
                .from("customers")
                .update({ route_order: order })
                .eq("id", id)
                .eq("meter_reading_group", group)
        );

        await Promise.all(promises);
        revalidatePath("/input-meteran");

        return { success: true };
    } catch (error: any) {
        console.error("Error updating route order:", error);
        return { error: error.message };
    }
}

// Assign Customer to Group
export async function assignCustomerGroup(customerId: number, group: 'A' | 'B' | null) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("customers")
            .update({ meter_reading_group: group })
            .eq("id", customerId);

        if (error) return { error: error.message };

        revalidatePath("/input-meteran");
        revalidatePath("/pelanggan");
        return { success: true };
    } catch (error: any) {
        console.error("Error assigning customer group:", error);
        return { error: error.message };
    }
}

// Batch Assign Customers to Group
export async function batchAssignCustomerGroup(customerIds: number[], group: 'A' | 'B' | null) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("customers")
            .update({ meter_reading_group: group })
            .in("id", customerIds);

        if (error) return { error: error.message };

        revalidatePath("/input-meteran");
        revalidatePath("/pelanggan");
        return { success: true };
    } catch (error: any) {
        console.error("Error batch assigning customer group:", error);
        return { error: error.message };
    }
}
