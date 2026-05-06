"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type Rate = {
    id: number;
    name: string;
    code: string;
    flat_rate: number;
    maintenance_fee: number;
    effective_from?: string;
    effective_to?: string;
};

export type RateHistory = {
    id: number;
    rate_id: number;
    flat_rate: number;
    maintenance_fee: number;
    effective_from: string;
    effective_to?: string;
    created_at: string;
};

export async function getRates() {
    const { data, error } = await supabase
        .from("rates")
        .select(`
            *,
            rate_history!inner(effective_from, effective_to)
        `)
        .is("rate_history.effective_to", null)
        .order("id", { ascending: true });

    if (error) {
        console.error("Error fetching rates:", error);
        return [];
    }

    // Flatten the data to include effective dates
    const rates = (data || []).map((rate: any) => ({
        id: rate.id,
        name: rate.name,
        code: rate.code,
        flat_rate: rate.flat_rate,
        maintenance_fee: rate.maintenance_fee,
        effective_from: rate.rate_history?.[0]?.effective_from,
        effective_to: rate.rate_history?.[0]?.effective_to
    }));

    return rates as Rate[];
}

export async function getRateHistory(rateId: number) {
    const { data, error } = await supabase
        .from("rate_history")
        .select("*")
        .eq("rate_id", rateId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching rate history:", error);
        return [];
    }

    return data as RateHistory[];
}

export async function updateRate(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const flat_rate = parseInt(formData.get("flat_rate") as string);
    const maintenance_fee = parseInt(formData.get("maintenance_fee") as string);
    const effective_from = formData.get("effective_from") as string;
    const effective_to = formData.get("effective_to") as string;

    if (!id || !name) {
        return { error: "Data tidak valid" };
    }

    if (!effective_from) {
        return { error: "Tanggal berlaku dari wajib diisi" };
    }

    try {
        // 1. Ambil data lama dulu untuk di-archive
        const { data: oldRate, error: fetchError } = await supabase
            .from("rates")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !oldRate) {
            return { error: "Tarif tidak ditemukan" };
        }

        // 2. Close any active history records (set effective_to to now)
        const { error: closeError } = await supabase
            .from("rate_history")
            .update({ effective_to: new Date().toISOString() })
            .eq("rate_id", id)
            .is("effective_to", null);

        if (closeError) {
            console.error("Error closing active history:", closeError);
        }

        // 3. Insert new history record with new effective dates
        const { error: historyError } = await supabase
            .from("rate_history")
            .insert({
                rate_id: id,
                flat_rate: flat_rate,
                maintenance_fee: maintenance_fee,
                effective_from: effective_from,
                effective_to: effective_to || null
            });

        if (historyError) {
            console.error("Error creating new history:", historyError);
            return { error: "Gagal menyimpan riwayat tarif" };
        }

        // 4. Update Tarif Master
        const { error: updateError } = await supabase
            .from("rates")
            .update({
                name,
                flat_rate,
                maintenance_fee
            })
            .eq("id", id);

        if (updateError) {
            return { error: "Gagal mengupdate tarif" };
        }

        revalidatePath("/tarif");
        revalidatePath("/input-meteran");
        revalidatePath("/pelanggan");
        return { success: true };

    } catch (err) {
        console.error("Error updating rate:", err);
        return { error: "Terjadi kesalahan sistem" };
    }
}

export async function createRate(formData: FormData) {
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const flat_rate = parseInt(formData.get("flat_rate") as string);
    const maintenance_fee = parseInt(formData.get("maintenance_fee") as string);
    const effective_from = formData.get("effective_from") as string;
    const effective_to = formData.get("effective_to") as string;

    if (!name || !code) return { error: "Nama dan Kode wajib diisi" };
    if (!effective_from) return { error: "Tanggal berlaku dari wajib diisi" };

    try {
        // 1. Insert into rates table
        const { data: newRate, error: insertError } = await supabase
            .from("rates")
            .insert({
                name,
                code,
                flat_rate: flat_rate || 0,
                maintenance_fee: maintenance_fee || 0
            })
            .select()
            .single();

        if (insertError) {
            console.error("Create rate error:", insertError);
            return { error: "Gagal membuat tarif baru" };
        }

        // 2. Insert into rate_history for tracking
        const { error: historyError } = await supabase
            .from("rate_history")
            .insert({
                rate_id: newRate.id,
                flat_rate: flat_rate || 0,
                maintenance_fee: maintenance_fee || 0,
                effective_from: effective_from,
                effective_to: effective_to || null
            });

        if (historyError) {
            console.error("Create rate history error:", historyError);
            // Don't fail the whole operation, just log it
        }

        revalidatePath("/tarif");
        revalidatePath("/input-meteran");
        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err) {
        console.error("Error creating rate:", err);
        return { error: "Terjadi kesalahan sistem" };
    }
}

export async function deleteRate(id: number) {
    try {
        const { error } = await supabase.from('rates').delete().eq('id', id);
        if (error) {
            console.error("Delete rate error:", error);
            // This usually happens if there is a foreign key constraint (e.g. rate is used by customer)
            return { error: "Gagal menghapus: Tarif ini mungkin sedang digunakan oleh Pelanggan." };
        }
        revalidatePath("/tarif");
        revalidatePath("/input-meteran");
        revalidatePath("/pelanggan");
        return { success: true };
    } catch (err: any) {
        console.error("Error deleting rate:", err);
        return { error: "Terjadi kesalahan sistem" };
    }
}
