USE netline;

CREATE TABLE IF NOT EXISTS campaign_eligibility_checks (
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

CREATE TABLE IF NOT EXISTS authorization_scenarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  required_level TINYINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
  PRIMARY KEY (id), UNIQUE KEY uq_authorization_scenarios_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS authorization_scenario_checks (
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

CREATE TABLE IF NOT EXISTS customer_campaign_profiles (
  customer_id INT UNSIGNED NOT NULL,
  customer_type VARCHAR(30) NOT NULL DEFAULT 'Bireysel',
  registered_at DATE NOT NULL,
  is_student BOOLEAN NOT NULL DEFAULT FALSE,
  modem_age_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (customer_id),
  CONSTRAINT fk_campaign_profiles_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO customer_campaign_profiles (customer_id, customer_type, registered_at, is_student, modem_age_years) VALUES
  (1, 'Bireysel', '2026-07-15', FALSE, 1), (2, 'Bireysel', '2022-04-20', FALSE, 2),
  (3, 'Bireysel', '2021-02-10', TRUE, 4), (4, 'Bireysel', '2024-08-11', FALSE, 3),
  (5, 'Kurumsal', '2020-06-05', FALSE, 1), (6, 'Bireysel', '2023-01-12', FALSE, 5),
  (7, 'Bireysel', '2021-10-03', FALSE, 2), (8, 'Bireysel', '2025-05-22', FALSE, 1),
  (9, 'Bireysel', '2022-11-17', FALSE, 4), (10, 'Bireysel', '2024-03-29', TRUE, 2);

CREATE TABLE IF NOT EXISTS collection_scenarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
  PRIMARY KEY (id), UNIQUE KEY uq_collection_scenarios_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS collection_scenario_checks (
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

INSERT IGNORE INTO collection_scenarios (code, name, description, status) VALUES
  ('PAYMENT_RECEIVED', 'Ödeme alındı senaryosu', 'Bekleyen faturanın ödemesini sisteme işleme akışı',
   'Aktif'),
  ('OVERDUE_REMINDER', 'Gecikmiş ödeme hatırlatması', 'Vadesi geçen faturalar için hatırlatma gereksinimi', 'Aktif'),
  ('AUTO_COLLECTION', 'Otomatik tahsilat kontrolü', 'Otomatik ödeme kanalının tahsilat uygunluğunu kontrol etme', 'Aktif'),
  ('PARTIAL_PAYMENT', 'Kısmi ödeme takibi', 'Ödenmemiş veya gecikmiş faturada bakiye takibi', 'Aktif'),
  ('PAYMENT_METHOD_UPDATE', 'Ödeme yöntemi güncelleme', 'Fatura için yeni ödeme kanalı tanımlama', 'Aktif'),
  ('REFUND_REVIEW', 'İade incelemesi', 'Ödenmiş fatura için iade talebi ön kontrolü', 'Aktif'),
  ('PAYMENT_PLAN', 'Taksitlendirme kontrolü', 'Yüksek tutarlı bekleyen faturada taksit seçeneği kontrolü', 'Aktif'),
  ('MANUAL_COLLECTION', 'Manuel tahsilat başlatma', 'Otomatik ödeme dışındaki faturalar için manuel tahsilat akışı', 'Aktif'),
  ('PAYMENT_RETRY', 'Ödeme yeniden deneme', 'Başarısız veya bekleyen ödeme için yeniden deneme kontrolü', 'Aktif'),
  ('INVOICE_CANCEL', 'Fatura iptal kontrolü', 'İptal edilebilir fatura durumunu kontrol etme', 'Aktif');

DROP PROCEDURE IF EXISTS sp_fatura_tahsilat_senaryosu_testi;

DELIMITER //
CREATE PROCEDURE sp_fatura_tahsilat_senaryosu_testi(
  IN p_invoice_id INT UNSIGNED,
  IN p_scenario_id INT UNSIGNED,
  OUT p_decision VARCHAR(30),
  OUT p_status VARCHAR(30),
  OUT p_reason VARCHAR(255)
)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_invoice_no VARCHAR(20);
  DECLARE v_amount DECIMAL(10,2);
  DECLARE v_due_date DATE;
  DECLARE v_payment_channel VARCHAR(40);
  DECLARE v_invoice_status VARCHAR(20);
  DECLARE v_scenario_code VARCHAR(40);
  DECLARE v_scenario_status VARCHAR(20);

  SET p_decision = CONVERT(0xC4B0C59F6C656D20676572656B6C69 USING utf8mb4), p_status = 'Kontrol edildi', p_reason = 'Fatura veya senaryo bulunamadı.';
  SELECT i.invoice_no, i.amount, i.due_date, i.payment_channel, i.status, s.code, s.status
    INTO v_invoice_no, v_amount, v_due_date, v_payment_channel, v_invoice_status, v_scenario_code, v_scenario_status
  FROM invoices i
  JOIN collection_scenarios s ON s.id = p_scenario_id
  WHERE i.id = p_invoice_id;

  IF v_invoice_no IS NULL THEN
    SET p_reason = 'Fatura veya senaryo bulunamadı.';
  ELSEIF v_scenario_status <> 'Aktif' THEN
    SET p_reason = 'Tahsilat senaryosu aktif değil.';
  ELSEIF v_scenario_code = 'PAYMENT_RECEIVED' AND v_invoice_status IN ('Beklemede', 'Gecikmiş') THEN
    SET p_decision = 'Uygun', p_status = CONVERT(0xC4B0C59F6C656D652068617AC4B172 USING utf8mb4), p_reason = CONCAT(v_invoice_no, ' numaralı fatura ödeme kaydı için uygun.');
  ELSEIF v_scenario_code = 'OVERDUE_REMINDER' AND v_due_date < CURRENT_DATE AND v_invoice_status <> 'Ödendi' THEN
    SET p_decision = 'Uygun', p_status = CONVERT(0x486174C4B1726C61746D6120676572656B6C69 USING utf8mb4), p_reason = CONCAT(v_invoice_no, ' numaralı fatura vadesini geçmiş.');
  ELSEIF v_scenario_code = 'AUTO_COLLECTION' AND v_payment_channel = 'Otomatik ödeme' AND v_invoice_status <> 'Ödendi' THEN
    SET p_decision = 'Uygun', p_status = CONVERT(0x54616873696C6174612068617AC4B172 USING utf8mb4), p_reason = 'Otomatik ödeme kanalı aktif ve fatura ödenmemiş.';
  ELSEIF v_scenario_code = 'PARTIAL_PAYMENT' AND v_invoice_status IN ('Beklemede', 'Gecikmiş') THEN
    SET p_decision = 'Uygun', p_status = CONVERT(0x42616B6979652074616B696269 USING utf8mb4), p_reason = 'Fatura için açık bakiye takibi başlatılabilir.';
  ELSEIF v_scenario_code = 'PAYMENT_METHOD_UPDATE' AND v_invoice_status <> 'Ödendi' THEN
    SET p_decision = 'Uygun', p_status = CONVERT(0x47C3BC6E63656C6C656D6579652068617AC4B172 USING utf8mb4), p_reason = 'Ödenmemiş fatura için ödeme yöntemi güncellenebilir.';
  ELSEIF v_scenario_code = 'REFUND_REVIEW' AND v_invoice_status = 'Ödendi' THEN
    SET p_decision = 'Uygun', p_status = CONVERT(0xC4B06E63656C656D6579652068617AC4B172 USING utf8mb4), p_reason = 'Ödenmiş fatura iade ön kontrolüne uygun.';
  ELSEIF v_scenario_code = 'PAYMENT_PLAN' AND v_invoice_status IN ('Beklemede', 'Gecikmiş') AND v_amount >= 500 THEN
    SET p_decision = 'Uygun', p_status = CONVERT(0x54616B7369746C656E6469726D65796520757967756E USING utf8mb4), p_reason = 'Fatura tutarı taksitlendirme eşiğini karşılıyor.';
  ELSEIF v_scenario_code = 'MANUAL_COLLECTION' AND v_payment_channel <> 'Otomatik ödeme' AND v_invoice_status IN ('Beklemede', 'Gecikmiş') THEN
    SET p_decision = 'Uygun', p_status = 'Manuel işleme hazır', p_reason = 'Fatura manuel tahsilat akışına alınabilir.';
  ELSEIF v_scenario_code = 'PAYMENT_RETRY' AND v_invoice_status IN ('Beklemede', 'Gecikmiş') THEN
    SET p_decision = 'Uygun', p_status = 'Yeniden denemeye hazır', p_reason = 'Ödeme için yeniden deneme yapılabilir.';
  ELSEIF v_scenario_code = 'INVOICE_CANCEL' AND v_invoice_status IN ('Beklemede', 'Gecikmiş') THEN
    SET p_decision = 'Uygun', p_status = 'İptale uygun', p_reason = 'Ödenmemiş fatura iptal kontrolünden geçebilir.';
  ELSEIF v_invoice_status = 'Ödendi' THEN
    SET p_decision = 'Tamamlandı', p_status = CONVERT(0xC4B0C59F6C656D20676572656B6D69796F72 USING utf8mb4), p_reason = 'Fatura zaten ödendi.';
  ELSE
    SET p_reason = CONVERT(0x466174757261206D65766375742073656E6172796F206B6FC59F756C6C6172C4B16EC4B1206B6172C59FC4B16C616DC4B1796F722E USING utf8mb4);
  END IF;
END//
DELIMITER ;

DROP TRIGGER IF EXISTS trg_collection_scenario_check;

DELIMITER //
CREATE TRIGGER trg_collection_scenario_check
BEFORE INSERT ON collection_scenario_checks
FOR EACH ROW
BEGIN
  DECLARE v_decision VARCHAR(30);
  DECLARE v_status VARCHAR(30);
  DECLARE v_reason VARCHAR(255);
  CALL sp_fatura_tahsilat_senaryosu_testi(NEW.invoice_id, NEW.scenario_id, v_decision, v_status, v_reason);
  SET NEW.decision = v_decision, NEW.status = v_status, NEW.reason = v_reason, NEW.checked_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

INSERT IGNORE INTO authorization_scenarios (code, name, description, required_level) VALUES
  ('VIEW_CUSTOMERS', 'Müşteri kayıtlarını görüntüleme', 'Müşteri listesine ve temel hesap bilgilerine erişim', 1),
  ('SEND_CAMPAIGN', 'Kampanya bildirimi gönderme', 'Kampanya iletişimini başlatma yetkisi', 2),
  ('MANAGE_OPERATIONS', 'Operasyon ayarlarını yönetme', 'Operasyon ve saha ayarlarını değiştirme yetkisi', 3),
  ('MANAGE_USERS', 'Kullanıcı yönetimi', 'Kullanıcı ve rol yönetimi işlemlerine erişim', 4);

DROP PROCEDURE IF EXISTS sp_kullanici_yetki_senaryosu_testi;

DELIMITER //
CREATE PROCEDURE sp_kullanici_yetki_senaryosu_testi(
  IN p_user_id INT UNSIGNED,
  IN p_scenario_id INT UNSIGNED,
  OUT p_allowed BOOLEAN,
  OUT p_status VARCHAR(30),
  OUT p_reason VARCHAR(255)
)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_user_name VARCHAR(120);
  DECLARE v_user_role VARCHAR(100);
  DECLARE v_user_status VARCHAR(30);
  DECLARE v_required_level TINYINT UNSIGNED;
  DECLARE v_scenario_status VARCHAR(20);
  DECLARE v_role_level TINYINT UNSIGNED DEFAULT 0;

  SET p_allowed = FALSE, p_status = 'Reddedildi', p_reason = 'Kullanıcı veya senaryo bulunamadı.';
  SELECT u.name, u.role, u.status, s.required_level, s.status
    INTO v_user_name, v_user_role, v_user_status, v_required_level, v_scenario_status
  FROM users u
  JOIN authorization_scenarios s ON s.id = p_scenario_id
  WHERE u.id = p_user_id;

  SET v_role_level = CASE
    WHEN RIGHT(v_user_role, 6) = 'netici' THEN 4
    WHEN RIGHT(v_user_role, 8) = 'neticisi' THEN 3
    WHEN LEFT(v_user_role, 4) IN ('Saha', 'Tekn') THEN 2
    WHEN v_user_role IS NOT NULL THEN 1
    ELSE 0
  END;

  IF v_user_name IS NULL THEN
    SET p_reason = 'Kullanıcı veya senaryo bulunamadı.';
  ELSEIF v_user_status <> 'Aktif' THEN
    SET p_reason = 'Kullanıcı hesabı aktif değil.';
  ELSEIF v_scenario_status <> 'Aktif' THEN
    SET p_reason = 'Yetki senaryosu aktif değil.';
  ELSEIF v_role_level >= v_required_level THEN
    SET p_allowed = TRUE, p_status = 'İzin verildi', p_reason = CONCAT(v_user_role, ' rolü bu senaryo için yeterli yetkiye sahip.');
  ELSE
    SET p_reason = CONCAT(v_user_role, ' rolünün yetki seviyesi bu senaryo için yeterli değil.');
  END IF;
END//
DELIMITER ;

DROP TRIGGER IF EXISTS trg_authorization_scenario_check;

DELIMITER //
CREATE TRIGGER trg_authorization_scenario_check
BEFORE INSERT ON authorization_scenario_checks
FOR EACH ROW
BEGIN
  DECLARE v_allowed BOOLEAN;
  DECLARE v_status VARCHAR(30);
  DECLARE v_reason VARCHAR(255);
  CALL sp_kullanici_yetki_senaryosu_testi(NEW.user_id, NEW.scenario_id, v_allowed, v_status, v_reason);
  SET NEW.allowed = v_allowed, NEW.status = v_status, NEW.reason = v_reason, NEW.checked_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_kampanya_uygunluk_testi;

DELIMITER //
CREATE PROCEDURE sp_kampanya_uygunluk_testi(
  IN p_customer_id INT UNSIGNED,
  IN p_campaign_id INT UNSIGNED,
  OUT p_eligible BOOLEAN,
  OUT p_status VARCHAR(30),
  OUT p_reason VARCHAR(255)
)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_customer_status VARCHAR(20);
  DECLARE v_campaign_status VARCHAR(20);
  DECLARE v_target VARCHAR(80);
  DECLARE v_end_date DATE;
  DECLARE v_service_name VARCHAR(120);
  DECLARE v_customer_type VARCHAR(30);
  DECLARE v_registered_at DATE;
  DECLARE v_is_student BOOLEAN;
  DECLARE v_modem_age_years TINYINT UNSIGNED;
  SET p_eligible = FALSE;
  SET p_status = 'Uygun değil';
  SET p_reason = 'Müşteri veya kampanya bulunamadı.';

  SELECT c.status, ca.status, ca.target, ca.end_date, COALESCE(cs.service_name, ''),
    COALESCE(cp.customer_type, 'Bireysel'), COALESCE(cp.registered_at, CURRENT_DATE),
    COALESCE(cp.is_student, FALSE), COALESCE(cp.modem_age_years, 0)
    INTO v_customer_status, v_campaign_status, v_target, v_end_date, v_service_name,
      v_customer_type, v_registered_at, v_is_student, v_modem_age_years
  FROM customers c
  JOIN campaigns ca ON ca.id = p_campaign_id
  LEFT JOIN customer_services cs ON cs.customer_id = c.id
  LEFT JOIN customer_campaign_profiles cp ON cp.customer_id = c.id
  WHERE c.id = p_customer_id;

  IF v_customer_status IS NULL THEN
    SET p_reason = 'Müşteri veya kampanya bulunamadı.';
  ELSEIF v_customer_status <> 'Aktif' THEN
    SET p_reason = 'Müşteri hesabı aktif değil.';
  ELSEIF v_campaign_status <> 'Aktif' OR v_end_date < CURRENT_DATE THEN
    SET p_reason = 'Kampanya aktif değil veya kampanya süresi dolmuş.';
  ELSEIF LEFT(v_target, 6) = 'Mevcut' THEN
    SET p_eligible = TRUE, p_reason = 'Aktif müşteri koşulu sağlandı.';
  ELSEIF LEFT(v_target, 5) = 'Yeni ' AND v_registered_at >= CURRENT_DATE - INTERVAL 90 DAY THEN
    SET p_eligible = TRUE, p_reason = 'Müşteri son 90 gün içinde kaydolmuş.';
  ELSEIF v_target LIKE '%3+%' AND v_registered_at <= CURRENT_DATE - INTERVAL 3 YEAR THEN
    SET p_eligible = TRUE, p_reason = 'Müşteri en az 3 yıldır kayıtlı.';
  ELSEIF HEX(v_target) = 'C396C49F72656E6369' AND v_is_student THEN
    SET p_eligible = TRUE, p_reason = 'Müşteri öğrenci profiline sahip.';
  ELSEIF v_target = 'Kurumsal' AND v_customer_type = 'Kurumsal' THEN
    SET p_eligible = TRUE, p_reason = 'Müşteri kurumsal profiline sahip.';
  ELSEIF v_target = 'Eski modem' AND v_modem_age_years >= 3 THEN
    SET p_eligible = TRUE, p_reason = 'Müşterinin modemi en az 3 yıllık.';
  ELSEIF HEX(v_target) = '54C3BC6D206DC3BCC59F7465726C6572' THEN
    SET p_eligible = TRUE, p_reason = 'Tüm müşteriler hedefi sağlandı.';
  ELSEIF v_target = 'TV aboneleri' AND LOWER(v_service_name) LIKE '%tv%' THEN
    SET p_eligible = TRUE, p_reason = 'Müşterinin aktif TV hizmeti bulunuyor.';
  ELSEIF v_target = 'Spor paketi' AND LOWER(v_service_name) LIKE '%spor%' THEN
    SET p_eligible = TRUE, p_reason = 'Müşterinin aktif spor paketi bulunuyor.';
  ELSE
    SET p_reason = CONCAT('Müşterinin hizmeti "', v_service_name, '" kampanya hedefiyle eşleşmiyor.');
  END IF;

  IF p_eligible THEN SET p_status = 'Uygun'; END IF;
END//
DELIMITER ;

DROP TRIGGER IF EXISTS trg_campaign_eligibility_check;

DELIMITER //
CREATE TRIGGER trg_campaign_eligibility_check
BEFORE INSERT ON campaign_eligibility_checks
FOR EACH ROW
BEGIN
  DECLARE v_eligible BOOLEAN;
  DECLARE v_status VARCHAR(30);
  DECLARE v_reason VARCHAR(255);
  CALL sp_kampanya_uygunluk_testi(NEW.customer_id, NEW.campaign_id, v_eligible, v_status, v_reason);
  SET NEW.eligible = v_eligible,
      NEW.status = v_status,
      NEW.reason = v_reason,
      NEW.checked_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

CREATE TABLE IF NOT EXISTS connection_issue_processes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  ticket_id INT UNSIGNED NOT NULL,
  current_step VARCHAR(60) NOT NULL,
  status VARCHAR(30) NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_connection_process_customer (customer_id),
  KEY idx_connection_process_ticket (ticket_id),
  CONSTRAINT fk_connection_process_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT fk_connection_process_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS connection_issue_steps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  process_id BIGINT UNSIGNED NOT NULL,
  step_no TINYINT UNSIGNED NOT NULL,
  step_name VARCHAR(80) NOT NULL,
  result VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_connection_steps_process (process_id),
  CONSTRAINT fk_connection_steps_process FOREIGN KEY (process_id) REFERENCES connection_issue_processes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS field_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  process_id BIGINT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  team_id INT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Açık',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_field_tasks_process (process_id),
  KEY idx_field_tasks_customer (customer_id),
  CONSTRAINT fk_field_tasks_process FOREIGN KEY (process_id) REFERENCES connection_issue_processes (id),
  CONSTRAINT fk_field_tasks_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT fk_field_tasks_team FOREIGN KEY (team_id) REFERENCES teams (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS connection_issue_intake (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_no VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NOT NULL,
  subject VARCHAR(180) NOT NULL,
  category VARCHAR(50) NOT NULL,
  ping_reachable BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'Yeni',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_connection_intake_status (status),
  KEY idx_connection_intake_customer (customer_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP PROCEDURE IF EXISTS sp_baglanti_sorunu_yonet;

DELIMITER //
CREATE PROCEDURE sp_baglanti_sorunu_yonet(
  IN p_customer_no VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci,
  IN p_ping_reachable BOOLEAN
)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_customer_id INT UNSIGNED;
  DECLARE v_ticket_id INT UNSIGNED;
  DECLARE v_process_id BIGINT UNSIGNED;
  DECLARE v_team_id INT UNSIGNED;
  DECLARE v_ticket_no VARCHAR(20);
  SELECT id INTO v_customer_id
  FROM customers
  WHERE customer_no = p_customer_no
  LIMIT 1
  FOR UPDATE;

  IF v_customer_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Müşteri bulunamadı.';
  END IF;

  SET v_ticket_no = CONCAT('OTO-', LPAD(v_customer_id, 5, '0'), UNIX_TIMESTAMP());
  INSERT INTO tickets (ticket_no, subject, customer_id, category, created_at, status)
  VALUES (v_ticket_no, 'Bağlantı sorunu', v_customer_id, 'Teknik', CURRENT_DATE, 'İnceleniyor');
  SET v_ticket_id = LAST_INSERT_ID();

  INSERT INTO connection_issue_processes (customer_id, ticket_id, current_step, status)
  VALUES (v_customer_id, v_ticket_id, 'Müşteri talebi', 'Devam ediyor');
  SET v_process_id = LAST_INSERT_ID();

  INSERT INTO connection_issue_steps (process_id, step_no, step_name, result) VALUES
    (v_process_id, 1, 'Bağlantı sorunu', 'Talep alındı'),
    (v_process_id, 2, 'Müşteri talebi', 'Teknik inceleme başlatıldı'),
    (v_process_id, 3, 'Ping test', IF(p_ping_reachable, 'Erişim var', 'Erişim yok')),
    (v_process_id, 4, 'Bağlı servis restart edildi', 'Restart talimatı uygulandı');

  IF p_ping_reachable THEN
    UPDATE tickets SET status = 'Çözüldü' WHERE id = v_ticket_id;
    UPDATE connection_issue_processes
    SET current_step = 'Sorun giderilmiştir', status = 'Tamamlandı', completed_at = CURRENT_TIMESTAMP
    WHERE id = v_process_id;
    INSERT INTO connection_issue_steps (process_id, step_no, step_name, result)
    VALUES (v_process_id, 6, 'Sorun giderilmiştir', 'Müşterinin bağlantısı doğrulandı');
  ELSE
    SELECT id INTO v_team_id
    FROM teams
    WHERE status IN ('Müsait', 'Hazır')
    ORDER BY active_tasks ASC, id ASC
    LIMIT 1;

    INSERT INTO field_tasks (process_id, customer_id, team_id, title, status)
    VALUES (v_process_id, v_customer_id, v_team_id, 'Bağlantı sorunu saha incelemesi', 'Açık');
    UPDATE teams SET active_tasks = active_tasks + 1 WHERE id = v_team_id;
    UPDATE tickets SET status = 'Atandı' WHERE id = v_ticket_id;
    UPDATE connection_issue_processes
    SET current_step = 'Saha ekibine iş açıldı', status = 'Saha bekleniyor'
    WHERE id = v_process_id;
    INSERT INTO connection_issue_steps (process_id, step_no, step_name, result)
    VALUES (v_process_id, 7, 'Saha ekibine iş açıldı', 'Ping testi başarısız; saha görevi oluşturuldu');
  END IF;

END//
DELIMITER ;

CREATE TABLE IF NOT EXISTS customer_regions (
  customer_id INT UNSIGNED NOT NULL,
  region VARCHAR(120) NOT NULL,
  PRIMARY KEY (customer_id),
  KEY idx_customer_regions_region (region),
  CONSTRAINT fk_customer_regions_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO customer_regions (customer_id, region)
SELECT id, CASE MOD(id, 4)
  WHEN 0 THEN 'İstanbul Avrupa'
  WHEN 1 THEN 'İstanbul Anadolu'
  WHEN 2 THEN 'Ankara'
  ELSE 'İzmir'
END
FROM customers;

CREATE TABLE IF NOT EXISTS outage_announcements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  region VARCHAR(120) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Yeni',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_outage_announcements_status (status),
  KEY idx_outage_announcements_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mq_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  outage_id BIGINT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  channel ENUM('SMS', 'Telegram', 'E-posta') NOT NULL,
  recipient VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Bekliyor',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_mq_messages_outage (outage_id),
  KEY idx_mq_messages_status (status),
  CONSTRAINT fk_mq_messages_outage FOREIGN KEY (outage_id) REFERENCES outage_announcements (id),
  CONSTRAINT fk_mq_messages_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP PROCEDURE IF EXISTS sp_kesinti_mq_mesajlarini_uret;

DELIMITER //
CREATE PROCEDURE sp_kesinti_mq_mesajlarini_uret(IN p_outage_id BIGINT UNSIGNED)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_region VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
  DECLARE v_title VARCHAR(180);
  DECLARE v_message TEXT;
  DECLARE v_customer_id INT UNSIGNED;
  DECLARE v_name VARCHAR(120);
  DECLARE v_phone VARCHAR(30);
  DECLARE v_email VARCHAR(160);
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_customers CURSOR FOR
    SELECT c.id, c.name, c.phone, u.email
    FROM customers c
    JOIN customer_regions cr ON cr.customer_id = c.id
    LEFT JOIN users u ON u.id = c.id
    WHERE c.status = 'Aktif' AND (cr.region = v_region OR v_region = 'Tüm bölgeler');
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  SELECT region, title, message INTO v_region, v_title, v_message
  FROM outage_announcements WHERE id = p_outage_id;

  OPEN v_customers;
  customer_loop: LOOP
    FETCH v_customers INTO v_customer_id, v_name, v_phone, v_email;
    IF v_done THEN LEAVE customer_loop; END IF;
    INSERT INTO mq_messages (outage_id, customer_id, channel, recipient, message) VALUES
      (p_outage_id, v_customer_id, 'SMS', v_phone, CONCAT(v_name, ': ', v_title, ' - ', v_message)),
      (p_outage_id, v_customer_id, 'Telegram', CONCAT('customer:', v_customer_id), CONCAT(v_title, ' - ', v_message)),
      (p_outage_id, v_customer_id, 'E-posta', COALESCE(v_email, CONCAT('customer:', v_customer_id)), CONCAT(v_title, '\n', v_message));
  END LOOP;
  CLOSE v_customers;

END//
DELIMITER ;

DROP TRIGGER IF EXISTS trg_outage_announcement_mq;

DELIMITER //
CREATE TRIGGER trg_outage_announcement_mq
AFTER INSERT ON outage_announcements
FOR EACH ROW
BEGIN
  IF NEW.status = 'Yeni' THEN
    CALL sp_kesinti_mq_mesajlarini_uret(NEW.id);
  END IF;
END//
DELIMITER ;

DROP TRIGGER IF EXISTS trg_connection_issue_intake;

DELIMITER //
CREATE TRIGGER trg_connection_issue_intake
BEFORE INSERT ON connection_issue_intake
FOR EACH ROW
BEGIN
  IF NEW.status = 'Yeni'
    AND NEW.category = 'Teknik'
    AND LOWER(NEW.subject) LIKE '%bağlantı sorunu%' THEN
    CALL sp_baglanti_sorunu_yonet(NEW.customer_no, NEW.ping_reachable);
    SET NEW.status = 'İşlendi', NEW.processed_at = CURRENT_TIMESTAMP;
  END IF;
END//
DELIMITER ;
