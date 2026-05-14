
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local manually
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransaction(id: number) {
    console.log(`--- CHECKING TRANSACTION #${id} ---`);
    
    const { data: tx, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !tx) {
        console.error("Transaction not found:", error);
        return;
    }

    console.log("Customer ID:", tx.customer_id);
    console.log("Total Amount:", tx.total_amount);
    console.log("Allocation Details Type:", typeof tx.allocation_details);
    console.log("Allocation Details Content:", JSON.stringify(tx.allocation_details, null, 2));

    // Also check meter_records that might be related but not in allocation_details
    const { data: records } = await supabase
        .from("meter_records")
        .select("id, month, year, status, paid_amount, transaction_id")
        .eq("transaction_id", id);
    
    console.log(`\nMeter Records linked by transaction_id: ${records?.length || 0}`);
    if (records) {
        records.forEach(r => {
            console.log(`- ID: ${r.id} | Periode: ${r.month}/${r.year} | Status: ${r.status}`);
        });
    }

    console.log("--- END ---");
}

checkTransaction(71);
