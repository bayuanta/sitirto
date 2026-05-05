import { notFound } from "next/navigation";
import PrintSuratTagihanClient from "./page.client";
import { getDunningLettersData } from "./actions";

export default async function PrintSuratTagihanPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
    const params = await searchParams;
    const idsString = params.ids as string;

    if (!idsString) {
        notFound();
    }

    const ids = idsString.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (ids.length === 0) {
        notFound();
    }

    const data = await getDunningLettersData(ids);

    if (!data || data.length === 0) {
        notFound();
    }

    return <PrintSuratTagihanClient data={data} />;
}
