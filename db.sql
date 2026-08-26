CREATE DATABASE IF NOT EXISTS netline CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
USE netline;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS campaign_services;
DROP TABLE IF EXISTS campaign_eligibility_checks;
DROP TABLE IF EXISTS authorization_scenario_checks;
DROP TABLE IF EXISTS authorization_scenarios;
DROP TABLE IF EXISTS collection_scenario_checks;
DROP TABLE IF EXISTS collection_scenarios;
DROP TABLE IF EXISTS field_tasks;
DROP TABLE IF EXISTS outages;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS customer_services;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS maintenance;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS customers;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE customers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_no VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_customers_no (customer_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  active_subscribers INT UNSIGNED NOT NULL DEFAULT 0,
  monthly_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_services_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE customer_services (
  customer_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NULL,
  service_name VARCHAR(120) NOT NULL,
  PRIMARY KEY (customer_id),
  CONSTRAINT fk_customer_services_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT fk_customer_services_service FOREIGN KEY (service_id) REFERENCES services (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE campaigns (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(30) NOT NULL,
  target VARCHAR(80) NOT NULL,
  participation INT UNSIGNED NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_campaigns_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE campaign_eligibility_checks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  campaign_id INT UNSIGNED NOT NULL,
  eligible BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'Yeni',
  reason VARCHAR(255) NULL,
  checked_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_campaign_checks_customer (customer_id),
  KEY idx_campaign_checks_campaign (campaign_id),
  CONSTRAINT fk_campaign_checks_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT fk_campaign_checks_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE applications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_no VARCHAR(20) NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  service_name VARCHAR(120) NOT NULL,
  channel VARCHAR(40) NOT NULL,
  application_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_applications_no (application_no),
  CONSTRAINT fk_applications_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE invoices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_no VARCHAR(20) NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_channel VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_invoices_no (invoice_no),
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tickets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_no VARCHAR(20) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at DATE NOT NULL,
  status VARCHAR(30) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_tickets_no (ticket_no),
  CONSTRAINT fk_tickets_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE teams (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  region VARCHAR(120) NOT NULL,
  manager VARCHAR(120) NOT NULL,
  active_tasks INT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE maintenance (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  region VARCHAR(120) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  affected_customers INT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE announcements (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(50) NOT NULL,
  published_at DATE NOT NULL,
  audience VARCHAR(120) NOT NULL,
  views INT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  role VARCHAR(100) NOT NULL,
  last_activity VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE collection_scenarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
  PRIMARY KEY (id), UNIQUE KEY uq_collection_scenarios_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE collection_scenario_checks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id INT UNSIGNED NOT NULL,
  scenario_id INT UNSIGNED NOT NULL,
  decision VARCHAR(30) NOT NULL DEFAULT 'Yeni',
  status VARCHAR(30) NOT NULL DEFAULT 'Yeni',
  reason VARCHAR(255) NULL,
  checked_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_collection_checks_invoice (invoice_id),
  KEY idx_collection_checks_scenario (scenario_id),
  CONSTRAINT fk_collection_checks_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id),
  CONSTRAINT fk_collection_checks_scenario FOREIGN KEY (scenario_id) REFERENCES collection_scenarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO collection_scenarios (code, name, description) VALUES
  ('PAYMENT_RECEIVED', 'Ödeme alındı senaryosu', 'Bekleyen faturanın ödemesini sisteme işleme akışı'),
  ('OVERDUE_REMINDER', 'Gecikmiş ödeme hatırlatması', 'Vadesi geçen faturalar için hatırlatma gereksinimi'),
  ('AUTO_COLLECTION', 'Otomatik tahsilat kontrolü', 'Otomatik ödeme kanalının tahsilat uygunluğunu kontrol etme'),
  ('PARTIAL_PAYMENT', 'Kısmi ödeme takibi', 'Ödenmemiş veya gecikmiş faturada bakiye takibi'),
  ('PAYMENT_METHOD_UPDATE', 'Ödeme yöntemi güncelleme', 'Fatura için yeni ödeme kanalı tanımlama'),
  ('REFUND_REVIEW', 'İade incelemesi', 'Ödenmiş fatura için iade talebi ön kontrolü'),
  ('PAYMENT_PLAN', 'Taksitlendirme kontrolü', 'Yüksek tutarlı bekleyen faturada taksit seçeneği kontrolü'),
  ('MANUAL_COLLECTION', 'Manuel tahsilat başlatma', 'Otomatik ödeme dışındaki faturalar için manuel tahsilat akışı'),
  ('PAYMENT_RETRY', 'Ödeme yeniden deneme', 'Başarısız veya bekleyen ödeme için yeniden deneme kontrolü'),
  ('INVOICE_CANCEL', 'Fatura iptal kontrolü', 'İptal edilebilir fatura durumunu kontrol etme');

CREATE TABLE authorization_scenarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  required_level TINYINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
  PRIMARY KEY (id), UNIQUE KEY uq_authorization_scenarios_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE authorization_scenario_checks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  scenario_id INT UNSIGNED NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'Yeni',
  reason VARCHAR(255) NULL,
  checked_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_authorization_checks_user (user_id),
  KEY idx_authorization_checks_scenario (scenario_id),
  CONSTRAINT fk_authorization_checks_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_authorization_checks_scenario FOREIGN KEY (scenario_id) REFERENCES authorization_scenarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE customer_campaign_profiles (
  customer_id INT UNSIGNED NOT NULL,
  customer_type VARCHAR(30) NOT NULL DEFAULT 'Bireysel',
  registered_at DATE NOT NULL,
  is_student BOOLEAN NOT NULL DEFAULT FALSE,
  modem_age_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (customer_id),
  CONSTRAINT fk_campaign_profiles_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  value VARCHAR(255) NOT NULL,
  updated_at DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO customers (customer_no, name, phone, status) VALUES
('NL-10001','Ahmet Yılmaz','0532 441 20 18','Aktif'),('NL-10002','Selin Erdem','0541 382 74 10','Aktif'),('NL-10003','Mert Kılıç','0553 901 44 26','Aktif'),('NL-10004','Derya Aksoy','0506 112 63 90','Beklemede'),('NL-10005','Burak Şen','0536 774 08 52','Aktif'),('NL-10006','Elif Demir','0544 283 11 72','Pasif'),('NL-10007','Can Kaya','0551 630 47 39','Aktif'),('NL-10008','Zeynep Çelik','0530 902 18 66','Aktif'),('NL-10009','Onur Aydın','0507 451 29 03','Aktif'),('NL-10010','Ece Yalçın','0542 718 36 45','Beklemede');

INSERT INTO customer_campaign_profiles (customer_id, customer_type, registered_at, is_student, modem_age_years) VALUES
  (1, 'Bireysel', '2026-07-15', FALSE, 1), (2, 'Bireysel', '2022-04-20', FALSE, 2),
  (3, 'Bireysel', '2021-02-10', TRUE, 4), (4, 'Bireysel', '2024-08-11', FALSE, 3),
  (5, 'Kurumsal', '2020-06-05', FALSE, 1), (6, 'Bireysel', '2023-01-12', FALSE, 5),
  (7, 'Bireysel', '2021-10-03', FALSE, 2), (8, 'Bireysel', '2025-05-22', FALSE, 1),
  (9, 'Bireysel', '2022-11-17', FALSE, 4), (10, 'Bireysel', '2024-03-29', TRUE, 2);

INSERT INTO services (code, name, active_subscribers, monthly_price, status) VALUES
('FBR-100','Fiber 100 Mbps',5842,399.00,'Aktif'),('FBR-500','Fiber 500 Mbps',2910,549.00,'Aktif'),('FBR-1K','Fiber 1000 Mbps',1090,799.00,'Aktif'),('KTV-001','Kablo TV Başlangıç',2218,189.00,'Aktif'),('KTV-002','Kablo TV Premium',2000,289.00,'Aktif'),('DSM-101','D-Smart Aile',1746,249.00,'Aktif'),('DSM-202','D-Smart Spor',1160,429.00,'Aktif'),('EK-010','Statik IP',326,79.00,'Aktif'),('EK-020','Wi-Fi 6 Modem',780,49.00,'Aktif'),('KRM-500','Kurumsal Fiber',320,1299.00,'Aktif');

INSERT INTO customer_services (customer_id, service_id, service_name) VALUES
(1,1,'Fiber 100 Mbps'),(2,NULL,'D-Smart + Fiber'),(3,2,'Fiber 500 Mbps'),(4,NULL,'Kablo TV'),(5,3,'Fiber 1000 Mbps'),(6,1,'Fiber 100 Mbps'),(7,6,'D-Smart'),(8,2,'Fiber 500 Mbps'),(9,NULL,'Kablo TV'),(10,1,'Fiber 100 Mbps');

INSERT INTO campaigns (name, code, target, participation, end_date, status) VALUES
('Yaz Fiber Fırsatı','YAZ24','Yeni müşteri',842,'2028-06-30','Aktif'),('Arkadaşını Getir','DOST10','Mevcut müşteri',516,'2028-07-15','Aktif'),('Aile Eğlence Paketi','AILE25','TV aboneleri',390,'2028-07-31','Aktif'),('İlk 3 Ay Ücretsiz','ILK3AY','Yeni müşteri',274,'2028-08-10','Aktif'),('Spor Keyfi','SPOR50','Spor paketi',198,'2028-06-20','Sona erdi'),('Sadakat Bonusu','SADAKAT','3+ yıl müşteri',634,'2028-12-31','Aktif'),('Öğrenci Fiber','OGRENCI','Öğrenci',145,'2028-09-30','Aktif'),('Kışa Hazır','KIS24','Tüm müşteriler',1024,'2028-03-15','Sona erdi'),('Kurumsal Hoş Geldin','KRM15','Kurumsal',72,'2028-08-31','Aktif'),('Modem Yenileme','YENILE','Eski modem',308,'2028-11-30','Taslak');

INSERT INTO applications (application_no, customer_id, service_name, channel, application_date, status) VALUES
('BŞV-2401',1,'Fiber 100 Mbps','Web','2024-06-24','İnceleniyor'),('BŞV-2402',2,'D-Smart + Fiber','Çağrı merkezi','2024-06-24','İnceleniyor'),('BŞV-2403',3,'Fiber 500 Mbps','Bayi','2024-06-24','Onaylandı'),('BŞV-2404',4,'Kablo TV','Web','2024-06-23','Eksik belge'),('BŞV-2405',5,'Fiber 1000 Mbps','Bayi','2024-06-23','Onaylandı'),('BŞV-2406',6,'Fiber 100 Mbps','Web','2024-06-22','İptal edildi'),('BŞV-2407',7,'D-Smart','Mobil','2024-06-22','İnceleniyor'),('BŞV-2408',8,'Fiber 500 Mbps','Web','2024-06-21','Onaylandı'),('BŞV-2409',9,'Kablo TV','Çağrı merkezi','2024-06-21','İnceleniyor'),('BŞV-2410',10,'Fiber 100 Mbps','Mobil','2024-06-20','Onaylandı');

INSERT INTO invoices (invoice_no, customer_id, amount, due_date, payment_channel, status) VALUES
('FT-240601',1,399.00,'2024-07-05','Otomatik ödeme','Ödendi'),('FT-240602',2,648.00,'2024-07-05','Kredi kartı','Ödendi'),('FT-240603',3,549.00,'2024-07-05','Bekliyor','Beklemede'),('FT-240604',4,189.00,'2024-07-05','Banka','Gecikmiş'),('FT-240605',5,799.00,'2024-07-05','Otomatik ödeme','Ödendi'),('FT-240606',6,399.00,'2024-07-05','Kredi kartı','İptal'),('FT-240607',7,249.00,'2024-07-05','Banka','Ödendi'),('FT-240608',8,549.00,'2024-07-05','Mobil ödeme','Beklemede'),('FT-240609',9,189.00,'2024-07-05','Otomatik ödeme','Ödendi'),('FT-240610',10,399.00,'2024-07-05','Kredi kartı','Gecikmiş');

INSERT INTO tickets (ticket_no, subject, customer_id, category, created_at, status) VALUES
('TLP-501','Bağlantı yavaşlığı',4,'Teknik','2024-06-24','Açık'),('TLP-502','Fatura itirazı',3,'Faturalama','2024-06-24','İnceleniyor'),('TLP-503','Modem kurulumu',10,'Kurulum','2024-06-23','Atandı'),('TLP-504','Kanal güncelleme',9,'TV','2024-06-23','Çözüldü'),('TLP-505','Adres değişikliği',6,'Abonelik','2024-06-22','Açık'),('TLP-506','İnternet kesintisi',7,'Teknik','2024-06-22','Atandı'),('TLP-507','Paket yükseltme',8,'Satış','2024-06-21','Çözüldü'),('TLP-508','Ödeme yöntemi',5,'Faturalama','2024-06-21','İnceleniyor'),('TLP-509','Sinyal problemi',2,'TV','2024-06-20','Açık'),('TLP-510','Kampanya başvurusu',1,'Kampanya','2024-06-20','Çözüldü');

INSERT INTO teams (name, region, manager, active_tasks, status) VALUES
('Kuzey Bölge Ekibi','İstanbul Avrupa','Emre Koç',14,'Sahada'),('Merkez Teknik','İstanbul Merkez','Seda Arslan',6,'Müsait'),('Güney Bölge Ekibi','İstanbul Anadolu','Okan Yıldız',8,'Meşgul'),('Ankara Saha 1','Ankara Çankaya','Bora Tunç',5,'Sahada'),('Ankara Saha 2','Ankara Keçiören','İpek Uslu',3,'Müsait'),('İzmir Teknik','İzmir Bornova','Murat Eren',9,'Meşgul'),('Bursa Saha','Bursa Nilüfer','Aslı Güneş',4,'Müsait'),('Kocaeli Destek','Kocaeli Gebze','Tolga Keskin',7,'Sahada'),('Bakım Ekibi A','İstanbul Avrupa','Nuri Akın',2,'Müsait'),('Acil Müdahale','Tüm bölgeler','Cem Öz',1,'Hazır');

INSERT INTO maintenance (title, region, starts_at, ends_at, affected_customers, status) VALUES
('Avrupa Yakası omurga bakımı','İstanbul Avrupa','2024-06-24 23:00:00','2024-06-25 03:00:00',1240,'Planlandı'),('Kadıköy saha dolabı','İstanbul Anadolu','2024-06-26 01:00:00','2024-06-26 04:00:00',380,'Planlandı'),('Çankaya fiber hattı','Ankara','2024-06-27 00:00:00','2024-06-27 02:00:00',215,'Planlandı'),('Bornova enerji yenileme','İzmir','2024-06-28 02:00:00','2024-06-28 05:00:00',490,'Planlandı'),('Bursa merkez ekipman','Bursa','2024-06-29 01:00:00','2024-06-29 03:00:00',170,'Planlandı'),('Gebze dağıtım noktası','Kocaeli','2024-06-30 23:00:00','2024-07-01 02:00:00',320,'Planlandı'),('Avcılar kablo yenileme','İstanbul Avrupa','2024-07-02 00:00:00','2024-07-02 04:00:00',610,'Taslak'),('Üsküdar saha güncellemesi','İstanbul Anadolu','2024-07-03 01:00:00','2024-07-03 03:00:00',265,'Taslak'),('Sistem yazılım güncellemesi','Tüm bölgeler','2024-07-04 02:00:00','2024-07-04 03:00:00',0,'Planlandı'),('Yedek hat testi','İstanbul Merkez','2024-07-05 23:00:00','2024-07-06 01:00:00',0,'Tamamlandı');

INSERT INTO announcements (title, category, published_at, audience, views, status) VALUES
('Planlı bakım bildirimi','Bakım','2024-06-24','Tüm müşteriler',8420,'Yayında'),('Yaz kampanyaları başladı','Kampanya','2024-06-20','Tüm müşteriler',6180,'Yayında'),('Mobil uygulama güncellemesi','Ürün','2024-06-18','Mobil kullanıcılar',3250,'Yayında'),('Fatura son ödeme tarihi','Faturalama','2024-06-15','Faturalı müşteriler',4870,'Yayında'),('Yeni kanal listesi','TV','2024-06-10','TV müşterileri',2910,'Yayında'),('Gizlilik politikası güncellemesi','Yasal','2024-06-05','Tüm kullanıcılar',1840,'Arşiv'),('Çağrı merkezi çalışma saatleri','Bilgi','2024-06-01','Tüm müşteriler',2420,'Yayında'),('Fiber altyapı genişlemesi','Altyapı','2024-05-28','İstanbul',5110,'Yayında'),('Bayi portalı yenilendi','Bayi','2024-05-20','Bayiler',860,'Arşiv'),('Yeni destek kanalı','Destek','2024-05-15','Tüm müşteriler',1920,'Yayında');

INSERT INTO users (name, email, role, last_activity, status) VALUES
('Berkay Kaya','berkay.kaya@netline.com','Yönetici','Şimdi','Aktif'),('Seda Arslan','seda.arslan@netline.com','Operasyon yöneticisi','5 dk önce','Aktif'),('Emre Koç','emre.koc@netline.com','Saha sorumlusu','18 dk önce','Aktif'),('İpek Uslu','ipek.uslu@netline.com','Müşteri temsilcisi','32 dk önce','Aktif'),('Murat Eren','murat.eren@netline.com','Teknik uzman','1 saat önce','Aktif'),('Aslı Güneş','asli.gunes@netline.com','Müşteri temsilcisi','2 saat önce','Aktif'),('Tolga Keskin','tolga.keskin@netline.com','Saha sorumlusu','3 saat önce','Pasif'),('Nuri Akın','nuri.akin@netline.com','Teknik uzman','Dün','Aktif'),('Cem Öz','cem.oz@netline.com','Acil müdahale','Dün','Aktif'),('Bora Tunç','bora.tunc@netline.com','Saha sorumlusu','2 gün önce','Davet bekliyor');

INSERT INTO settings (name, category, value, updated_at, status) VALUES
('Bildirim tercihleri','Bildirimler','E-posta ve uygulama','2024-06-24','Aktif'),('Otomatik fatura hatırlatma','Faturalama','5 gün önce','2024-06-24','Aktif'),('Varsayılan para birimi','Genel','Türk Lirası (₺)','2024-06-20','Aktif'),('Oturum zaman aşımı','Güvenlik','30 dakika','2024-06-18','Aktif'),('İki adımlı doğrulama','Güvenlik','Zorunlu','2024-06-18','Aktif'),('Müşteri veri dışa aktarımı','Gizlilik','Yönetici onayı','2024-06-15','Aktif'),('Varsayılan dil','Genel','Türkçe','2024-06-10','Aktif'),('Bakım uyarı eşiği','Operasyon','24 saat önce','2024-06-08','Aktif'),('Denetim kayıtları','Güvenlik','365 gün','2024-06-05','Aktif'),('Bayi erişim seviyesi','Yetkilendirme','Sınırlı','2024-06-01','Pasif');