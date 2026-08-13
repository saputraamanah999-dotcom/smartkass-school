import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  XCircle, CheckSquare, Square, Search, UserPlus, Trash2,
  Calendar, Tag, Calculator, ShoppingBag, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Wallet, Clock, Info, Plus, Star,
  X, BookOpen, ChevronRight, ChevronDown, CheckCircle2,
  LayoutDashboard, Users, FileSpreadsheet, Palette, Database,
  ThumbsUp, ArrowRight, Lightbulb, Zap, Shield, UserCheck, RefreshCw,
} from 'lucide-react';
import {
  CoinIcon, WalletIcon, TargetIcon, SiswaIcon,
} from '../icons/CustomIcons';
import { SchoolLogo } from '../icons/SchoolLogo';

type RoleKey = 'bendahara' | 'guru' | 'admin';

interface GuideStep {
  title: string;
  description: string;
  tip?: string;
}

interface GuideSection {
  title: string;
  icon: any;
  steps: GuideStep[];
}

// ====== DEFAULT GUIDES — konten lengkap untuk semua role ======
const defaultGuides: Record<RoleKey, GuideSection[]> = {
  bendahara: [
    {
      title: 'Dashboard Kas (Halaman Utama)',
      icon: LayoutDashboard,
      steps: [
        {
          title: 'Melihat Saldo Real-Time',
          description: 'Di halaman utama, kamu akan langsung melihat Saldo Bersih kelas (hijau = surplus, merah = defisit). Semua angka dihitung otomatis dari data pembayaran dan pengeluaran yang tersimpan di Firebase. Tidak perlu dihitung manual — sistem sudah otomatis. Saldo dihitung dengan formula: Total Pemasukan Aktual dikurangi Total Pengeluaran Aktual, langsung dari dokumen Firestore, bukan dari field saldo yang bisa stale.',
          tip: 'Saldo selalu akurat karena dihitung real-time dari setiap dokumen pembayaran dan pengeluaran yang ada.',
        },
        {
          title: 'Widget Pembayaran Terbaru (Siapa yang Bayar)',
          description: 'Di bawah Arus Kas, ada widget "Pembayaran Terbaru" yang OTOMATIS menampilkan daftar siswa yang baru saja bayar kas. Nama siswa, nomor absen, minggu ke berapa, bulan, nominal, dan waktu relatif ("5 menit lalu", "2 jam lalu") semuanya terekam dan tampil otomatis tanpa perlu input manual. Setiap kali kamu centang checkbox atau input Setor Kas, nama siswa langsung muncul di widget ini secara real-time.',
          tip: 'Nama siswa otomatis terekam dari data siswa di Firebase. Kamu tidak perlu mengetik nama — sistem yang mengambilnya.',
        },
        {
          title: 'Memahami Target Kas',
          description: 'Bar progress menunjukkan pencapaian menuju target kas kelas. Jika belum ada target, pergi ke menu Target / Tujuan Kas untuk mengaturnya. Target membantu memotivasi siswa untuk menabung bersama. Target juga menampilkan deadline dan tujuan pengumpulan dana (misal: Study Tour, Dana Kelas, dll).',
        },
        {
          title: 'Grafik & Statistik',
          description: 'Scroll ke bawah untuk melihat grafik arus kas mingguan (bar chart), donut chart status pembayaran (lunas/belum/menunggak), heatmap per siswa (warna hijau = lunas, merah = menunggak), ranking siswa paling rajin bayar kas, dan cash flow summary. Semua chart ini berubah secara real-time setiap ada pembayaran atau pengeluaran baru.',
        },
      ],
    },
    {
      title: 'Mencatat Pembayaran Kas (Checkbox Matriks)',
      icon: CheckSquare,
      steps: [
        {
          title: 'Cara Centang Checkbox di Matriks',
          description: 'Buka menu "Catat Pembayaran", lalu pastikan tab yang aktif adalah "Matriks Checkbox Mingguan". Pilih bulan di dropdown atas (Januari-Desember). Untuk mencatat bahwa siswa sudah bayar kas minggu ini, cukup KLIK tombol kotak (Square) di kolom minggu yang bersangkutan. Tombol akan berubah jadi centang hijau (CheckSquare) dan saldo otomatis bertambah. Nama siswa otomatis terekam di dokumen pembayaran.',
          tip: 'Satu klik = satu minggu kas lunas + nama siswa otomatis terekam + saldo otomatis bertambah. Klik lagi untuk membatalkan. Semua real-time langsung ke dashboard.',
        },
        {
          title: 'Proses Otomatis di Balik Checkbox',
          description: 'Saat kamu mengklik checkbox, sistem secara otomatis melakukan: (1) Membuat dokumen pembayaran di Firebase dengan nama siswa, nomor absen, nominal, tanggal, dan status lunas. (2) Menambah saldo kas kelas via Transaction atomis (aman dari race condition). (3) Mengupdate semua dashboard dan chart secara real-time. (4) Menampilkan notifikasi sukses. Kamu tidak perlu melakukan apapun selain klik checkbox.',
          tip: 'Semua proses terjadi otomatis dalam hitungan milidetik. Data langsung sync ke semua perangkat yang sedang membuka SmartKas.',
        },
        {
          title: 'Menambah Siswa Baru ke Matriks',
          description: 'Di bagian atas matriks, ada form "Tambah Nama Siswa Ke Kelas". Isi nama lengkap dan nomor absen, lalu klik + Simpan Siswa. Siswa otomatis muncul di baris baru dengan 4 kolom checkbox mingguan. Data siswa langsung tersimpan ke Firebase dan muncul di semua halaman (dashboard, laporan, dll).',
        },
        {
          title: 'Menghapus Siswa',
          description: 'Klik ikon tempat sampah (Trash2) di kolom paling kanan baris siswa. Konfirmasi penghapusan. Data siswa akan terhapus dari sistem. Pastikan tidak ada saldo tersisa yang belum ditransfer sebelum menghapus siswa.',
          tip: 'Hati-hati saat menghapus siswa! Data pembayaran historis juga bisa terpengaruh.',
        },
        {
          title: 'Melihat Total & Progress per Siswa',
          description: 'Kolom "Total Bayar" menunjukkan berapa uang yang sudah dibayar siswa tersebut di bulan yang dipilih (otomatis dihitung dari jumlah checkbox yang tercentang dikali nominal per minggu). Kolom "Progress" menunjukkan persentase kelunasan (0%-100%) dengan progress bar berwarna. Siswa yang 100% (4/4 minggu) akan ditandai badge LUNAS hijau.',
        },
      ],
    },
    {
      title: 'Input Setoran Kas Manual (Multi-Minggu)',
      icon: Plus,
      steps: [
        {
          title: 'Kapan Menggunakan Setor Kas Manual?',
          description: 'Gunakan fitur ini ketika siswa membayar langsung ke bendahara secara tunai, bukan lewat checkbox. Cocok untuk bayar 2-4 minggu sekaligus. Setelah disimpan, checkbox di matriks akan KECENTANG OTOMATIS sesuai minggu yang dibayar. Nama siswa otomatis terekam dari dropdown — kamu hanya perlu pilih nama siswa, sistem yang mengambil data lengkapnya (nama, absen, dsb).',
          tip: 'Bayar 2 minggu sekaligus? Pilih Jumlah Minggu = 2. Sistem otomatis buat 2 dokumen pembayaran, centang 2 checkbox, dan catat nama siswa secara otomatis.',
        },
        {
          title: 'Langkah-langkah Lengkap Setor Kas',
          description: '1) Klik tombol "Input Setoran Kas" di halaman Catat Pembayaran. 2) Pilih nama siswa dari dropdown (nama otomatis muncul). 3) Pilih bulan setoran. 4) Pilih "Mulai Minggu Ke-" (1, 2, 3, atau 4). 5) Pilih "Jumlah Minggu" (1-4 minggu sekaligus). 6) Nominal OTOMATIS dihitung (jumlah minggu x nominal per minggu). 7) Tambah catatan opsional jika perlu. 8) Klik "Simpan Setoran". Selesai! Checkbox di matriks kecentang otomatis, nama siswa terekam, saldo bertambah, dan muncul di widget Pembayaran Terbaru di dashboard.',
        },
        {
          title: 'Contoh: Siswa Bayar 2 Minggu Sekaligus',
          description: 'Jika siswa Ananda bayar untuk Minggu 2 dan Minggu 3 sekaligus: pilih siswa "Ananda", Mulai Minggu Ke-2, Jumlah Minggu = 2. Nominal otomatis = 2 x Rp 5.000 = Rp 10.000. Setelah klik Simpan, sistem OTOMATIS: (a) membuat 2 dokumen pembayaran terpisah (M2 dan M3), (b) mencatat nama "Ananda" di kedua dokumen, (c) menambah Rp 10.000 ke saldo kelas, (d) menampilkan checkbox M2 dan M3 kecentang hijau di matriks, (e) menampilkan Ananda di widget Pembayaran Terbaru di dashboard.',
          tip: 'Contoh bayar 2x 2 minggu: Pilih mulai M1, jumlah 2 minggu (M1+M2). Lalu ulangi untuk M3+M4. Total 4 minggu = lunas full bulan.',
        },
        {
          title: 'Konfirmasi Otomatis oleh Guru',
          description: 'Setiap Setor Kas yang kamu simpan OTOMATIS mendapat status "Disetujui Guru" (approvedByGuru: true). Kamu tidak perlu menunggu persetujuan terpisah. Sistem dirancang agar bendahara adalah operator terpercaya yang pencatatan pembayarannya langsung dianggap sah. Guru tetap bisa memantau dari dashboard mereka.',
        },
      ],
    },
    {
      title: 'Sistem Otomatis: Nama Siapa yang Bayar',
      icon: UserCheck,
      steps: [
        {
          title: 'Bagaimana Nama Siswa Otomatis Terekam?',
          description: 'Setiap kali kamu mencatat pembayaran (baik lewat checkbox maupun Setor Kas manual), sistem OTOMATIS mengambil data siswa dari Firebase dan menyimpannya di dokumen pembayaran. Field yang terekam otomatis: (1) siswaNama — nama lengkap siswa, (2) siswaNoAbsen — nomor absen, (3) dicatatOlehNama — nama bendahara yang mencatat, (4) tanggalBayar — waktu pembayaran. Kamu TIDAK perlu mengetik nama manual — sistem yang mengambilnya.',
          tip: 'Ini yang dimaksud "otomatis": kamu cuma klik checkbox atau pilih siswa di dropdown, sisanya sistem yang handle.',
        },
        {
          title: 'Di Mana Nama Pembayar Tampil?',
          description: 'Nama siswa yang bayar otomatis tampil di: (1) Widget "Pembayaran Terbaru" di dashboard bendahara — menampilkan 10 pembayaran terakhir dengan nama, absen, waktu, dan nominal. (2) Tab "Riwayat Transaksi Detail" — tabel lengkap semua pembayaran dengan kolom Siswa menampilkan nama dan nomor absen. (3) Widget "Top Siswa Rajin Bayar" di dashboard — ranking berdasarkan total pembayaran. (4) Heatmap — grid visual per siswa per minggu.',
        },
      ],
    },
    {
      title: 'Frekuensi Pembayaran Kas',
      icon: RefreshCw,
      steps: [
        {
          title: 'Mengatur Frekuensi Kas (Harian / Mingguan / 2x per 2 Minggu)',
          description: 'Di halaman Target & Peraturan Kas, kamu bisa mengatur frekuensi pembayaran kas kelas. Pilihan: (1) Mingguan — default, 4 minggu per bulan, masing-masing Rp 5.000. (2) Harian — kas dikumpulkan setiap hari, nominal lebih kecil (misal Rp 1.000/hari). (3) 2x per 2 Minggu — bayar 2 kali dalam sebulan, setiap 2 minggu sekali (misal Rp 10.000/2 minggu). Frekuensi ini mengubah label header di matriks checkbox agar sesuai.',
          tip: 'Frekuensi bisa diubah kapan saja. Nominal per minggu juga bisa diubah lewat Quick Set (2k, 3k, 5k, 7k, 10k, 15k, 20k).',
        },
        {
          title: 'Contoh Perhitungan per Frekuensi',
          description: 'MINGGUAN (default): Rp 5.000/minggu x 4 minggu = Rp 20.000/bulan/siswa. HARIAN: Rp 1.000/hari x 5 hari x 4 minggu = Rp 20.000/bulan/siswa (header jadi Hari 1-20). 2x PER 2 MINGGU: Rp 10.000/setoran x 2 setoran = Rp 20.000/bulan/siswa (header jadi Periode 1-2). Total per bulan tetap sama, hanya cara pembagiannya yang berbeda.',
        },
      ],
    },
    {
      title: 'Belanja & Pengeluaran Kas',
      icon: ShoppingBag,
      steps: [
        {
          title: 'Melihat Saldo Tersedia',
          description: 'Di halaman Belanja & Diskon Kas, card pertama menunjukkan "Saldo Kas Kelas Tersedia". Angka ini dihitung REAL-TIME dari total pembayaran dikurangi total pengeluaran. Ini adalah saldo yang benar-benar tersedia untuk belanja, bukan angka manual yang bisa salah.',
        },
        {
          title: 'Mencatat Pengeluaran',
          description: 'Klik tombol "Atur & Input Belanja Barang". Isi nama barang, harga satuan, jumlah, kategori. Bisa tambah diskon (dalam Rupiah atau Persen). Form akan menampilkan preview: Subtotal, Potongan Diskon, Total Akhir, dan Sisa Saldo Kas setelah belanja. Jika saldo tidak cukup, tombol simpan akan OTOMATIS disabled dan muncul peringatan merah.',
          tip: 'Sistem melindungi agar tidak bisa belanja melebihi saldo. Ini fitur keamanan otomatis.',
        },
        {
          title: 'Menghapus Pengeluaran',
          description: 'Klik ikon hapus di tabel riwayat pengeluaran. Saldo kas akan OTOMATIS dikembalikan (dipulihkan) setelah pengeluaran dihapus. Kamu tidak perlu hitung manual — sistem yang mengembalikan saldo secara atomis.',
        },
      ],
    },
    {
      title: 'Target / Tujuan Kas',
      icon: TargetIcon,
      steps: [
        {
          title: 'Mengatur Target Kas',
          description: 'Buka menu "Target / Tujuan Kas". Klik tombol "Atur Target Kas". Isi tujuan (contoh: Dana study tour Bali), nominal target (contoh: Rp 2.500.000), deadline (contoh: 20 Desember 2026), dan keterangan opsional. Target akan tampil sebagai progress bar animasi di dashboard, menunjukkan persentase pencapaian.',
        },
        {
          title: 'Mengubah Nominal Kas per Minggu',
          description: 'Di halaman target, ada bagian "Peraturan Kas Mingguan". Kamu bisa mengubah nominal kas per minggu lewat: (1) Klik "Edit Peraturan" untuk mengubah nominal dan keterangan secara custom, atau (2) Gunakan tombol Quick Set (2k, 3k, 5k, 7k, 10k, 15k, 20k) untuk mengubah sekaligus. Semua perhitungan di matriks checkbox, form Setor Kas, dan dashboard akan OTOMATIS menyesuaikan dengan nominal baru.',
          tip: 'Kalau kelas mau pakai kas harian, ubah nominal-nya saja. Misal Rp 1.000/hari. Atau kalau 2x per 2 minggu, set Rp 10.000/periode.',
        },
      ],
    },
    {
      title: 'Laporan Kas Kelas',
      icon: FileSpreadsheet,
      steps: [
        {
          title: 'Mengunduh Laporan',
          description: 'Buka menu "Laporan Kas Kelas". Kamu bisa melihat ringkasan lengkap (total pemasukan, total pengeluaran, saldo akhir) dan mengunduh laporan dalam format Excel/PDF yang rapi. Laporan mencakup semua pemasukan (termasuk nama siswa yang bayar), pengeluaran, dan saldo kelas per periode.',
        },
        {
          title: 'Data Real-time di Laporan',
          description: 'Semua angka di laporan diambil langsung dari Firebase. Artinya, jika kamu baru saja mencatat pembayaran atau pengeluaran, angka di laporan sudah otomatis terbaru. Tidak perlu refresh manual — cukup buka halaman laporan dan data sudah up-to-date.',
        },
      ],
    },
    {
      title: 'Cara Kerja Real-time & Otomatis',
      icon: Zap,
      steps: [
        {
          title: 'Apa itu Real-time?',
          description: 'SmartKas menggunakan Firebase Firestore dengan listener real-time. Artinya, setiap perubahan data (pembayaran, pengeluaran, edit nominal) langsung terkirim ke SEMUA perangkat yang sedang membuka SmartKas dalam hitungan milidetik. Jika bendahara mencatat pembayaran di HP, guru yang membuka laptop akan langsung melihat perubahannya tanpa perlu refresh.',
        },
        {
          title: 'Transaction Atomis (Anti Race Condition)',
          description: 'Setiap perubahan saldo kas menggunakan Firebase Transaction. Ini berarti jika dua orang (misalnya bendahara di HP dan bendahara di laptop) mengklik checkbox bersamaan, sistem tetap menghitung saldo dengan benar. Tidak akan ada saldo yang hilang atau double-count. Transaction memastikan baca-dan-tulis saldo terjadi sebagai satu unit yang tidak bisa diinterupsi.',
          tip: 'Ini teknologi yang sama yang dipakai oleh aplikasi perbankan untuk mencegah duplikasi transaksi.',
        },
        {
          title: 'Alur Data Lengkap: Dari Klik Checkbox sampai Dashboard',
          description: 'Kamu klik checkbox → (1) UI langsung berubah (optimistic update, instan). (2) Dokumen pembayaran dibuat di Firebase (nama siswa, nominal, tanggal OTOMATIS). (3) Saldo kelas di-update via Transaction atomis. (4) Firebase mengirim notifikasi ke semua listener. (5) Dashboard, chart, widget Pembayaran Terbaru, dan matriks SEMUA berupdate otomatis. Total waktu: kurang dari 1 detik.',
        },
      ],
    },
  ],
  guru: [
    {
      title: 'Dashboard Guru (Pengawasan Kas)',
      icon: LayoutDashboard,
      steps: [
        {
          title: 'Memantau Kas Kelas secara Real-time',
          description: 'Dashboard guru menampilkan 4 card utama: Saldo Kas Kelas Saat Ini (dihitung otomatis dari total pemasukan dikurangi pengeluaran), Total Pengeluaran, Total Siswa Aktif, dan jumlah Siswa Menunggak. Semua angka dihitung otomatis dari Firebase dan selalu akurat. Guru bisa memantau kesehatan keuangan kelas tanpa harus menghitung manual sama sekali.',
          tip: 'Data saldo dihitung langsung dari dokumen pembayaran dan pengeluaran di Firebase, bukan dari field manual yang bisa salah.',
        },
        {
          title: 'Widget Pembayaran Terbaru',
          description: 'Guru juga bisa melihat widget "Pembayaran Terbaru" yang menampilkan siapa saja siswa yang sudah bayar kas. Nama siswa, nominal, waktu pembayaran — semuanya otomatis terekam oleh sistem tanpa perlu input manual dari guru. Ini membantu guru mengetahui siswa mana yang rajin bayar dan mana yang menunggak.',
        },
        {
          title: 'Grafik & Ranking Siswa',
          description: 'Scroll ke bawah untuk melihat: grafik arus kas per minggu (bar chart), ranking siswa paling rajin bayar kas, progress mingguan, donut chart status pembayaran, dan heatmap per siswa. Chart-chart ini berubah secara real-time setiap ada perubahan data dari bendahara.',
        },
      ],
    },
    {
      title: 'Kelas Saya (Kelola Data)',
      icon: SchoolLogo,
      steps: [
        {
          title: 'Melihat Info Kelas',
          description: 'Halaman Kelas Saya menampilkan detail kelas: nama kelas, jurusan, nama wali kelas (kamu), nama bendahara yang bertugas, nominal kas per minggu, dan frekuensi pembayaran. Kamu juga bisa melihat daftar lengkap siswa beserta status mereka (aktif, pindah, lulus, keluar).',
        },
        {
          title: 'Memahami Data yang Ditampilkan',
          description: 'Semua data di halaman Kelas Saya diambil langsung dari Firebase secara real-time. Jika bendahara menambah siswa baru atau mengubah nominal kas, perubahan tersebut akan otomatis terlihat di halaman ini tanpa perlu refresh.',
        },
      ],
    },
    {
      title: 'Mencatat Pengeluaran Kas',
      icon: WalletIcon,
      steps: [
        {
          title: 'Input Pengeluaran sebagai Guru',
          description: 'Guru juga bisa mencatat pengeluaran kas kelas sebagai backup bendahara. Klik "Tambah Pengeluaran", isi nama barang, harga satuan, jumlah, kategori. Saldo kas akan otomatis berkurang dan update real-time ke dashboard guru maupun dashboard bendahara.',
          tip: 'Pastikan hanya mencatat pengeluaran yang sudah disetujui. Bendahara biasanya yang mencatat, tapi guru bisa sebagai backup jika bendahara berhalangan.',
        },
      ],
    },
    {
      title: 'Approve Pembayaran Siswa',
      icon: ThumbsUp,
      steps: [
        {
          title: 'Menyetujui Pembayaran Kas',
          description: 'Buka menu "Approve Pembayaran". Di sini kamu bisa melihat daftar pembayaran yang sudah dicatat oleh bendahara beserta NAMA SISWA yang bayar, nominal, tanggal, dan status verifikasi. Secara default, semua pembayaran dari bendahara (baik lewat checkbox maupun Setor Kas manual) sudah OTOMATIS disetujui (approvedByGuru: true). Kamu tidak perlu menyetujui satu per satu.',
          tip: 'Sistem dirancang otomatis: pembayaran dari bendahara langsung dianggap sah. Fitur approve tersedia jika suatu saat ingin review manual.',
        },
        {
          title: 'Memantau Siapa yang Sudah Bayar',
          description: 'Di tabel approve, kamu bisa melihat kolom "Siswa" yang menampilkan nama lengkap dan nomor absen siswa yang melakukan pembayaran. Nama ini otomatis terekam oleh sistem saat bendahara mencatat pembayaran. Guru tidak perlu memverifikasi nama manual — data sudah akurat.',
        },
      ],
    },
    {
      title: 'Membuat Akun Bendahara',
      icon: UserPlus,
      steps: [
        {
          title: 'Cara Membuat Akun Bendahara',
          description: 'Di dashboard guru, klik tombol "Buat Akun Bendahara". Isi Nama Lengkap, Email, dan Password (minimal 6 karakter). Akun bendahara akan OTOMATIS terhubung ke kelas yang kamu kelola (sama dengan kelas kamu). Bendahara bisa langsung login dan mulai mencatat kas.',
          tip: 'Email bendahara harus unik (belum terdaftar di sistem). Gunakan format yang konsisten, misal: bendahara.xitjkt1@sekolah.sch.id',
        },
        {
          title: 'Setelah Akun Bendahara Dibuat',
          description: 'Bendahara akan muncul di menu Admin > Bendahara. Bendahara bisa: login, melihat dashboard kelas (termasuk widget siapa yang bayar), mencatat pembayaran via checkbox matriks, input Setor Kas manual, mencatat pengeluaran, mengatur target kas, dan mengunduh laporan. Semua perubahan yang dilakukan bendahara akan otomatis sync ke dashboard guru.',
        },
      ],
    },
    {
      title: 'Laporan Kas Kelas',
      icon: FileSpreadsheet,
      steps: [
        {
          title: 'Mengunduh Laporan',
          description: 'Buka menu "Laporan Kas Kelas" untuk melihat dan mengunduh laporan keuangan kelas. Laporan mencakup pemasukan (dengan nama siswa), pengeluaran, dan saldo. Data diambil langsung dari Firebase sehingga selalu akurat dan real-time.',
        },
      ],
    },
    {
      title: 'Memahami Sistem Otomatis SmartKas',
      icon: Zap,
      steps: [
        {
          title: 'Apa yang Guru Perlu Tahu?',
          description: 'SmartKas dirancang OTOMATIS. Artinya: (1) Nama siswa otomatis terekam saat bendahara mencatat pembayaran. (2) Saldo otomatis dihitung dari data pembayaran dan pengeluaran. (3) Semua angka real-time — tidak pernah stale. (4) Jika bendahara mengubah nominal kas atau frekuensi, semua perhitungan otomatis menyesuaikan. (5) Dashboard guru otomatis update saat ada perubahan dari bendahara.',
        },
        {
          title: 'Frekuensi Pembayaran Kas',
          description: 'Kas kelas bisa dikumpulkan dengan frekuensi berbeda: (1) Mingguan — 4x per bulan, (2) Harian — setiap hari sekolah, (3) 2x per 2 Minggu — 2 setoran per bulan. Frekuensi diatur oleh bendahara di halaman Target & Peraturan Kas. Guru bisa melihat frekuensi yang berlaku di halaman Kelas Saya.',
        },
      ],
    },
  ],
  admin: [
    {
      title: 'Dashboard Admin (Overview Seluruh Sekolah)',
      icon: LayoutDashboard,
      steps: [
        {
          title: 'Melihat Gambaran Umum Sekolah',
          description: 'Dashboard admin menampilkan: Total Saldo Kas dari SEMUA kelas digabung, jumlah total sekolah, jurusan, dan siswa. Grafik pemasukan vs pengeluaran per minggu untuk seluruh sekolah. Semua data real-time dari Firebase. Admin bisa memantau kesehatan keuangan seluruh kelas dalam satu layar tanpa harus membuka satu per satu.',
          tip: 'Admin bisa memantau kesehatan keuangan seluruh kelas dalam satu layar. Data otomatis update.',
        },
        {
          title: 'Rekap Kas Semua Kelas (Ranking)',
          description: 'Scroll ke bawah untuk melihat ranking kelas berdasarkan total kas yang terkumpul. Kelas dengan kas terbanyak akan mendapat badge emas, perak, perunggu. Setiap kelas menampilkan nama kelas, jumlah siswa, total saldo, dan progress bar. Admin bisa klik untuk melihat detail matriks checkbox per kelas.',
        },
      ],
    },
    {
      title: 'Setup Sekolah',
      icon: SchoolLogo,
      steps: [
        {
          title: 'Membuat Data Sekolah',
          description: 'Buka menu "Sekolah". Klik "Tambah Sekolah", isi nama sekolah dan alamat. Sekolah akan menjadi induk dari semua jurusan dan kelas. Ini adalah langkah PERTAMA yang harus dilakukan sebelum menambahkan data lainnya.',
        },
        {
          title: 'Edit & Hapus Sekolah',
          description: 'Setiap sekolah memiliki tombol Edit dan Hapus. PERINGATAN: menghapus sekolah akan menghapus SEMUA data di bawahnya (jurusan, kelas, siswa, pembayaran, pengeluaran). Pastikan sudah backup data sebelum menghapus.',
        },
      ],
    },
    {
      title: 'Setup Jurusan',
      icon: SchoolLogo,
      steps: [
        {
          title: 'Membuat Jurusan',
          description: 'Buka menu "Jurusan". Pilih sekolah terlebih dahulu, lalu klik "Tambah Jurusan". Contoh jurusan: TJKT, RPL, AKL, BDP, TKJ, MM, DKV, BKK. Jurusan harus berada di bawah sekolah. Pastikan sekolah sudah dibuat terlebih dahulu.',
          tip: 'Jurusan adalah pengelompokan kelas berdasarkan program keahlian.',
        },
      ],
    },
    {
      title: 'Setup Kelas',
      icon: SchoolLogo,
      steps: [
        {
          title: 'Membuat Kelas',
          description: 'Buka menu "Kelas". Pilih jurusan, lalu klik "Tambah Kelas". Isi nama kelas (contoh: XI TJKT 1), pilih wali kelas dari daftar guru, dan atur nominal kas mingguan (default Rp 5.000). Kelas akan otomatis memiliki collection untuk pengeluaran dan siswa di Firebase.',
        },
        {
          title: 'Mengatur Nominal & Frekuensi Kas',
          description: 'Saat membuat atau mengedit kelas, atur nominalKasMingguan sesuai kebutuhan. Contoh: Rp 5.000/minggu = Rp 20.000/bulan per siswa (4 minggu). Bisa diubah kapan saja oleh bendahara. Frekuensi kas juga bisa diatur: mingguan (default), harian, atau 2x per 2 minggu. Semua perhitungan otomatis menyesuaikan.',
          tip: 'Untuk kas harian, set nominal lebih kecil (misal Rp 1.000) dan ubah frekuensi ke "harian". Untuk 2x per 2 minggu, set nominal lebih besar (misal Rp 10.000) dan ubah frekuensi ke "2x-per-2minggu".',
        },
      ],
    },
    {
      title: 'Guru Wali Kelas',
      icon: Users,
      steps: [
        {
          title: 'Membuat Akun Guru',
          description: 'Buka menu "Guru Wali". Klik "Tambah Guru", isi Nama Lengkap, Email, Password, dan pilih Kelas yang dikelola. Guru akan OTOMATIS terhubung ke kelas tersebut dan bisa memantau kas secara real-time. Satu guru mengelola satu kelas.',
        },
        {
          title: 'Role & Hak Akses Guru',
          description: 'Guru bisa: melihat dashboard kelas (real-time), mencatat pengeluaran, approve pembayaran, membuat akun bendahara, melihat laporan, dan memantau siapa yang bayar. Guru TIDAK bisa: mengedit checkbox matriks, menghapus pembayaran, atau mengubah target kas. Hanya bendahara yang bisa mencatat pembayaran.',
        },
      ],
    },
    {
      title: 'Bendahara Kelas',
      icon: CoinIcon,
      steps: [
        {
          title: 'Cara Membuat Akun Bendahara',
          description: 'Ada 2 cara membuat akun bendahara: (1) Admin membuat lewat menu "Bendahara" di panel admin — pilih kelas, isi nama, email, password. (2) Guru membuat lewat tombol "Buat Akun Bendahara" di dashboard guru — otomatis terhubung ke kelas guru tersebut.',
        },
        {
          title: 'Role & Hak Akses Bendahara (Operator Utama)',
          description: 'Bendahara adalah OPERATOR UTAMA kas kelas. Bisa: centang checkbox matriks (mencatat pembayaran), input Setor Kas manual (multi-minggu), catat pengeluaran, atur target kas, ubah nominal kas, ubah frekuensi pembayaran, tambah/hapus siswa, dan unduh laporan. Semua perubahan langsung real-time ke dashboard bendahara, guru, dan admin.',
          tip: 'Satu kelas sebaiknya hanya punya 1 bendahara aktif untuk menghindari konflik data. Tapi sistem aman jika ada 2 orang (transaction atomis mencegah race condition).',
        },
        {
          title: 'Sistem Otomatis Bendahara',
          description: 'Saat bendahara bekerja: (1) Klik checkbox → nama siswa OTOMATIS terekam, saldo OTOMATIS bertambah. (2) Setor Kas manual → pilih siswa dari dropdown, nominal OTOMATIS dihitung, checkbox OTOMATIS kecentang. (3) Catat pengeluaran → saldo OTOMATAS berkurang, sistem OTOMATIS cek apakah saldo cukup. Semua data OTOMATIS sync ke Firebase dan ke semua dashboard (bendahara, guru, admin) secara real-time.',
        },
      ],
    },
    {
      title: 'Data Siswa',
      icon: SiswaIcon,
      steps: [
        {
          title: 'Melihat Data Siswa Semua Kelas',
          description: 'Buka menu "Data Siswa". Admin bisa melihat semua siswa dari semua kelas dalam satu tabel. Bisa filter berdasarkan jurusan dan kelas. Setiap siswa menampilkan nama, nomor absen, kelas, jurusan, dan status (aktif/pindah/lulus/keluar).',
        },
        {
          title: 'Siswa Ditambahkan oleh Bendahara',
          description: 'Biasanya bendahara yang menambahkan siswa langsung dari halaman Matriks Checkbox. Admin tidak perlu menambahkan siswa satu per satu. Namun admin bisa memantau jumlah siswa per kelas dari halaman ini.',
        },
      ],
    },
    {
      title: 'Pengaturan Tampilan & Akun',
      icon: Palette,
      steps: [
        {
          title: 'Pengaturan Tampilan',
          description: 'Buka menu "Pengaturan Tampilan". Kamu bisa mengubah tema (dark/light mode), warna aksen, dan tampilan lainnya.',
        },
        {
          title: 'Kelola Akun & Role (RBAC)',
          description: 'Buka menu "Kelola Akun & Role". Kamu bisa melihat semua akun yang terdaftar, mengubah role (admin/guru/bendahara), dan mengatur akses. Ini adalah kontrol pusat untuk manajemen user di sistem SmartKas.',
        },
        {
          title: 'Backup & Restore',
          description: 'Buka menu "Backup & Restore". Fitur ini memungkinkan kamu untuk melakukan backup seluruh data (sekolah, jurusan, kelas, siswa, pembayaran, pengeluaran) dan restore jika diperlukan. Sangat penting untuk melakukan backup berkala.',
        },
      ],
    },
    {
      title: 'Laporan Lintas Kelas',
      icon: FileSpreadsheet,
      steps: [
        {
          title: 'Laporan Kas Seluruh Sekolah',
          description: 'Buka menu "Laporan Lintas Kelas". Admin bisa melihat perbandingan kas antar kelas, jurusan mana yang paling rajin menabung, ranking kelas berdasarkan total kas, dan mengunduh laporan keseluruhan sekolah. Laporan mencakup nama siswa yang bayar di setiap kelas.',
        },
      ],
    },
    {
      title: 'Memahami Arsitektur Real-time SmartKas',
      icon: Database,
      steps: [
        {
          title: 'Struktur Data Firebase',
          description: 'Data disimpan di Firebase Firestore dengan struktur hierarkis: Sekolah → Jurusan → Kelas → Siswa → Pembayaran. Setiap kelas juga memiliki sub-collection Pengeluaran. User profile tersimpan di collection users (top-level). Struktur ini memastikan isolasi data per kelas dan query yang efisien.',
        },
        {
          title: 'Real-time Listener',
          description: 'SmartKas menggunakan onSnapshot() dari Firebase untuk mendengarkan perubahan data secara real-time. Setiap ada perubahan (pembayaran baru, pengeluaran, edit nominal), semua dashboard yang terbuka akan otomatis update tanpa perlu refresh. Ini berlaku untuk admin, guru, dan bendahara secara bersamaan.',
        },
        {
          title: 'Keamanan & Konsistensi Data',
          description: 'Semua perubahan saldo menggunakan Firebase Transaction (bukan update biasa). Transaction memastikan: (1) Baca saldo terbaru → (2) Hitung saldo baru → (3) Tulis saldo baru, sebagai satu operasi atomis yang tidak bisa diinterupsi. Ini mencegah race condition saat dua orang mengakses sistem bersamaan.',
          tip: 'Teknologi yang sama dipakai oleh aplikasi perbankan untuk menjaga konsistensi saldo.',
        },
      ],
    },
  ],
};

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleKey;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose, role }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sections = defaultGuides[role];

  const getRoleLabel = (r: RoleKey) => {
    if (r === 'admin') return 'Administrator';
    if (r === 'guru') return 'Guru Wali Kelas';
    return 'Bendahara Kelas';
  };

  const getRoleColor = (r: RoleKey) => {
    if (r === 'admin') return 'from-indigo-600 to-purple-600';
    if (r === 'guru') return 'from-purple-600 to-pink-600';
    return 'from-amber-500 to-orange-500';
  };

  // Panduan read-only — tidak bisa diedit oleh user

  const totalSteps = sections.reduce((acc, s) => acc + s.steps.length, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-start justify-center overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl my-6 mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className={`p-6 bg-gradient-to-r ${getRoleColor(role)} relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
                <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />
              </div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={24} className="text-white/90" />
                    <h2 className="text-xl font-extrabold text-white font-heading">Panduan Lengkap SmartKas</h2>
                  </div>
                  <p className="text-sm text-white/80">
                    Panduan step-by-step untuk <strong className="text-white">{getRoleLabel(role)}</strong> — semua fitur dijelaskan lengkap.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Panduan bersifat read-only */}

            {/* Quick Stats */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <BookOpen size={14} />
                <span>{sections.length} Fitur</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle2 size={14} />
                <span>{totalSteps} Langkah</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                <Zap size={14} />
                <span>Semua Real-time & Otomatis</span>
              </div>

            </div>

            {/* Sections */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {sections.map((section, idx) => {
                const SectionIcon = section.icon;
                const isOpen = activeSection === section.title || idx === 0;
                return (
                  <div key={section.title} className="last:border-b-0">
                    <button
                      onClick={() => setActiveSection(isOpen ? null : section.title)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${getRoleColor(role)} bg-opacity-10`} style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}>
                          <SectionIcon size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">{section.title}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">{section.steps.length} langkah</p>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown size={18} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={18} className="text-slate-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 space-y-4">
                            {section.steps.map((step, stepIdx) => (
                              <div key={stepIdx} className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center mt-0.5">
                                    {stepIdx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</h4>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                      {step.description}
                                    </p>
                                    {step.tip ? (
                                      <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                        <Lightbulb size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{step.tip}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
              <p className="text-[10px] text-slate-400">
                SmartKas School — Sistem Kas Kelas Otomatis & Real-time
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HelpGuide;
