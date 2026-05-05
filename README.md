# PAMSIMAS Tirtowening - Web Admin (SITIRTO)

Sistem Manajemen BUMDes (PAMSIMAS) Tirtowening untuk pengelolaan pelanggan, pencatatan meter, dan pembayaran tagihan air secara digital.

## 🚀 Fitur Utama
- **Dashboard Eksekutif:** Statistik real-time pembayaran dan pemakaian.
- **Manajemen Pelanggan:** Database pelanggan terpusat per wilayah.
- **Input Meteran:** Pencatatan meter bulanan yang cepat dan akurat.
- **Sistem Pembayaran:** Mendukung pembayaran Tunai, Transfer, dan Saldo Deposit.
- **Cetak Dokumen:** Struk Thermal (58mm), Surat Tagihan, dan Surat Pemutusan Sambungan.

## 🛠️ Teknologi
- **Frontend/Backend:** Next.js (App Router)
- **Styling:** Tailwind CSS & Shadcn UI
- **Database & Auth:** Supabase (PostgreSQL)

---

## 🖥️ Panduan Instalasi di VPS (Ubuntu Server Minimalis)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di VPS NAT Bapak.

### 1. Persiapan Awal (Install Alat Dasar)
Update sistem dan install alat-alat yang biasanya belum ada di VPS minimalis:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nano
```

### 2. Install Node.js v20 (Terbaru & Stabil)
Aplikasi ini membutuhkan Node.js minimal versi 18/20. Jangan gunakan versi bawaan Ubuntu yang lama.
```bash
# Ambil script instalasi NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Cek versi (Pastikan v20+)
node -v
npm -v
```

### 3. Install PM2 (Process Manager)
Agar aplikasi tetap berjalan 24 jam di background.
```bash
sudo npm install -g pm2
```

### 4. Ambil Kodingan dari GitHub
```bash
git clone https://github.com/bayuanta/sitirto.git
cd sitirto
```

### 5. Setup Environment (.env.local)
Buat file kunci rahasia Supabase. Gunakan perintah `echo` agar lebih aman dari salah ketik:
```bash
# Ganti URL dan KEY dengan data dari Dashboard Supabase Bapak
echo "NEXT_PUBLIC_SUPABASE_URL=URL_BAPAK_DISINI" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=KUNCI_ANON_BAPAK_DISINI" >> .env.local
```

### 6. Install Dependensi & Build
```bash
# Install bumbu aplikasi
npm install

# Build kodingan (Proses masak aplikasi)
npm run build
```

### 7. Jalankan Aplikasi dengan PM2
```bash
# Start aplikasi
pm2 start npm --name "sitirto" -- start

# Setting agar otomatis nyala saat VPS restart
pm2 save
pm2 startup
```

### 8. Akses Aplikasi
Gunakan fitur **Domain Forwarding** (HTTP) atau **Port Forwarding** (TCP) pada panel VPS NAT Bapak untuk mengarahkan traffic ke **Port Internal 3000**.

---

## 📄 Pemeliharaan
- **Update Kodingan:** `git pull origin master && npm run build && pm2 restart sitirto`
- **Cek Status:** `pm2 status`
- **Cek Error Log:** `pm2 logs sitirto`

Developed for PAMSIMAS Tirtowening.
