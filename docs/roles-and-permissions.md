# Roles & Permissions — Kawan Nusa

Dokumen ini mendefinisikan seluruh **role**, **permission module**, **aksi**, dan **fitur** yang tersedia di sistem Kawan Nusa.

---

## 1. Roles (Peran)

Sistem memiliki **2 jenis role utama**:

| Role | Deskripsi |
|------|-----------|
| **Admin** | Karyawan internal (Employee) yang mengelola sistem. Memiliki akses ke panel admin dengan permission granular berdasarkan role yang ditugaskan. |
| **User** | Pengguna referral/mitra. Memiliki akses ke fitur customer, layanan, poin, edukasi, dan pengaturan akun. Tidak memiliki akses ke panel admin. |

### Admin Role & Custom Role

Admin tidak hanya memiliki satu level akses. Setiap admin (Employee) dapat ditugaskan ke **custom role** yang dibuat melalui fitur **Pengaturan Akses**. Setiap custom role mendefinisikan permission spesifik yang dimiliki admin tersebut.

**Contoh custom role:**
- `Super Admin` — akses penuh ke semua modul
- `CS Manager` — hanya akses ke Referral dan Persetujuan
- `Content Editor` — hanya akses ke Konten Edukasi

---

## 2. Permission Actions (Aksi)

Setiap permission module mendukung kombinasi dari **4 aksi** berikut:

| Kode | Aksi | Deskripsi |
|------|------|-----------|
| **L** | **Lihat** | Melihat daftar dan detail data |
| **T** | **Tambah** | Membuat/menambah data baru |
| **E** | **Edit** | Mengubah/memperbarui data yang ada |
| **H** | **Hapus** | Menghapus data |

---

## 3. Permission Modules (Modul Permission)

### Beranda

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `dashboard` | Dashboard Overview | L | Melihat ringkasan statistik: total referral, total poin, total penukaran, dan data overview lainnya di halaman beranda admin. |

---

### Referral

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `user` | Daftar Referral | L, T, E, H | Mengelola data referral/mitra. Melihat daftar user, detail profil, layanan, riwayat poin, riwayat penukaran, dan statistik. |
| `user.approval` | Persetujuan Pendaftaran | L, T, E, H | Mengelola persetujuan pendaftaran referral baru. Menerima, menolak, atau merevisi pendaftaran yang masuk. Mengubah status user (`approve`, `reject`, `revision`, `inactive`). |

**Detail aksi `user`:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| L | `GET /user`, `GET /user/:id`, `GET /user/:id/services`, `GET /user/:id/point`, `GET /user/:id/redeem`, `GET /user/:id/statistic`, `GET /user/:id/status-histories` | Lihat seluruh data referral |

**Detail aksi `user.approval`:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| E | `PATCH /user/:id/status` | Ubah status pendaftaran user |

---

### Input Poin Referral

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `point-submission` | Input Poin | L, T, E, H | Mengelola pengajuan/input poin ke user referral. Membuat submission baru, mengecek akun, menyetujui, dan menghapus. |
| `point-submission.history` | Riwayat Poin | L, T, E, H | Melihat riwayat poin yang telah disubmit dan diproses. |
| `point-submission.request` | Permintaan Penukaran | L, T, E | Mengelola permintaan penukaran poin dari user (approve/reject). |

**Detail aksi `point-submission`:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| L | `GET /point-submission`, `GET /point-submission/check-account`, `GET /point-submission/:id` | Lihat daftar dan detail submission |
| T | `POST /point-submission` | Tambah submission poin baru |
| E | `PUT /point-submission/:id`, `POST /point-submission/approve` | Edit dan setujui submission |
| H | `DELETE /point-submission/:id` | Hapus submission |

---

### Tukar Poin

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `redemption.cash` | Tunai | L, T, E, H | Mengelola penukaran poin dalam bentuk uang tunai. Melihat daftar permintaan, memproses, dan menyelesaikan penukaran. |
| `redemption.product` | Produk | L, T, E, H | Mengelola penukaran poin dalam bentuk produk fisik. Melihat daftar, memproses pengiriman, dan menyelesaikan penukaran. |
| `redemption.voucher` | Voucher | L, T, E, H | Mengelola penukaran poin dalam bentuk voucher digital. Melihat daftar, memproses, dan menyelesaikan penukaran. |

**Detail aksi `redemption.cash`:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| L | `GET /redemption/cash/list`, `GET /redemption/:id/status-histories` | Lihat daftar dan riwayat status |
| E | `PUT /redemption/cash/list/:id` | Selesaikan penukaran tunai |

**Detail aksi `redemption.product`:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| L | `GET /redemption/product/list` | Lihat daftar penukaran produk |
| E | `POST /redemption/product/list/:id`, `PUT /redemption/product/list/:id` | Proses dan selesaikan penukaran |

**Detail aksi `redemption.voucher`:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| L | `GET /redemption/voucher/list` | Lihat daftar penukaran voucher |
| E | `POST /redemption/voucher/list/:id`, `PUT /redemption/voucher/list/:id` | Proses dan selesaikan penukaran |

---

### Katalog Reward

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `catalog` | Katalog Reward | L, T, E, H | Mengelola katalog reward yang tersedia untuk ditukar oleh user. Meliputi kategori dan item reward (produk, voucher, tunai). |

**Detail aksi:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| L | `GET /catalog/:id/stock-history` | Lihat riwayat stok item |
| T | `POST /catalog/category`, `POST /catalog`, `POST /catalog/upload` | Tambah kategori, item, dan upload gambar |
| E | `PUT /catalog/category/:id`, `PUT /catalog/:id` | Edit kategori dan item |
| H | `DELETE /catalog/category/:id`, `DELETE /catalog/:id` | Hapus kategori dan item |

---

### Konten Edukasi

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `education` | Konten Edukasi | L, T, E, H | Mengelola seluruh konten edukasi: kategori, artikel, video, template produk/layanan, dan promosi layanan. |

**Detail aksi:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| T | `POST /education/category`, `POST /education/article`, `POST /education/article/upload`, `POST /education/video`, `POST /service/promotion`, `POST /template` | Tambah konten baru |
| E | `PUT /education/category/:id`, `PUT /education/article/:id`, `PUT /education/video/:id`, `PUT /service/promotion/:id`, `PUT /template/:id` | Edit konten |
| H | `DELETE /education/category/:id`, `DELETE /education/article/:id`, `DELETE /education/video/:id`, `DELETE /service/promotion/:id`, `DELETE /template/:id` | Hapus konten |

---

### Manajemen Karyawan

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `employee` | Manajemen Karyawan | L, T, E, H | Mengelola data karyawan internal (admin). Melihat daftar, menambah, mengedit, dan menghapus karyawan. |

---

### Pengaturan Akses

| Module Key | Label | Aksi Tersedia | Deskripsi |
|------------|-------|---------------|-----------|
| `role` | Pengaturan Akses | L, T, E, H | Mengelola role dan permission. Membuat custom role, menentukan permission per modul, dan menugaskan karyawan ke role. |

**Detail aksi:**
| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| L | `GET /role`, `GET /role/:id`, `GET /role/permission-matrix`, `GET /role/employees` | Lihat daftar role, detail, matrix permission, dan karyawan |
| T | `POST /role` | Tambah role baru |
| E | `PUT /role/:id` | Edit role dan permission |
| H | `DELETE /role/:id` | Hapus role |

---

## 4. Fitur User (Non-Admin)

Fitur berikut tersedia untuk role **User** dan **tidak menggunakan permission granular**:

| Fitur | Path | Deskripsi |
|-------|------|-----------|
| **Beranda** | `/` | Dashboard user: ringkasan poin, aktivitas terbaru |
| **Customer Saya** | `/customer` | Daftar customer/pelanggan milik user referral |
| **Produk dan Layanan** | `/service` | Melihat produk dan layanan yang tersedia |
| **Aktivitas Poin** | `/point/activity` | Riwayat perolehan dan penggunaan poin |
| **Tukar Poin** | `/point/redeem` | Menu penukaran poin (tunai, produk, voucher) |
| **Edukasi** | `/education` | Akses konten edukasi: artikel, video, template |
| **Pengaturan** | `/setting` | Pengaturan akun dan profil user |

---

## 5. Alur Autentikasi & Boarding

| Status | Kondisi | Akses |
|--------|---------|-------|
| Belum login | `token = null` | Hanya halaman publik (`/auth/*`) |
| Belum verifikasi email | `isVerified = false` | Hanya `/boarding/success` (info cek email) |
| Belum boarding | `isBoarding = false` | Hanya `/boarding/*` (isi data diri) |
| Status `reject` | Pendaftaran ditolak | Hanya `/boarding/success` (info ditolak) |
| Status `inactive` | Akun dinonaktifkan | Hanya `/boarding/success` (info nonaktif) |
| Status `pending` | Menunggu persetujuan | Hanya `/boarding/success` (info menunggu) |
| Status `revision` | Perlu revisi data | Hanya `/boarding/*` (revisi data) |
| Status `active` | Akun aktif | Akses penuh sesuai role |

---

## 6. Matriks Permission Lengkap

Tabel berikut menunjukkan seluruh kombinasi module × aksi yang tersedia:

| Group | Module | Lihat (L) | Tambah (T) | Edit (E) | Hapus (H) |
|-------|--------|:---------:|:----------:|:--------:|:---------:|
| Beranda | `dashboard` | ✅ | — | — | — |
| Referral | `user` | ✅ | ✅ | ✅ | ✅ |
| Referral | `user.approval` | ✅ | ✅ | ✅ | ✅ |
| Input Poin Referral | `point-submission` | ✅ | ✅ | ✅ | ✅ |
| Input Poin Referral | `point-submission.history` | ✅ | ✅ | ✅ | ✅ |
| Input Poin Referral | `point-submission.request` | ✅ | ✅ | ✅ | — |
| Tukar Poin | `redemption.cash` | ✅ | ✅ | ✅ | ✅ |
| Tukar Poin | `redemption.product` | ✅ | ✅ | ✅ | ✅ |
| Tukar Poin | `redemption.voucher` | ✅ | ✅ | ✅ | ✅ |
| Katalog Reward | `catalog` | ✅ | ✅ | ✅ | ✅ |
| Konten Edukasi | `education` | ✅ | ✅ | ✅ | ✅ |
| Manajemen Karyawan | `employee` | ✅ | ✅ | ✅ | ✅ |
| Pengaturan Akses | `role` | ✅ | ✅ | ✅ | ✅ |

> **Catatan:** Tanda `—` berarti aksi tersebut tidak tersedia untuk modul tersebut (tidak didefinisikan di `PERMISSION_MODULES`).

---

## 7. Contoh Format Permission di Database

Permission disimpan sebagai JSON di kolom `permissions` pada tabel `roles`:

```json
{
  "dashboard": ["L"],
  "user": ["L", "T", "E", "H"],
  "user.approval": ["L", "E"],
  "point-submission": ["L", "T", "E", "H"],
  "point-submission.history": ["L"],
  "point-submission.request": ["L", "E"],
  "redemption.cash": ["L", "E"],
  "redemption.product": ["L", "E"],
  "redemption.voucher": ["L", "E"],
  "catalog": ["L", "T", "E", "H"],
  "education": ["L", "T", "E", "H"],
  "employee": ["L"],
  "role": ["L", "T", "E", "H"]
}
```

### Cara kerja pengecekan:

```
permissionMiddleware('catalog', 'T')
→ Cek apakah permissions['catalog'] mengandung 'T'
→ Jika tidak → 403 Forbidden ("Insufficient permissions")
→ Jika ya → Lanjut ke handler
```
