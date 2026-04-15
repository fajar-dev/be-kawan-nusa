-- Seeder for Catalog Categories and 60+ Realistic Catalogs with highly varied dates
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE catalog_categories;
TRUNCATE TABLE catalogs;

INSERT INTO catalog_categories (id, name, created_at, updated_at) VALUES 
(1, 'E-Voucher', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 50000) MINUTE), NOW()),
(2, 'Merchandise', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 50000) MINUTE), NOW()),
(3, 'Gadgets', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 50000) MINUTE), NOW()),
(4, 'Lifestyle', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 50000) MINUTE), NOW()),
(5, 'Food & Beverage', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 50000) MINUTE), NOW()),
(6, 'Home Appliances', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 50000) MINUTE), NOW()),
(7, 'Fashion', DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 50000) MINUTE), NOW());

INSERT INTO catalogs (category_id, name, type, description, point, image, expired_date, created_at, updated_at)
SELECT 
    cid, name, type, descr, pt, img, 
    IF(type = 'voucher', DATE_ADD('2026-12-31', INTERVAL FLOOR(RAND() * 50000) MINUTE), NULL) as exp,
    DATE_ADD('2026-01-01 00:00:00', INTERVAL FLOOR(RAND() * 200000) MINUTE) as cat,
    NOW()
FROM (
    SELECT 1 as cid, 'Voucher Indomaret Rp 100.000' as name, 'voucher' as type, 'Voucher belanja senilai Rp100.000 yang dapat digunakan untuk berbagai kebutuhan harian di seluruh gerai Indomaret yang berpartisipasi.' as descr, 10000 as pt, 'https://picsum.photos/seed/indo100/400/400' as img UNION ALL
    SELECT 1, 'Voucher Alfamart Rp 50.000', 'voucher', 'Voucher belanja praktis senilai Rp50.000 untuk membantu memenuhi kebutuhan sehari-hari di gerai Alfamart pilihan.' , 5000, 'https://picsum.photos/seed/alfa50/400/400' UNION ALL
    SELECT 1, 'Voucher GrabFood Rp 75.000', 'voucher', 'Voucher GrabFood senilai Rp75.000 yang cocok digunakan untuk memesan makanan favorit dengan lebih hemat dan nyaman.' , 7500, 'https://picsum.photos/seed/grab75/400/400' UNION ALL
    SELECT 1, 'Voucher GoPay Rp 100.000', 'voucher', 'Saldo digital GoPay senilai Rp100.000 yang dapat digunakan untuk berbagai transaksi cashless dengan cepat dan mudah.' , 10500, 'https://picsum.photos/seed/gopay100/400/400' UNION ALL
    SELECT 1, 'Voucher PLN Rp 100.000', 'voucher', 'Voucher token listrik PLN senilai Rp100.000 untuk membantu memenuhi kebutuhan listrik rumah tangga secara praktis.' , 10000, 'https://picsum.photos/seed/pln100/400/400' UNION ALL
    SELECT 1, 'Voucher Shell Rp 200.000', 'voucher', 'Voucher bahan bakar Shell senilai Rp200.000 yang cocok untuk mendukung mobilitas harian maupun perjalanan jarak jauh.' , 20000, 'https://picsum.photos/seed/shell200/400/400' UNION ALL
    SELECT 1, 'Voucher Starbucks Rp 100.000', 'voucher', 'Voucher Starbucks senilai Rp100.000 untuk menikmati berbagai pilihan kopi, minuman, dan camilan favorit di outlet terpilih.' , 10000, 'https://picsum.photos/seed/sbux100/400/400' UNION ALL

    SELECT 2, 'Kaos Polo Eksklusif Nusanet', 'product', 'Kaos polo eksklusif berbahan premium dengan desain elegan dan logo Nusanet, nyaman digunakan untuk aktivitas santai maupun semi formal.' , 15000, 'https://picsum.photos/seed/polo/400/400' UNION ALL
    SELECT 2, 'Tumbler Lock&Lock 500ml', 'product', 'Tumbler Lock&Lock berkapasitas 500ml dengan material berkualitas, mampu menjaga suhu minuman panas maupun dingin lebih lama.' , 25000, 'https://picsum.photos/seed/locklock/400/400' UNION ALL
    SELECT 2, 'Notebook Kulit A5', 'product', 'Notebook ukuran A5 dengan cover kulit sintetis yang elegan, cocok digunakan untuk mencatat ide, meeting, dan kebutuhan kerja harian.' , 8000, 'https://picsum.photos/seed/notebook/400/400' UNION ALL
    SELECT 2, 'Payung Golf Nusanet', 'product', 'Payung golf ukuran jumbo dengan bahan kokoh dan desain eksklusif, ideal digunakan saat hujan maupun panas terik.' , 12000, 'https://picsum.photos/seed/umbrella/400/400' UNION ALL
    SELECT 2, 'Lanyard Nusanet Limited', 'product', 'Lanyard edisi terbatas dengan desain modern dan material nyaman, cocok untuk ID card, kunci, atau aksesoris kerja harian.' , 1500, 'https://picsum.photos/seed/lanyard/400/400' UNION ALL
    SELECT 2, 'Mug Keramik Nusanet', 'product', 'Mug keramik berkualitas dengan desain minimalis modern, cocok untuk menemani waktu minum kopi atau teh di rumah dan kantor.' , 5000, 'https://picsum.photos/seed/mugnu/400/400' UNION ALL

    SELECT 3, 'Samsung Galaxy Fit 3', 'product', 'Smartband terbaru dari Samsung yang membantu memantau aktivitas harian, kualitas tidur, detak jantung, dan target kebugaran.' , 65000, 'https://picsum.photos/seed/fit3/400/400' UNION ALL
    SELECT 3, 'Sony WH-CH520 Wireless', 'product', 'Headphone wireless dengan kualitas audio jernih dan daya tahan baterai hingga 50 jam, cocok untuk musik, meeting, dan hiburan.' , 85000, 'https://picsum.photos/seed/sonyh/400/400' UNION ALL
    SELECT 3, 'Logitech Pebble Mouse M350', 'product', 'Mouse wireless berdesain slim, ringan, dan senyap, sangat cocok untuk kebutuhan kerja mobile dan penggunaan harian.' , 35000, 'https://picsum.photos/seed/pebble/400/400' UNION ALL
    SELECT 3, 'Powerbank Anker 10000mAh', 'product', 'Powerbank Anker berkapasitas 10000mAh dengan fitur fast charging, ideal untuk menjaga perangkat tetap aktif saat bepergian.' , 55000, 'https://picsum.photos/seed/anker10/400/400' UNION ALL
    SELECT 3, 'iPad Air M2 128GB', 'product', 'Tablet bertenaga chip M2 dengan performa tinggi untuk produktivitas, hiburan, desain, dan kebutuhan kerja profesional.' , 950000, 'https://picsum.photos/seed/ipadair/400/400' UNION ALL
    SELECT 3, 'Apple Watch SE 2', 'product', 'Smartwatch Apple dengan fitur esensial untuk kebugaran, notifikasi, pelacakan kesehatan, dan integrasi mulus dengan iPhone.' , 450000, 'https://picsum.photos/seed/awse2/400/400' UNION ALL
    SELECT 3, 'AirPods Pro 2nd Gen', 'product', 'Earbuds premium dengan active noise cancellation, kualitas suara imersif, dan kenyamanan maksimal untuk penggunaan harian.' , 350000, 'https://picsum.photos/seed/airpods2/400/400' UNION ALL

    SELECT 4, 'Air Purifier Sharp Mini', 'product', 'Air purifier berukuran compact yang membantu menjaga kualitas udara tetap bersih dan segar di ruang kerja maupun kamar tidur.' , 120000, 'https://picsum.photos/seed/sharpair/400/400' UNION ALL
    SELECT 4, 'Sertifikat Digital Kursus IT', 'product', 'Akses kursus IT premium yang mendukung peningkatan skill digital sekaligus memberikan sertifikat digital setelah penyelesaian kelas.' , 25000, 'https://picsum.photos/seed/course/400/400' UNION ALL
    SELECT 4, 'Gift Card Netflix 1 Bulan', 'voucher', 'Gift card Netflix untuk menikmati layanan streaming premium selama 1 bulan dengan berbagai pilihan film dan serial favorit.' , 18600, 'https://picsum.photos/seed/netflix/400/400' UNION ALL
    SELECT 4, 'Voucher Spotify 3 Bulan', 'voucher', 'Voucher langganan Spotify selama 3 bulan untuk menikmati musik tanpa iklan dengan pengalaman mendengarkan yang lebih nyaman.' , 55000, 'https://picsum.photos/seed/spotif/400/400' UNION ALL
    SELECT 4, 'Kindle Paperwhite 11th Gen', 'product', 'E-reader nyaman dengan layar ramah mata, cocok bagi pecinta membaca yang ingin membawa banyak buku dalam satu perangkat.' , 250000, 'https://picsum.photos/seed/kindle/400/400' UNION ALL

    SELECT 5, 'Paket Mie Gacoan Level 3', 'voucher', 'Voucher paket makan Mie Gacoan level 3 yang pas untuk menikmati menu favorit dengan rasa pedas yang menggugah selera.' , 4500, 'https://picsum.photos/seed/gacoan/400/400' UNION ALL
    SELECT 5, 'Hampers Lebaran Premium', 'product', 'Hampers premium berisi aneka kue kering, sirup, dan sajian spesial yang cocok dijadikan hadiah saat momen perayaan.' , 250000, 'https://picsum.photos/seed/hampers/400/400' UNION ALL
    SELECT 5, 'Voucher Bakmi GM Rp 50.000', 'voucher', 'Voucher makan senilai Rp50.000 di Bakmi GM yang dapat digunakan untuk menikmati menu favorit bersama keluarga atau teman.' , 5000, 'https://picsum.photos/seed/bakmi/400/400' UNION ALL
    SELECT 5, 'Voucher Bakso Boedjangan', 'voucher', 'Voucher makan di Bakso Boedjangan yang cocok digunakan untuk menikmati sajian bakso hangat dengan berbagai pilihan menu.' , 7500, 'https://picsum.photos/seed/bakso/400/400' UNION ALL

    SELECT 6, 'Philips Air Fryer 4.1L', 'product', 'Air fryer kapasitas 4.1 liter dari Philips yang membantu memasak lebih sehat dengan sedikit minyak tanpa mengurangi rasa.' , 150000, 'https://picsum.photos/seed/fryer/400/400' UNION ALL
    SELECT 6, 'Robot Vacuum Cleaner MI', 'product', 'Robot vacuum cleaner pintar yang membantu membersihkan lantai secara otomatis, efisien, dan praktis untuk rumah modern.' , 280000, 'https://picsum.photos/seed/robotv/400/400' UNION ALL
    SELECT 6, 'Blender Portable Juicer', 'product', 'Blender portable yang ringan dan mudah dibawa, cocok untuk membuat jus atau minuman sehat kapan saja dan di mana saja.' , 15000, 'https://picsum.photos/seed/blender/400/400' UNION ALL
    SELECT 6, 'Coffee Maker Nespresso', 'product', 'Mesin kopi pod otomatis yang praktis digunakan untuk menghadirkan pengalaman menikmati kopi ala kafe di rumah.' , 350000, 'https://picsum.photos/seed/coffee/400/400' UNION ALL

    SELECT 7, 'Jaket Bomber Nusanet', 'product', 'Jaket bomber bergaya modern dengan bahan nyaman dan tahan air ringan, cocok untuk aktivitas harian maupun perjalanan.' , 35000, 'https://picsum.photos/seed/bomber/400/400' UNION ALL
    SELECT 7, 'Sepatu Sneakers Lokal', 'product', 'Sneakers lokal dengan desain modern, nyaman dipakai, dan cocok dipadukan dengan berbagai gaya kasual sehari-hari.' , 55000, 'https://picsum.photos/seed/sneaker/400/400' UNION ALL
    SELECT 7, 'Tas Canvas Totebag', 'product', 'Totebag berbahan canvas yang kuat, multifungsi, dan cocok digunakan untuk bekerja, kuliah, atau aktivitas santai.' , 5000, 'https://picsum.photos/seed/toteb/400/400'
) d;
SET FOREIGN_KEY_CHECKS = 1;
