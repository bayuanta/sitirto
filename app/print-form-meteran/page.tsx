import { getUnifiedBulkInputData } from "@/app/input-meteran/actions";
import PrintFormMeteranClient from "./page.client";

export const dynamic = "force-dynamic";

export default async function PrintFormMeteranPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const group = params.group as string | undefined;
    const area = params.area as string | undefined;
    
    // Parse month and year from params or use current date
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const month = params.month ? parseInt(params.month as string) : currentMonth;
    const year = params.year ? parseInt(params.year as string) : currentYear;

    // Fetch unified bulk input data (customers + areas)
    const { customers } = await getUnifiedBulkInputData(
        month,
        year,
        "", // empty search term
        group === 'ALL' ? null : group,
        area === 'ALL' ? null : area
    );

    return <PrintFormMeteranClient 
        data={customers} 
        group={group} 
        area={area} 
        month={month} 
        year={year} 
    />;
}
