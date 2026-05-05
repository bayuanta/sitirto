
"use server";

import { supabase } from "@/lib/supabase";

export async function seedTariff() {
    const currentYear = new Date().getFullYear();
    // Check if exists
    const { data } = await supabase.from("tarif_history").select("id").eq("tahun", currentYear).single();

    if (!data) {
        await supabase.from("tarif_history").insert({
            tahun: currentYear,
            biaya_per_m3: 2000,
            biaya_perawatan: 5000,
        });
        return { success: true };
    }
    return { success: false, message: "Tarif already exists" };
}
