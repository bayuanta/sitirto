import { getPrintData } from './actions';
import PrintClient from './page.client';
import { notFound } from 'next/navigation';

export default async function PrintPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ format?: string }>;
}) {
    // Await params and searchParams per Next 16 Server Components convention
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const id = parseInt(resolvedParams.id, 10);
    const format = resolvedSearchParams.format || 'thermal';

    if (isNaN(id)) {
        return notFound();
    }

    const data = await getPrintData(id);

    if (!data) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-100 flex-col gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Transaksi Tidak Ditemukan</h1>
                <p className="text-slate-500">ID Transaksi #{id} mungkin sudah dihapus atau tidak pernah ada.</p>
            </div>
        );
    }

    return <PrintClient data={data} initialFormat={format} />;
}
