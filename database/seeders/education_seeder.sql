-- ============================================================
-- Seeder: Education (Article Categories, Articles, Videos)
-- Tables: education_categories, education_articles, education_videos
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE education_categories;
TRUNCATE TABLE education_articles;
TRUNCATE TABLE education_videos;

-- ------------------------------------------------------------
-- 1. education_categories
-- ------------------------------------------------------------
INSERT INTO `education_categories` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Internet & Jaringan',       DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)),
(2, 'Keamanan Digital',          DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)),
(3, 'Tips & Trik Internet',      DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)),
(4, 'Perangkat & Teknologi',     DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)),
(5, 'Layanan Pelanggan',         DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE));

-- ------------------------------------------------------------
-- 2. education_articles
-- ------------------------------------------------------------
INSERT INTO `education_articles` (`category_id`, `title`, `content`, `image`, `author`, `created_at`, `updated_at`) VALUES

-- Kategori: Internet & Jaringan (category_id = 1)
(
    1,
    'Apa Itu Bandwidth dan Bagaimana Cara Kerjanya?',
    '<p>Bandwidth adalah ukuran kapasitas maksimum sebuah koneksi internet untuk mentransmisikan data dalam satu waktu. Bandwidth diukur dalam satuan bit per detik (bps), kilobit per detik (Kbps), megabit per detik (Mbps), atau gigabit per detik (Gbps).</p>
<h2>Mengapa Bandwidth Penting?</h2>
<p>Semakin besar bandwidth yang Anda miliki, semakin banyak data yang dapat ditransfer sekaligus. Ini berarti halaman web memuat lebih cepat, video streaming lebih lancar, dan aktivitas unduhan menjadi lebih efisien.</p>
<h2>Bandwidth vs Kecepatan Internet</h2>
<p>Banyak orang menyamakan bandwidth dengan kecepatan internet, padahal keduanya berbeda. Bandwidth adalah kapasitas jalur data, sedangkan kecepatan internet adalah seberapa cepat data sebenarnya berpindah melalui jalur tersebut. Faktor seperti latensi, jarak server, dan kondisi jaringan turut memengaruhi kecepatan nyata yang Anda rasakan.</p>
<h2>Tips Mengoptimalkan Penggunaan Bandwidth</h2>
<ul>
<li>Batasi jumlah perangkat yang terhubung secara bersamaan.</li>
<li>Jadwalkan unduhan besar di luar jam sibuk.</li>
<li>Gunakan fitur Quality of Service (QoS) pada router untuk memprioritaskan trafik penting.</li>
<li>Perbarui firmware router secara rutin.</li>
</ul>',
    'https://picsum.photos/seed/bandwidth/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    1,
    'Perbedaan Jaringan Fiber Optik dan Kabel Tembaga',
    '<p>Saat memilih paket internet, Anda mungkin menemukan istilah <strong>fiber optik</strong> dan <strong>kabel tembaga (DSL/ADSL)</strong>. Keduanya memiliki karakteristik berbeda yang memengaruhi kualitas koneksi Anda.</p>
<h2>Fiber Optik</h2>
<p>Fiber optik menggunakan cahaya untuk mentransmisikan data melalui serat kaca tipis. Teknologi ini menawarkan kecepatan hingga ribuan Mbps, latensi sangat rendah, dan tidak rentan terhadap interferensi elektromagnetik. Ideal untuk streaming 4K, gaming online, dan kebutuhan bisnis.</p>
<h2>Kabel Tembaga (DSL)</h2>
<p>Kabel tembaga menggunakan sinyal listrik untuk mengirim data. Kecepatan maksimalnya lebih rendah dibanding fiber, dan performanya dapat menurun seiring bertambahnya jarak dari node terdekat. Namun infrastrukturnya lebih luas dan biaya pemasangannya relatif lebih murah.</p>
<h2>Mana yang Lebih Baik?</h2>
<p>Jika tersedia di area Anda, fiber optik adalah pilihan terbaik untuk kebutuhan internet modern. Kawan Nusa menghadirkan layanan berbasis fiber optik untuk memastikan Anda mendapatkan pengalaman internet tercepat dan terandal.</p>',
    'https://picsum.photos/seed/fiber-optik/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Keamanan Digital (category_id = 2)
(
    2,
    'Cara Membuat Password yang Kuat dan Aman',
    '<p>Password adalah garis pertahanan pertama akun digital Anda. Password yang lemah adalah celah terbesar yang dimanfaatkan peretas untuk masuk ke akun Anda.</p>
<h2>Ciri-Ciri Password yang Kuat</h2>
<ul>
<li>Minimal 12 karakter.</li>
<li>Kombinasi huruf besar, huruf kecil, angka, dan simbol.</li>
<li>Tidak mengandung informasi pribadi (nama, tanggal lahir).</li>
<li>Unik untuk setiap akun — jangan gunakan password yang sama di dua tempat.</li>
</ul>
<h2>Contoh Password yang Buruk vs Baik</h2>
<p><strong>Buruk:</strong> password123, nama123, 12345678</p>
<p><strong>Baik:</strong> K@wan#Nusa2024!, mX9$rTq2@vLp</p>
<h2>Gunakan Password Manager</h2>
<p>Sulit mengingat puluhan password unik? Gunakan aplikasi <em>password manager</em> seperti Bitwarden atau 1Password. Anda hanya perlu mengingat satu master password, sisanya dikelola secara aman oleh aplikasi.</p>
<h2>Aktifkan Two-Factor Authentication (2FA)</h2>
<p>Selain password kuat, aktifkan 2FA di setiap akun yang mendukungnya. Dengan 2FA, bahkan jika password Anda bocor, akun Anda tetap terlindungi.</p>',
    'https://picsum.photos/seed/password-aman/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    2,
    'Mengenali dan Menghindari Phishing di Internet',
    '<p>Phishing adalah teknik penipuan online di mana pelaku menyamar sebagai entitas terpercaya untuk mencuri informasi sensitif seperti username, password, atau data kartu kredit.</p>
<h2>Tanda-Tanda Pesan Phishing</h2>
<ul>
<li>Pengirim email mencurigakan — domainnya mirip tapi bukan situs resmi (contoh: support@kawan-nusa.co vs kawan-nusa.id).</li>
<li>Meminta Anda mengklik tautan segera atau ancaman akun akan dinonaktifkan.</li>
<li>Tata bahasa buruk, banyak typo, atau terjemahan yang canggung.</li>
<li>URL yang ditampilkan berbeda dengan URL asli saat Anda arahkan kursor.</li>
</ul>
<h2>Cara Melindungi Diri</h2>
<ul>
<li>Jangan klik tautan dari email atau SMS yang tidak Anda harapkan.</li>
<li>Selalu ketik alamat website langsung di browser, jangan dari link.</li>
<li>Periksa sertifikat HTTPS dan domain sebelum memasukkan data sensitif.</li>
<li>Laporkan email mencurigakan ke penyedia layanan email Anda.</li>
</ul>',
    'https://picsum.photos/seed/phishing/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Tips & Trik Internet (category_id = 3)
(
    3,
    '5 Cara Mempercepat Koneksi Wi-Fi di Rumah',
    '<p>Koneksi Wi-Fi yang lambat bisa mengganggu produktivitas dan hiburan Anda. Berikut lima cara sederhana yang dapat langsung Anda terapkan.</p>
<h2>1. Posisikan Router di Tempat Strategis</h2>
<p>Letakkan router di tengah ruangan, di ketinggian yang memadai, jauh dari dinding tebal, lantai, dan perangkat elektronik lain (microwave, telepon cordless). Sinyal Wi-Fi menyebar ke segala arah, sehingga posisi sentral memberikan jangkauan optimal.</p>
<h2>2. Gunakan Frekuensi 5 GHz</h2>
<p>Jika router Anda mendukung dual-band, gunakan frekuensi 5 GHz untuk perangkat yang berada dekat router. Frekuensi ini lebih cepat dan lebih sedikit gangguan dibanding 2,4 GHz, meski jangkauannya lebih pendek.</p>
<h2>3. Perbarui Firmware Router</h2>
<p>Produsen router secara rutin merilis pembaruan firmware yang memperbaiki bug dan meningkatkan performa. Cek panel admin router Anda (biasanya di 192.168.1.1) dan perbarui jika tersedia.</p>
<h2>4. Ubah Channel Wi-Fi</h2>
<p>Jika banyak jaringan Wi-Fi tetangga menggunakan channel yang sama, Anda akan mengalami interferensi. Gunakan aplikasi seperti <em>WiFi Analyzer</em> untuk menemukan channel yang paling sepi dan ganti pengaturan router Anda.</p>
<h2>5. Restart Router Secara Berkala</h2>
<p>Restart router seminggu sekali membantu membersihkan cache dan memperbarui koneksi ke ISP. Ini solusi sederhana namun sering kali efektif untuk meningkatkan performa.</p>',
    'https://picsum.photos/seed/wifi-speed/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    3,
    'Cara Melakukan Speedtest Internet dengan Benar',
    '<p>Speedtest adalah cara paling umum untuk mengukur kecepatan internet Anda. Namun banyak orang melakukannya dengan cara yang kurang tepat sehingga hasilnya tidak akurat.</p>
<h2>Persiapan Sebelum Speedtest</h2>
<ul>
<li>Tutup semua aplikasi yang menggunakan internet (streaming, update, cloud sync).</li>
<li>Sambungkan perangkat langsung ke router via kabel LAN untuk hasil paling akurat.</li>
<li>Jika menggunakan Wi-Fi, dekatkan perangkat ke router.</li>
<li>Pastikan tidak ada perangkat lain yang aktif menggunakan jaringan saat pengujian.</li>
</ul>
<h2>Cara Melakukan Speedtest</h2>
<p>Kunjungi <strong>fast.com</strong> atau <strong>speedtest.net</strong> dan klik tombol mulai. Catat hasilnya: <em>Download Speed</em>, <em>Upload Speed</em>, dan <em>Ping/Latency</em>.</p>
<h2>Memahami Hasil Speedtest</h2>
<ul>
<li><strong>Download Speed:</strong> Kecepatan menerima data dari internet — memengaruhi streaming dan browsing.</li>
<li><strong>Upload Speed:</strong> Kecepatan mengirim data ke internet — memengaruhi video call dan upload file.</li>
<li><strong>Ping:</strong> Waktu respons dalam milidetik — semakin kecil semakin baik, krusial untuk gaming.</li>
</ul>
<p>Jika hasil speedtest jauh di bawah paket yang Anda berlangganan, hubungi tim support Kawan Nusa untuk pengecekan lebih lanjut.</p>',
    'https://picsum.photos/seed/speedtest/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Perangkat & Teknologi (category_id = 4)
(
    4,
    'Panduan Memilih Router Wi-Fi yang Tepat untuk Rumah',
    '<p>Router yang tepat adalah kunci jaringan rumah yang andal. Dengan begitu banyak pilihan di pasaran, berikut panduan singkat untuk membantu Anda memilih.</p>
<h2>Sesuaikan dengan Luas Rumah</h2>
<p>Untuk apartemen atau rumah kecil (&lt;70 m²), router single-band atau dual-band standar sudah cukup. Rumah menengah (70–150 m²) memerlukan router dual-band dengan antena external. Untuk rumah besar (&gt;150 m²) atau banyak lantai, pertimbangkan sistem <em>mesh Wi-Fi</em>.</p>
<h2>Perhatikan Standar Wi-Fi</h2>
<ul>
<li><strong>Wi-Fi 5 (802.11ac):</strong> Cukup untuk kebutuhan sehari-hari, kecepatan hingga 3,5 Gbps teoritis.</li>
<li><strong>Wi-Fi 6 (802.11ax):</strong> Lebih efisien untuk banyak perangkat sekaligus, cocok untuk rumah pintar dan smart devices.</li>
<li><strong>Wi-Fi 6E:</strong> Tambahan band 6 GHz, performa terbaik saat ini namun harganya masih premium.</li>
</ul>
<h2>Fitur Penting yang Perlu Ada</h2>
<ul>
<li>Port LAN Gigabit untuk perangkat kabel.</li>
<li>Dual-band atau tri-band untuk fleksibilitas.</li>
<li>Fitur QoS (Quality of Service) untuk prioritas trafik.</li>
<li>Kontrol parental untuk membatasi akses anak.</li>
</ul>',
    'https://picsum.photos/seed/router-guide/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Layanan Pelanggan (category_id = 5)
(
    5,
    'Cara Melaporkan Gangguan Internet ke Kawan Nusa',
    '<p>Mengalami gangguan internet? Jangan khawatir, tim support Kawan Nusa siap membantu Anda 24/7. Berikut langkah-langkah untuk melaporkan gangguan secara efektif.</p>
<h2>Langkah 1: Lakukan Pengecekan Awal</h2>
<ul>
<li>Restart modem dan router Anda — matikan selama 30 detik lalu hidupkan kembali.</li>
<li>Periksa lampu indikator pada modem. Lampu WAN/Internet yang berkedip merah menandakan gangguan dari sisi jaringan.</li>
<li>Coba koneksi dari perangkat lain untuk memastikan masalah bukan dari perangkat Anda.</li>
</ul>
<h2>Langkah 2: Siapkan Informasi Penting</h2>
<p>Sebelum menghubungi support, siapkan: ID pelanggan, alamat pemasangan, jenis gangguan yang dialami, dan hasil speedtest (jika internet masih bisa diakses).</p>
<h2>Langkah 3: Hubungi Support Kawan Nusa</h2>
<p>Anda dapat menghubungi kami melalui:</p>
<ul>
<li><strong>Aplikasi Kawan Nusa:</strong> Menu Bantuan → Laporkan Gangguan.</li>
<li><strong>WhatsApp:</strong> Nomor resmi customer service kami.</li>
<li><strong>Telepon:</strong> Call center 24 jam.</li>
</ul>
<p>Tim kami akan merespons laporan Anda dalam waktu sesingkat mungkin dan menginformasikan estimasi waktu penyelesaian.</p>',
    'https://picsum.photos/seed/gangguan-internet/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
);

-- ------------------------------------------------------------
-- 3. education_videos
-- ------------------------------------------------------------
INSERT INTO `education_videos` (`category_id`, `title`, `url`, `thumbnail`, `description`, `author`, `created_at`, `updated_at`) VALUES

-- Kategori: Internet & Jaringan (category_id = 1)
(
    1,
    'Bagaimana Internet Bekerja? Penjelasan Sederhana',
    'https://www.youtube.com/watch?v=x3c1ih2NJEg',
    'https://picsum.photos/seed/internet-works/800/450',
    'Video ini menjelaskan secara visual bagaimana data perjalanan dari perangkat Anda menuju server di seluruh dunia dan kembali lagi. Cocok untuk pemula yang ingin memahami dasar-dasar cara kerja internet.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    1,
    'Memahami IP Address: IPv4 dan IPv6',
    'https://www.youtube.com/watch?v=5WfiTHiU4x8',
    'https://picsum.photos/seed/ip-address/800/450',
    'Pelajari apa itu IP Address, perbedaan antara IPv4 dan IPv6, serta mengapa transisi ke IPv6 sangat penting untuk masa depan internet yang terus berkembang.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Keamanan Digital (category_id = 2)
(
    2,
    'Cara Mengamankan Jaringan Wi-Fi Rumah Anda',
    'https://www.youtube.com/watch?v=YMuSfMzJmEo',
    'https://picsum.photos/seed/wifi-security/800/450',
    'Tutorial langkah demi langkah untuk mengamankan router Wi-Fi rumah Anda: mengganti password default, mengaktifkan enkripsi WPA3, menonaktifkan WPS, dan membuat jaringan tamu untuk tamu Anda.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    2,
    'Apa Itu VPN dan Kapan Harus Menggunakannya?',
    'https://www.youtube.com/watch?v=R-JUOpCgTZc',
    'https://picsum.photos/seed/vpn-guide/800/450',
    'Penjelasan lengkap tentang Virtual Private Network (VPN): cara kerjanya, manfaat untuk privasi dan keamanan online, serta kapan Anda benar-benar membutuhkannya — dan kapan tidak.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Tips & Trik Internet (category_id = 3)
(
    3,
    'Trik Tersembunyi Browser yang Wajib Kamu Tahu',
    'https://www.youtube.com/watch?v=TY2vHhFoizA',
    'https://picsum.photos/seed/browser-tricks/800/450',
    'Temukan fitur-fitur tersembunyi di browser populer seperti Chrome dan Firefox yang dapat meningkatkan produktivitas Anda saat berselancar di internet setiap harinya.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    3,
    'Cara Menghemat Kuota Internet di Smartphone',
    'https://www.youtube.com/watch?v=nK6gfBqstos',
    'https://picsum.photos/seed/hemat-kuota/800/450',
    'Tips praktis untuk mengurangi penggunaan data seluler di Android dan iOS: mulai dari membatasi sinkronisasi background, mengompres data di browser, hingga memanfaatkan Wi-Fi secara optimal.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Perangkat & Teknologi (category_id = 4)
(
    4,
    'Setup Jaringan Rumah yang Optimal: Router, Switch, dan Access Point',
    'https://www.youtube.com/watch?v=oopHlRDEV0A',
    'https://picsum.photos/seed/jaringan-rumah/800/450',
    'Panduan visual lengkap tentang cara membangun jaringan rumah yang handal. Video ini membahas topologi jaringan sederhana, penempatan perangkat, dan konfigurasi dasar untuk koneksi yang stabil di seluruh sudut rumah.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    4,
    'Mengenal Teknologi Mesh Wi-Fi: Solusi untuk Rumah Besar',
    'https://www.youtube.com/watch?v=X8WKZN2a1XU',
    'https://picsum.photos/seed/mesh-wifi/800/450',
    'Apakah sinyal Wi-Fi Anda tidak merata di seluruh rumah? Pelajari bagaimana sistem mesh Wi-Fi bekerja, apa bedanya dengan extender biasa, dan apakah ini solusi yang tepat untuk kebutuhan Anda.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Layanan Pelanggan (category_id = 5)
(
    5,
    'Panduan Lengkap Aplikasi Kawan Nusa untuk Pelanggan',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://picsum.photos/seed/app-kawannusa/800/450',
    'Tutorial penggunaan aplikasi Kawan Nusa: cara cek tagihan, melaporkan gangguan, melihat riwayat pembayaran, mengubah paket langganan, dan memanfaatkan fitur-fitur lainnya yang tersedia untuk pelanggan.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    5,
    'Cara Membaca Tagihan Internet dan Memahami Paket Layanan',
    'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    'https://picsum.photos/seed/tagihan-internet/800/450',
    'Panduan memahami detail tagihan internet Anda: rincian biaya, tanggal jatuh tempo, cara pembayaran, dan penjelasan tentang setiap komponen paket layanan Kawan Nusa yang Anda gunakan.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
);

-- ------------------------------------------------------------
-- 4. Tambahan 15 education_articles
-- ------------------------------------------------------------
INSERT INTO `education_articles` (`category_id`, `title`, `content`, `image`, `author`, `created_at`, `updated_at`) VALUES

-- Kategori: Internet & Jaringan (category_id = 1)
(
    1,
    'Apa Itu DNS dan Bagaimana Cara Kerjanya?',
    '<p>DNS (Domain Name System) adalah sistem yang menerjemahkan nama domain seperti <strong>kawannusa.id</strong> menjadi alamat IP yang dapat dimengerti oleh komputer. Tanpa DNS, kita harus menghafal deretan angka seperti 203.0.113.42 untuk mengakses setiap website.</p>
<h2>Cara Kerja DNS</h2>
<p>Ketika Anda mengetik sebuah alamat website di browser, komputer Anda akan menghubungi <em>DNS resolver</em> untuk mencari tahu alamat IP yang sesuai. Proses ini berlangsung dalam hitungan milidetik dan sepenuhnya transparan bagi pengguna.</p>
<h2>DNS Publik yang Populer</h2>
<ul>
<li><strong>Google DNS:</strong> 8.8.8.8 dan 8.8.4.4 — cepat dan andal.</li>
<li><strong>Cloudflare DNS:</strong> 1.1.1.1 dan 1.0.0.1 — fokus pada privasi pengguna.</li>
<li><strong>OpenDNS:</strong> 208.67.222.222 — dilengkapi fitur pemfilteran konten.</li>
</ul>
<h2>Manfaat Mengganti DNS</h2>
<p>Mengganti DNS default dari ISP ke DNS publik dapat mempercepat resolusi nama domain, meningkatkan privasi, dan terkadang membantu mengakses situs yang diblokir oleh DNS lokal.</p>',
    'https://picsum.photos/seed/dns-cara-kerja/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    1,
    'Mengenal Protokol HTTP dan HTTPS: Apa Bedanya?',
    '<p>Setiap kali Anda mengunjungi sebuah website, browser Anda berkomunikasi dengan server menggunakan protokol tertentu. Dua protokol paling umum adalah <strong>HTTP</strong> (HyperText Transfer Protocol) dan <strong>HTTPS</strong> (HTTP Secure).</p>
<h2>HTTP</h2>
<p>HTTP adalah protokol dasar untuk transfer data di web. Data yang dikirimkan melalui HTTP tidak dienkripsi, artinya siapa pun yang "mendengarkan" jaringan Anda berpotensi membaca informasi yang dikirimkan.</p>
<h2>HTTPS</h2>
<p>HTTPS menambahkan lapisan keamanan berupa enkripsi SSL/TLS di atas HTTP. Semua data yang dikirimkan dienkripsi sehingga tidak dapat dibaca oleh pihak ketiga. Ini sangat penting untuk aktivitas seperti login, transaksi perbankan, dan pengisian formulir.</p>
<h2>Cara Mengenali HTTPS</h2>
<p>Perhatikan ikon gembok di address bar browser Anda. Jika gembok terkunci dan berwarna hijau/abu-abu, koneksi Anda aman menggunakan HTTPS. Hindari memasukkan data sensitif di situs yang masih menggunakan HTTP.</p>',
    'https://picsum.photos/seed/http-https/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    1,
    'Apa Itu Latency dan Mengapa Penting untuk Gaming Online?',
    '<p>Latency (atau <em>ping</em>) adalah waktu yang dibutuhkan data untuk melakukan perjalanan dari perangkat Anda ke server dan kembali lagi. Diukur dalam milidetik (ms), latency yang rendah sangat krusial untuk aktivitas real-time seperti gaming online dan video call.</p>
<h2>Klasifikasi Latency</h2>
<ul>
<li><strong>0–20 ms:</strong> Sangat baik — ideal untuk gaming kompetitif.</li>
<li><strong>20–50 ms:</strong> Baik — nyaman untuk hampir semua aktivitas online.</li>
<li><strong>50–100 ms:</strong> Cukup — terasa sedikit lag pada game fast-paced.</li>
<li><strong>100 ms ke atas:</strong> Tinggi — lag terasa jelas, mengganggu gaming dan video call.</li>
</ul>
<h2>Faktor Penyebab Latency Tinggi</h2>
<ul>
<li>Jarak fisik antara Anda dan server game.</li>
<li>Kemacetan jaringan (banyak pengguna aktif bersamaan).</li>
<li>Kualitas kabel atau perangkat jaringan yang buruk.</li>
<li>Penggunaan Wi-Fi dibanding kabel LAN.</li>
</ul>
<h2>Tips Mengurangi Latency</h2>
<p>Gunakan koneksi kabel LAN, pilih server game yang lokasinya paling dekat, dan pastikan tidak ada unduhan besar yang berjalan di background saat bermain.</p>',
    'https://picsum.photos/seed/latency-gaming/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Keamanan Digital (category_id = 2)
(
    2,
    'Cara Aman Berbelanja Online: Panduan Lengkap',
    '<p>Belanja online semakin mudah, namun ancaman penipuan digital juga ikut berkembang. Berikut panduan agar pengalaman belanja online Anda tetap aman.</p>
<h2>Pilih Platform Terpercaya</h2>
<p>Belanja hanya di marketplace atau toko online yang sudah terverifikasi dan memiliki reputasi baik. Perhatikan ulasan pembeli lain dan pastikan toko memiliki rating yang konsisten.</p>
<h2>Perhatikan Keamanan Pembayaran</h2>
<ul>
<li>Gunakan metode pembayaran yang menawarkan perlindungan pembeli (kartu kredit, dompet digital resmi).</li>
<li>Hindari transfer langsung ke rekening pribadi penjual yang tidak dikenal.</li>
<li>Pastikan halaman checkout menggunakan HTTPS sebelum memasukkan data kartu.</li>
</ul>
<h2>Waspadai Harga Tidak Masuk Akal</h2>
<p>Penawaran dengan harga jauh di bawah pasaran sering kali adalah jebakan. Jika terlalu bagus untuk jadi kenyataan, kemungkinan besar itu adalah penipuan.</p>
<h2>Gunakan Jaringan yang Aman</h2>
<p>Hindari berbelanja online menggunakan Wi-Fi publik tanpa VPN. Jaringan publik rentan terhadap penyadapan data oleh pihak yang tidak bertanggung jawab.</p>',
    'https://picsum.photos/seed/belanja-online-aman/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    2,
    'Mengenal Malware: Jenis, Cara Kerja, dan Pencegahannya',
    '<p>Malware (malicious software) adalah istilah umum untuk berbagai jenis perangkat lunak berbahaya yang dirancang untuk merusak, mencuri data, atau mengganggu sistem komputer Anda.</p>
<h2>Jenis-Jenis Malware</h2>
<ul>
<li><strong>Virus:</strong> Menyebar dengan menginfeksi file lain dan mereplikasi dirinya sendiri.</li>
<li><strong>Trojan:</strong> Menyamar sebagai program berguna tetapi menjalankan aksi berbahaya di background.</li>
<li><strong>Ransomware:</strong> Mengenkripsi data Anda dan meminta tebusan untuk memulihkannya.</li>
<li><strong>Spyware:</strong> Memantau aktivitas Anda secara diam-diam dan mengirim data ke penyerang.</li>
<li><strong>Adware:</strong> Menampilkan iklan secara agresif dan tidak diinginkan.</li>
</ul>
<h2>Cara Pencegahan</h2>
<ul>
<li>Pasang antivirus dan perbarui secara rutin.</li>
<li>Jangan mengunduh software dari sumber tidak resmi.</li>
<li>Perbarui sistem operasi dan aplikasi secara berkala.</li>
<li>Hati-hati dengan lampiran email dari pengirim tidak dikenal.</li>
</ul>',
    'https://picsum.photos/seed/malware-jenis/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    2,
    'Keamanan Media Sosial: Lindungi Akun Anda dari Peretasan',
    '<p>Media sosial menjadi target utama peretas karena menyimpan banyak informasi pribadi. Berikut langkah-langkah untuk melindungi akun media sosial Anda.</p>
<h2>Gunakan Password Unik di Setiap Platform</h2>
<p>Jangan pernah menggunakan password yang sama untuk Instagram, Facebook, Twitter, dan platform lainnya. Jika satu akun diretas, akun lain tetap aman.</p>
<h2>Aktifkan Verifikasi Dua Langkah</h2>
<p>Hampir semua platform media sosial kini mendukung Two-Factor Authentication (2FA). Aktifkan fitur ini sehingga login memerlukan kode tambahan selain password.</p>
<h2>Pantau Aktivitas Login</h2>
<p>Secara berkala cek riwayat login di pengaturan akun. Jika ada login dari lokasi atau perangkat yang tidak Anda kenali, segera ubah password dan keluarkan semua sesi aktif.</p>
<h2>Batasi Aplikasi Pihak Ketiga</h2>
<p>Tinjau aplikasi yang memiliki akses ke akun media sosial Anda di menu pengaturan. Cabut akses aplikasi yang sudah tidak digunakan atau tidak Anda kenali.</p>',
    'https://picsum.photos/seed/keamanan-medsos/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Tips & Trik Internet (category_id = 3)
(
    3,
    'Cara Menggunakan Google dengan Lebih Efektif',
    '<p>Google adalah mesin pencari paling populer di dunia, namun sebagian besar pengguna hanya menggunakan segelintir fiturnya. Berikut tips untuk memaksimalkan pencarian Google Anda.</p>
<h2>Operator Pencarian Berguna</h2>
<ul>
<li><strong>Tanda kutip (""):</strong> Cari frasa tepat. Contoh: <code>"cara setting router"</code></li>
<li><strong>site:</strong> Cari di dalam satu website. Contoh: <code>site:kawannusa.id promo</code></li>
<li><strong>filetype:</strong> Cari jenis file tertentu. Contoh: <code>tutorial jaringan filetype:pdf</code></li>
<li><strong>Tanda minus (-):</strong> Kecualikan kata tertentu. Contoh: <code>router review -Xiaomi</code></li>
</ul>
<h2>Fitur Tersembunyi Google</h2>
<ul>
<li>Ketik <strong>"kalkulator"</strong> untuk langsung membuka kalkulator di Google.</li>
<li>Ketik <strong>"cuaca [kota]"</strong> untuk informasi cuaca real-time.</li>
<li>Ketik <strong>"konversi [nilai] [satuan] ke [satuan]"</strong> untuk konversi satuan.</li>
</ul>',
    'https://picsum.photos/seed/google-efektif/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    3,
    'Manfaat dan Cara Menggunakan Cloud Storage',
    '<p>Cloud storage memungkinkan Anda menyimpan file di server online yang dapat diakses dari mana saja dan kapan saja. Ini adalah solusi modern untuk backup data dan kolaborasi tim.</p>
<h2>Layanan Cloud Storage Populer</h2>
<ul>
<li><strong>Google Drive:</strong> 15 GB gratis, terintegrasi dengan layanan Google.</li>
<li><strong>OneDrive:</strong> Terintegrasi dengan Windows dan Microsoft 365.</li>
<li><strong>Dropbox:</strong> Sinkronisasi lintas perangkat yang sangat andal.</li>
<li><strong>iCloud:</strong> Pilihan utama untuk pengguna ekosistem Apple.</li>
</ul>
<h2>Tips Menggunakan Cloud Storage dengan Aman</h2>
<ul>
<li>Aktifkan enkripsi end-to-end jika tersedia.</li>
<li>Jangan menyimpan dokumen sangat sensitif (seperti KTP scan, password) tanpa enkripsi tambahan.</li>
<li>Atur izin berbagi file dengan teliti — bedakan antara "hanya melihat" dan "dapat mengedit".</li>
<li>Aktifkan autentikasi dua faktor pada akun cloud storage Anda.</li>
</ul>',
    'https://picsum.photos/seed/cloud-storage/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    3,
    'Cara Kerja Algoritma Rekomendasi di Platform Streaming',
    '<p>Pernahkah Anda bertanya-tanya bagaimana YouTube, Netflix, atau Spotify selalu tahu apa yang ingin Anda tonton atau dengarkan berikutnya? Jawabannya ada pada <strong>algoritma rekomendasi</strong>.</p>
<h2>Apa yang Dipantau Algoritma?</h2>
<ul>
<li>Konten yang Anda tonton, seberapa lama, dan apakah Anda menontonnya sampai selesai.</li>
<li>Video atau lagu yang Anda like, share, atau simpan.</li>
<li>Waktu dan frekuensi Anda menggunakan platform.</li>
<li>Konten yang Anda cari secara aktif.</li>
</ul>
<h2>Dampak pada Pengguna</h2>
<p>Algoritma dirancang untuk memaksimalkan waktu Anda di platform. Meski memudahkan penemuan konten baru, ini juga bisa menciptakan <em>filter bubble</em> — kondisi di mana Anda hanya terekspos pada sudut pandang atau jenis konten yang sama terus-menerus.</p>
<h2>Cara Mengelola Rekomendasi</h2>
<p>Bersihkan riwayat tontonan secara berkala, gunakan fitur "Tidak Tertarik" untuk konten yang tidak relevan, dan secara aktif mencari konten dari topik baru yang ingin Anda eksplorasi.</p>',
    'https://picsum.photos/seed/algoritma-streaming/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Perangkat & Teknologi (category_id = 4)
(
    4,
    'Perbedaan Modem dan Router: Fungsi dan Cara Kerjanya',
    '<p>Banyak orang mengira modem dan router adalah perangkat yang sama, padahal keduanya memiliki fungsi yang berbeda. Memahami perbedaannya membantu Anda melakukan troubleshooting jaringan dengan lebih baik.</p>
<h2>Modem</h2>
<p>Modem (Modulator-Demodulator) adalah perangkat yang menghubungkan rumah Anda ke internet melalui saluran dari ISP (seperti Kawan Nusa). Modem menerjemahkan sinyal dari ISP menjadi sinyal digital yang bisa digunakan perangkat Anda.</p>
<h2>Router</h2>
<p>Router adalah perangkat yang mendistribusikan koneksi internet dari modem ke berbagai perangkat di rumah, baik melalui kabel LAN maupun Wi-Fi. Router juga bertanggung jawab atas keamanan jaringan lokal Anda.</p>
<h2>Modem-Router Combo</h2>
<p>Banyak ISP menyediakan perangkat kombinasi modem dan router dalam satu unit untuk memudahkan instalasi. Meski praktis, perangkat terpisah umumnya menawarkan performa dan fleksibilitas yang lebih baik.</p>',
    'https://picsum.photos/seed/modem-vs-router/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    4,
    'Mengenal Internet of Things (IoT) dan Penerapannya di Rumah',
    '<p>Internet of Things (IoT) adalah konsep di mana perangkat fisik sehari-hari terhubung ke internet dan dapat berkomunikasi satu sama lain. Dari lampu pintar hingga kulkas yang bisa memesan belanjaan sendiri, IoT mengubah cara kita berinteraksi dengan lingkungan sekitar.</p>
<h2>Contoh Perangkat IoT di Rumah</h2>
<ul>
<li><strong>Smart Speaker:</strong> Google Home, Amazon Echo — kontrol rumah dengan suara.</li>
<li><strong>Smart Lock:</strong> Kunci pintu yang bisa dikontrol dari smartphone.</li>
<li><strong>Smart Thermostat:</strong> Pengatur suhu otomatis yang belajar kebiasaan Anda.</li>
<li><strong>Kamera CCTV IP:</strong> Pantau rumah dari mana saja via internet.</li>
<li><strong>Smart TV:</strong> Televisi yang terhubung ke internet untuk streaming dan aplikasi.</li>
</ul>
<h2>Keamanan Perangkat IoT</h2>
<p>Setiap perangkat IoT yang terhubung ke jaringan Anda adalah potensi celah keamanan. Pastikan untuk mengganti password default, memperbarui firmware secara rutin, dan menggunakan jaringan tamu (guest network) khusus untuk perangkat IoT.</p>',
    'https://picsum.photos/seed/iot-rumah/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Layanan Pelanggan (category_id = 5)
(
    5,
    'Panduan Upgrade dan Downgrade Paket Internet Kawan Nusa',
    '<p>Kebutuhan internet Anda dapat berubah seiring waktu. Kawan Nusa memberikan kemudahan untuk menyesuaikan paket langganan Anda kapan saja sesuai kebutuhan.</p>
<h2>Kapan Perlu Upgrade Paket?</h2>
<ul>
<li>Koneksi terasa lambat padahal speedtest menunjukkan kecepatan sesuai paket.</li>
<li>Jumlah pengguna di rumah bertambah (WFH, anak sekolah online).</li>
<li>Mulai menggunakan layanan yang butuh bandwidth besar (4K streaming, cloud gaming).</li>
</ul>
<h2>Kapan Bisa Downgrade?</h2>
<ul>
<li>Penggunaan internet menurun secara signifikan.</li>
<li>Ingin menghemat biaya bulanan.</li>
</ul>
<h2>Cara Mengubah Paket</h2>
<p>Perubahan paket dapat dilakukan melalui aplikasi Kawan Nusa di menu <strong>Paket & Layanan</strong>, atau dengan menghubungi customer service kami. Perubahan umumnya aktif pada siklus tagihan berikutnya.</p>',
    'https://picsum.photos/seed/upgrade-paket/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    5,
    'Cara Pembayaran Tagihan Internet Kawan Nusa',
    '<p>Kawan Nusa menyediakan berbagai metode pembayaran yang fleksibel untuk memudahkan Anda melunasi tagihan internet bulanan tepat waktu.</p>
<h2>Metode Pembayaran Tersedia</h2>
<ul>
<li><strong>Transfer Bank:</strong> BCA, Mandiri, BRI, BNI, dan bank lainnya.</li>
<li><strong>Dompet Digital:</strong> GoPay, OVO, Dana, ShopeePay.</li>
<li><strong>Minimarket:</strong> Alfamart dan Indomaret dengan kode pembayaran unik.</li>
<li><strong>Auto Debit:</strong> Pembayaran otomatis dari rekening atau kartu yang terdaftar.</li>
<li><strong>Aplikasi Kawan Nusa:</strong> Pembayaran langsung dari aplikasi.</li>
</ul>
<h2>Tips Agar Tidak Telat Bayar</h2>
<ul>
<li>Aktifkan fitur Auto Debit untuk pembayaran otomatis setiap bulan.</li>
<li>Atur pengingat di kalender sesuai tanggal jatuh tempo tagihan Anda.</li>
<li>Aktifkan notifikasi tagihan di aplikasi Kawan Nusa.</li>
</ul>',
    'https://picsum.photos/seed/cara-bayar-tagihan/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    5,
    'FAQ: Pertanyaan Umum Pelanggan Kawan Nusa',
    '<p>Berikut kumpulan pertanyaan yang paling sering diajukan pelanggan Kawan Nusa beserta jawabannya.</p>
<h2>Q: Berapa lama proses pemasangan internet baru?</h2>
<p>A: Estimasi waktu pemasangan adalah 1–3 hari kerja setelah survei lokasi disetujui, tergantung ketersediaan jadwal teknisi dan kondisi area pemasangan.</p>
<h2>Q: Apa yang harus dilakukan jika internet mati tiba-tiba?</h2>
<p>A: Pertama, restart modem dan router. Periksa lampu indikator — jika lampu WAN mati atau berkedip merah, ada gangguan dari sisi jaringan. Hubungi support kami jika masalah berlanjut lebih dari 15 menit.</p>
<h2>Q: Apakah ada batas kuota penggunaan?</h2>
<p>A: Semua paket Kawan Nusa menggunakan sistem <em>unlimited</em> — tidak ada batas kuota bulanan. Kecepatan yang Anda dapatkan adalah kecepatan sesuai paket yang berlangganan.</p>
<h2>Q: Bisakah saya memindahkan layanan ke alamat baru?</h2>
<p>A: Bisa. Hubungi customer service kami minimal 3 hari sebelum tanggal pindah untuk menjadwalkan pemasangan ulang di lokasi baru.</p>',
    'https://picsum.photos/seed/faq-kawannusa/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    1,
    'Cara Kerja Wi-Fi 6: Teknologi Internet Generasi Terbaru',
    '<p>Wi-Fi 6 (802.11ax) adalah standar Wi-Fi terbaru yang menawarkan peningkatan signifikan dibanding generasi sebelumnya. Bukan sekadar lebih cepat, Wi-Fi 6 dirancang untuk lebih efisien di lingkungan dengan banyak perangkat terhubung secara bersamaan.</p>
<h2>Keunggulan Wi-Fi 6</h2>
<ul>
<li><strong>Kecepatan lebih tinggi:</strong> Kecepatan teoritis hingga 9,6 Gbps, hampir 3x lipat Wi-Fi 5.</li>
<li><strong>Kapasitas lebih besar:</strong> Teknologi OFDMA memungkinkan router melayani lebih banyak perangkat secara bersamaan tanpa penurunan performa.</li>
<li><strong>Efisiensi daya:</strong> Fitur Target Wake Time (TWT) membuat perangkat baterai lebih hemat energi.</li>
<li><strong>Latensi lebih rendah:</strong> Ideal untuk gaming online dan video conference.</li>
</ul>
<h2>Apakah Perlu Upgrade ke Wi-Fi 6?</h2>
<p>Jika Anda memiliki banyak perangkat smart home, sering melakukan streaming 4K, atau butuh koneksi stabil untuk WFH dan gaming, upgrade ke router Wi-Fi 6 adalah investasi yang worthwhile. Pastikan perangkat Anda juga mendukung Wi-Fi 6 untuk menikmati manfaat penuhnya.</p>',
    'https://picsum.photos/seed/wifi6-teknologi/800/450',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
);

-- ------------------------------------------------------------
-- 5. Tambahan 15 education_videos
-- ------------------------------------------------------------
INSERT INTO `education_videos` (`category_id`, `title`, `url`, `thumbnail`, `description`, `author`, `created_at`, `updated_at`) VALUES

-- Kategori: Internet & Jaringan (category_id = 1)
(
    1,
    'DNS Explained: Cara Internet Menemukan Website',
    'https://www.youtube.com/watch?v=Rck3BALhI5A',
    'https://picsum.photos/seed/dns-explained/800/450',
    'Penjelasan visual tentang bagaimana sistem DNS bekerja: dari saat Anda mengetik URL di browser hingga halaman web muncul di layar Anda. Termasuk demo cara mengubah DNS untuk koneksi lebih cepat.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    1,
    'Wi-Fi 6 vs Wi-Fi 5: Perbedaan yang Perlu Kamu Tahu',
    'https://www.youtube.com/watch?v=hFBEMPWh0Vs',
    'https://picsum.photos/seed/wifi6-vs-wifi5/800/450',
    'Perbandingan mendalam antara Wi-Fi 6 dan Wi-Fi 5 dalam hal kecepatan, kapasitas, latensi, dan efisiensi daya. Disertai demo nyata untuk membuktikan perbedaan performa keduanya.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    1,
    'Apa Itu Fiber Optik? Teknologi di Balik Internet Cepat',
    'https://www.youtube.com/watch?v=g7bFBViOyOo',
    'https://picsum.photos/seed/fiber-optik-video/800/450',
    'Perjalanan visual menelusuri bagaimana kabel fiber optik mentransmisikan data menggunakan cahaya. Dari struktur fisik serat kaca hingga cara sinyal optik diterjemahkan menjadi data digital.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Keamanan Digital (category_id = 2)
(
    2,
    'Cara Mengenali Email Phishing Sebelum Terlambat',
    'https://www.youtube.com/watch?v=aO858HyFbKI',
    'https://picsum.photos/seed/phishing-video/800/450',
    'Tutorial interaktif untuk mengenali ciri-ciri email phishing. Disertai contoh nyata email penipuan dan cara membedakannya dari email resmi, serta langkah yang harus diambil jika sudah terlanjur mengklik.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    2,
    'Ransomware: Ancaman Digital yang Perlu Diwaspadai',
    'https://www.youtube.com/watch?v=WqD-ATqw3js',
    'https://picsum.photos/seed/ransomware-video/800/450',
    'Penjelasan tentang cara kerja ransomware, bagaimana ia menyebar, dampaknya pada korban, dan langkah-langkah pencegahan yang bisa Anda terapkan hari ini untuk melindungi data penting Anda.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Tips & Trik Internet (category_id = 3)
(
    3,
    'Tips Produktif Kerja dari Rumah dengan Internet Stabil',
    'https://www.youtube.com/watch?v=snAhsXyO3Ck',
    'https://picsum.photos/seed/wfh-produktif/800/450',
    'Panduan lengkap untuk mengoptimalkan setup WFH: dari mengatur jaringan internet agar stabil saat video conference, memilih tools kolaborasi yang tepat, hingga tips menjaga fokus saat bekerja di rumah.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    3,
    'Cara Download File Besar dengan Cepat dan Efisien',
    'https://www.youtube.com/watch?v=jvbFknFNO6s',
    'https://picsum.photos/seed/download-cepat/800/450',
    'Teknik-teknik untuk mempercepat proses unduhan file besar: menggunakan download manager, memilih waktu unduhan yang tepat, memanfaatkan fitur resume, dan mengoptimalkan pengaturan browser.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    3,
    'Manfaat Tersembunyi Incognito Mode yang Jarang Diketahui',
    'https://www.youtube.com/watch?v=wp_R9YBQNlk',
    'https://picsum.photos/seed/incognito-mode/800/450',
    'Apa yang benar-benar dilindungi oleh mode incognito, dan apa yang tidak. Video ini meluruskan mitos seputar private browsing dan menjelaskan kapan mode ini benar-benar berguna.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Perangkat & Teknologi (category_id = 4)
(
    4,
    'Review dan Cara Konfigurasi Router untuk Pemula',
    'https://www.youtube.com/watch?v=mYGXNSmxqmo',
    'https://picsum.photos/seed/konfigurasi-router/800/450',
    'Panduan step-by-step untuk pertama kali mengatur router baru: mulai dari menghubungkan kabel, masuk ke panel admin, mengganti SSID dan password Wi-Fi, hingga mengaktifkan fitur keamanan dasar.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    4,
    'Smart Home Starter Guide: Mulai dari Mana?',
    'https://www.youtube.com/watch?v=1EkZ9FN4zGw',
    'https://picsum.photos/seed/smarthome-guide/800/450',
    'Panduan membangun ekosistem rumah pintar dari nol: perangkat apa yang sebaiknya dibeli pertama, cara menghubungkannya ke jaringan, dan tips memastikan keamanan semua perangkat IoT Anda.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    4,
    'Cara Memperpanjang Umur Baterai Laptop dan Smartphone',
    'https://www.youtube.com/watch?v=O6NRGK-JKWE',
    'https://picsum.photos/seed/baterai-tips/800/450',
    'Tips berbasis sains untuk menjaga kesehatan baterai perangkat Anda dalam jangka panjang: kapan harus mengisi daya, mengapa baterai mengembung, dan pengaturan software yang berpengaruh pada daya tahan baterai.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),

-- Kategori: Layanan Pelanggan (category_id = 5)
(
    5,
    'Tutorial Lengkap: Cara Daftar Pelanggan Baru Kawan Nusa',
    'https://www.youtube.com/watch?v=pKO9UjSeLew',
    'https://picsum.photos/seed/daftar-pelanggan/800/450',
    'Proses pendaftaran pelanggan baru Kawan Nusa dari awal hingga selesai: memilih paket, mengisi formulir, proses survei lokasi, jadwal pemasangan, dan apa yang perlu dipersiapkan saat teknisi datang.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    5,
    'Cara Reset Modem dan Router dengan Benar',
    'https://www.youtube.com/watch?v=6wBYnivJQOk',
    'https://picsum.photos/seed/reset-modem/800/450',
    'Kapan harus melakukan soft reset vs hard reset pada modem dan router, apa perbedaan keduanya, dan langkah-langkah yang benar agar koneksi internet kembali normal tanpa kehilangan konfigurasi penting.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    5,
    'Memahami SLA Internet: Hak dan Kewajiban Pelanggan',
    'https://www.youtube.com/watch?v=RLhbbfUTvGI',
    'https://picsum.photos/seed/sla-internet/800/450',
    'Penjelasan tentang Service Level Agreement (SLA) dalam layanan internet: apa yang dijamin oleh ISP, bagaimana cara mengklaim kompensasi jika layanan tidak sesuai SLA, dan hak-hak Anda sebagai pelanggan.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
),
(
    2,
    'Cara Menggunakan Password Manager untuk Pemula',
    'https://www.youtube.com/watch?v=aEmXQqBFsZ4',
    'https://picsum.photos/seed/password-manager/800/450',
    'Tutorial lengkap menggunakan aplikasi password manager: cara instalasi, membuat master password yang kuat, menyimpan dan mengorganisir password, serta cara menggunakannya di berbagai perangkat.',
    'Tim Kawan Nusa',
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE), DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE)
);

SET FOREIGN_KEY_CHECKS = 1;
