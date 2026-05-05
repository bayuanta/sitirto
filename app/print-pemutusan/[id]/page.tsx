import { notFound } from "next/navigation";
import PrintPemutusanClient from "./page.client";
import { getDisconnectionNoticeData } from "./actions";

export default async function PrintPemutusanPage({ params }: { params: { id: string } }) {
    const resolvedParams = await params;
    const data = await getDisconnectionNoticeData(Number(resolvedParams.id));

    if (!data) {
        notFound();
    }

    return <PrintPemutusanClient data={data} />;
}
