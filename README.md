# PAMSIMAS Tirtowening - Web Admin

Sistem Manajemen BUMDes (PAMSIMAS) Tirtowening untuk pengelolaan pelanggan, pencatatan meter, dan pembayaran tagihan air secara digital.

## 🚀 Fitur Utama
- **Dashboard Eksekutif:** Statistik real-time statistik pembayaran dan pemakaian.
- **Manajemen Pelanggan:** Database pelanggan terpusat per wilayah.
- **Input Meteran:** Pencatatan meter bulanan yang cepat dan akurat.
- **Sistem Pembayaran:** Mendukung pembayaran Tunai, Transfer, dan Saldo Deposit.
- **Cetak Dokumen:** Struk Thermal (58mm), Surat Tagihan, dan Surat Pemutusan Sambungan.

## 🛠️ Teknologi
- **Frontend/Backend:** Next.js (App Router)
- **Styling:** Tailwind CSS & Shadcn UI
- **Database & Auth:** Supabase (PostgreSQL)

---

## 🖥️ Panduan Instalasi di VPS (Ubuntu Server)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di VPS NAT Bapak.

### 1. Prasyarat (Aplikasi yang Harus Diinstall)
Jalankan perintah berikut di terminal VPS Bapak:
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js (Versi 20.x atau terbaru)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git & PM2 (Untuk menjalankan aplikasi di background)
sudo npm install -g pm2
```

### 2. Clone & Setup Aplikasi
```bash
# Clone repository
git clone <URL_REPOSITORY_BAPAK>
cd pamsimas-tirtowening

# Install dependensi
npm install

# Buat file environment (PENTING: Isi dengan kunci dari Supabase)
nano .env.local
```
*Salin dan tempelkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` Bapak ke dalam file tersebut, lalu simpan (Ctrl+O, Enter, Ctrl+X).*

### 3. Build & Jalankan
```bash
# Build aplikasi untuk produksi
npm run build

# Jalankan menggunakan PM2 agar aplikasi tidak mati saat terminal ditutup
pm2 start npm --name "pamsimas-web" -- start

# Agar PM2 otomatis jalan saat VPS restart
pm2 save
pm2 startup
```

### 4. Akses Aplikasi
Gunakan fitur **Domain Forwarding** pada panel VPS NAT Bapak untuk mengarahkan Domain ke IP Internal VPS pada **Port 3000**.

---

## 📄 Lisensi
Sistem ini dikembangkan khusus untuk PAMSIMAS Tirtowening.
