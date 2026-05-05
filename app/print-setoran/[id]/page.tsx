import { getDepositPrintData } from "./actions";
import PrintSetoranClient from "./page.client";
import { notFound } from "next/navigation";

export default async function PrintSetoranPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const data = await getDepositPrintData(Number(resolvedParams.id));

    if (!data) {
        notFound();
    }

    return <PrintSetoranClient data={data} />;
}
