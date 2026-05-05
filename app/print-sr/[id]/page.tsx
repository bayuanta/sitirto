import { notFound } from "next/navigation";
import PrintSRClient from "./page.client";
import { getPrintSRData } from "./actions";

export default async function PrintSRPage({ params }: { params: { id: string } }) {
    // Next.js 15+ requires params to be awaited before using its properties
    const resolvedParams = await params;
    const data = await getPrintSRData(Number(resolvedParams.id));

    if (!data) {
        notFound();
    }

    return <PrintSRClient data={data} />;
}
