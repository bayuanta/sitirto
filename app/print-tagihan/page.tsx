import { getBillsForPrint } from './actions';
import PrintBillsClient from './page.client';
import { notFound } from 'next/navigation';

export default async function PrintBillsPage({
    searchParams,
}: {
    searchParams: Promise<{ ids?: string; format?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const format = resolvedSearchParams.format || 'thermal58';

    if (!resolvedSearchParams.ids) {
        return notFound();
    }

    const ids = resolvedSearchParams.ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (ids.length === 0) {
        return notFound();
    }

    const data = await getBillsForPrint(ids);

    if (!data) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-100 flex-col gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Tagihan Tidak Ditemukan</h1>
                <p className="text-slate-500">Data tagihan yang Anda pilih mungkin sudah dihapus atau tidak valid.</p>
            </div>
        );
    }

    return <PrintBillsClient data={data} initialFormat={format} />;
}
