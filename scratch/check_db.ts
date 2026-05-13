
import { createAdminClient } from '../lib/supabase-admin';

async function debugData() {
    const supabase = createAdminClient();
    const connNumber = "SR-001"; // Ganti jika perlu

    console.log("--- DEBUG START ---");
    
    // 1. Cek Pelanggan
    const { data: customer } = await supabase
        .from("customers")
        .select("id, name, connection_number")
        .ilike("connection_number", connNumber)
        .single();

    if (!customer) {
        console.log("Pelanggan tidak ditemukan!");
        return;
    }

    console.log(`Pelanggan ditemukan: ${customer.name} (ID: ${customer.id})`);

    // 2. Cek SEMUA record di meter_records untuk pelanggan ini
    const { data: allRecords } = await supabase
        .from("meter_records")
        .select("id, month, year, status, paid_amount")
        .eq("customer_id", customer.id);

    console.log(`Total record ditemukan: ${allRecords?.length || 0}`);
    
    if (allRecords) {
        allRecords.forEach(r => {
            console.log(`- Periode: ${r.month}/${r.year} | Status: [${r.status}] | Paid: ${r.paid_amount}`);
        });
    }

    console.log("--- DEBUG END ---");
}

debugData();
