# SmartKas School — SMK TI Bali Global Karangasem

Sistem Manajemen Uang Kas Sekolah Realtime & Transparan.

Dibangun dengan **Vite + React + TypeScript + Tailwind CSS v4 + Firebase** (Auth, Firestore, Storage).

## Fitur Utama

- **Multi-tenant** — satu admin bisa kelola banyak sekolah, kelas, jurusan.
- **Realtime** — semua data kas, siswa, pembayaran, pengeluaran sync realtime via Firestore `onSnapshot`.
- **3 role**: Admin (kepala sekolah), Guru Wali Kelas, Bendahara Kelas.
- **Matriks Checkbox Kas Mingguan** — bendahara centang langsung di tabel spreadsheet.
- **Peraturan Kas Editable** — bendahara bisa ubah nominal kas mingguan per kelas (5k → 7k → dst), otomatis berlaku ke semua siswa.
- **Anti Inspect / Anti DevTools** — F12, Ctrl+Shift+I/J/C, Ctrl+U, right-click diblokir. DevTools-detected via debugger timing & window-size gap.
- **Firebase Auth Real** — login email+password (bukan demo).
- **Bootstrap Admin** — first-run mode via tab "Setup Admin Pertama" di halaman login.


## Yang Diperbaiki dari Versi Sebelumnya

1. ✅ **Manifest.json syntax error** — dibuat ulang dengan format valid.
2. ✅ **Favicon** — pakai logo SMK TI Bali (multi-size PNG + ICO).
3. ✅ **FirebaseError: Missing or insufficient permissions** — firestore.rules diperbarui, hanya authenticated users yang boleh akses.
4. ✅ **Mode demo dihapus** — useSafeCollection tidak lagi pakai LOCAL_* fallback. Real Firebase only.
5. ✅ **Login sekarang real Firebase Auth** — password dicek, bukan diabaikan.
6. ✅ **Checkbox gagal render** — KasMatrixTable sekarang pakai `nominalKasMingguan` dinamis (sebelumnya hardcode "Rp 5.000").
7. ✅ **Bendahara bisa edit peraturan kas** — halaman Target & Peraturan Kas kelas, dengan quick-set 2k/3k/5k/7k/10k/15k/20k.
8. ✅ **Form tambah siswa disederhanakan** — cukup Nama + No Absen. Jurusan & Kelas auto-isi dari konteks.
9. ✅ **Error validasi "56000 not valid value"** — `step={500/1000/50000}` dihapus dari semua input currency. Sekarang `step="any"`.
10. ✅ **Anti-inspect / anti-devtools** — script keamanan di `index.html`.
11. ✅ **Anti Firebase key exposure** — penjelasan di README: Web API Key memang publik, keamanan datang dari Firestore Rules.

## Lisensi

Internal use untuk SMK TI Bali Global Karangasem.
