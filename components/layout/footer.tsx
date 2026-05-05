export function Footer() {
    return (
        <footer className="py-6 px-8 mt-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col md:items-start items-center gap-1">
                    <p className="text-xs font-bold text-slate-700">
                        © 2024 Pamsimas Tirtowening
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        Sistem Manajemen Pembayaran Air Desa Kemasan
                    </p>
                </div>

                <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="hover:text-indigo-600 cursor-pointer transition-colors">Bantuan</span>
                    <span className="hover:text-indigo-600 cursor-pointer transition-colors">Laporan</span>
                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-500">v1.0.0</span>
                </div>
            </div>
        </footer>
    );
}
