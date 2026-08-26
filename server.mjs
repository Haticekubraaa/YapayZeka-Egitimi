import 'dotenv/config'
import express from 'express'
import mysql from 'mysql2/promise'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
app.use(express.json())
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(currentDirectory, 'dist')))
const port = Number(process.env.API_PORT || 4000)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_DATABASE || 'netline',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  waitForConnections: true,
  connectionLimit: 10,
})

const dateFormat = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
const toDate = (value) => dateFormat.format(new Date(value))
const toMoney = (value) => `₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
const rows = async (table) => (await pool.query(`SELECT * FROM ${table}`))[0]

app.get('/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/automation/collection-scenarios', async (_request, response) => {
  try {
    const [scenarios] = await pool.query('SELECT id, code, name, description FROM collection_scenarios WHERE status = ? ORDER BY id', ['Aktif'])
    const [invoices] = await pool.query(`
      SELECT i.id, i.invoice_no, i.amount, i.due_date, i.payment_channel, i.status, c.name AS customer
      FROM invoices i JOIN customers c ON c.id = i.customer_id ORDER BY i.id DESC
    `)
    const [recentChecks] = await pool.query(`
      SELECT cc.id, cc.decision, cc.status, cc.reason, cc.checked_at,
        i.invoice_no, i.amount, c.name AS customer, s.name AS scenario
      FROM collection_scenario_checks cc
      JOIN invoices i ON i.id = cc.invoice_id
      JOIN customers c ON c.id = i.customer_id
      JOIN collection_scenarios s ON s.id = cc.scenario_id
      ORDER BY cc.id DESC
      LIMIT 50
    `)
    response.json({ scenarios, invoices, recentChecks })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'Tahsilat senaryoları alınamadı.' })
  }
})

app.post('/api/automation/collection-scenarios/check', async (request, response) => {
  const { invoiceId, scenarioCode } = request.body
  if (!invoiceId || !scenarioCode) return response.status(400).json({ message: 'Fatura ve tahsilat senaryosu seçimi zorunludur.' })
  try {
    const [scenarios] = await pool.query('SELECT id FROM collection_scenarios WHERE code = ? AND status = ? LIMIT 1', [scenarioCode, 'Aktif'])
    if (!scenarios[0]) return response.status(404).json({ message: 'Tahsilat senaryosu bulunamadı.' })
    const [inserted] = await pool.query('INSERT INTO collection_scenario_checks (invoice_id, scenario_id) VALUES (?, ?)', [invoiceId, scenarios[0].id])
    const [checks] = await pool.query(`
      SELECT cc.id, cc.decision, cc.status, cc.reason, cc.checked_at,
        i.invoice_no, i.amount, i.status AS invoice_status, c.name AS customer, s.name AS scenario
      FROM collection_scenario_checks cc
      JOIN invoices i ON i.id = cc.invoice_id
      JOIN customers c ON c.id = i.customer_id
      JOIN collection_scenarios s ON s.id = cc.scenario_id
      WHERE cc.id = ?
    `, [inserted.insertId])
    response.status(201).json(checks[0])
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: error.message || 'Fatura tahsilat testi çalıştırılamadı.' })
  }
})

app.get('/api/automation/authorization-scenarios', async (_request, response) => {
  try {
    const [scenarios] = await pool.query('SELECT id, code, name, description, required_level FROM authorization_scenarios WHERE status = ? ORDER BY id', ['Aktif'])
    const [users] = await pool.query('SELECT id, name, email, role, status FROM users ORDER BY name')
    const [allowedChecks] = await pool.query(`
      SELECT ac.id, ac.status, ac.reason, ac.checked_at, u.name AS user_name,
        u.role, s.name AS scenario
      FROM authorization_scenario_checks ac
      JOIN users u ON u.id = ac.user_id
      JOIN authorization_scenarios s ON s.id = ac.scenario_id
      WHERE ac.allowed = 1
      ORDER BY ac.id DESC
      LIMIT 50
    `)
    response.json({ scenarios, users, allowedChecks })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'Yetki senaryoları alınamadı.' })
  }
})

app.post('/api/automation/authorization-scenarios/check', async (request, response) => {
  const { userId, scenarioCode } = request.body
  if (!userId || !scenarioCode) return response.status(400).json({ message: 'Kullanıcı ve yetki senaryosu seçimi zorunludur.' })
  try {
    const [scenarios] = await pool.query('SELECT id FROM authorization_scenarios WHERE code = ? AND status = ? LIMIT 1', [scenarioCode, 'Aktif'])
    if (!scenarios[0]) return response.status(404).json({ message: 'Yetki senaryosu bulunamadı.' })
    const [inserted] = await pool.query('INSERT INTO authorization_scenario_checks (user_id, scenario_id) VALUES (?, ?)', [userId, scenarios[0].id])
    const [checks] = await pool.query(`
      SELECT ac.id, ac.allowed, ac.status, ac.reason, ac.checked_at,
        u.name AS user_name, u.role, s.name AS scenario, s.description
      FROM authorization_scenario_checks ac
      JOIN users u ON u.id = ac.user_id
      JOIN authorization_scenarios s ON s.id = ac.scenario_id
      WHERE ac.id = ?
    `, [inserted.insertId])
    response.status(201).json(checks[0])
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: error.message || 'Yetki senaryosu testi çalıştırılamadı.' })
  }
})

app.post('/api/automation/campaign-eligibility', async (request, response) => {
  const { customerNo, campaignCode } = request.body
  if (!customerNo || !campaignCode) return response.status(400).json({ message: 'Müşteri ve kampanya seçimi zorunludur.' })
  try {
    const [customers] = await pool.query('SELECT id FROM customers WHERE customer_no = ? LIMIT 1', [customerNo])
    const [campaigns] = await pool.query('SELECT id FROM campaigns WHERE code = ? LIMIT 1', [campaignCode])
    if (!customers[0] || !campaigns[0]) return response.status(404).json({ message: 'Müşteri veya kampanya bulunamadı.' })
    const [result] = await pool.query(
      'INSERT INTO campaign_eligibility_checks (customer_id, campaign_id) VALUES (?, ?)',
      [customers[0].id, campaigns[0].id],
    )
    const [checks] = await pool.query(`
      SELECT ce.id, ce.eligible, ce.status, ce.reason, ce.checked_at,
        c.name AS customer, ca.name AS campaign, ca.target
      FROM campaign_eligibility_checks ce
      JOIN customers c ON c.id = ce.customer_id
      JOIN campaigns ca ON ca.id = ce.campaign_id
      WHERE ce.id = ?
    `, [result.insertId])
    response.status(201).json(checks[0])
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: error.message || 'Kampanya uygunluk testi çalıştırılamadı.' })
  }
})

app.get('/api/automation/campaign-eligibility/history', async (_request, response) => {
  try {
    const [checks] = await pool.query(`
      SELECT ce.id, ce.eligible, ce.status, ce.reason, ce.checked_at,
        c.name AS customer, ca.name AS campaign, ca.target
      FROM campaign_eligibility_checks ce
      JOIN customers c ON c.id = ce.customer_id
      JOIN campaigns ca ON ca.id = ce.campaign_id
      ORDER BY ce.id DESC
      LIMIT 50
    `)
    response.json(checks)
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'Kampanya uygunluk geçmişi alınamadı.' })
  }
})

app.get('/api/data', async (_request, response) => {
  try {
    const [customers, customerServices, services, campaigns, applications, invoices, tickets, teams, maintenance, announcements, users, settings, mqMessages] = await Promise.all([
      rows('customers'), rows('customer_services'), rows('services'), rows('campaigns'), rows('applications'), rows('invoices'), rows('tickets'), rows('teams'), rows('maintenance'), rows('announcements'), rows('users'), rows('settings'), rows('mq_messages'),
    ])
    const customerNames = Object.fromEntries(customers.map((customer) => [customer.id, customer.name]))
    const data = {
      dashboard: {
        kpis: [
          { label: 'Toplam müşteri', value: customers.length.toLocaleString('tr-TR'), change: '%8,4', direction: 'up', note: 'veritabanından', icon: 'users', accent: 'blue' },
          { label: 'Aktif hizmet', value: services.reduce((sum, service) => sum + service.active_subscribers, 0).toLocaleString('tr-TR'), change: '%5,2', direction: 'up', note: 'veritabanından', icon: 'package', accent: 'green' },
          { label: 'Bekleyen başvuru', value: applications.filter((item) => item.status === 'İnceleniyor').length.toLocaleString('tr-TR'), change: '%12,8', direction: 'up', note: 'veritabanından', icon: 'clipboard', accent: 'orange' },
          { label: 'Tahsilat oranı', value: `${Math.round(invoices.filter((item) => item.status === 'Ödendi').length / invoices.length * 100)}%`, change: '%2,1', direction: 'up', note: 'veritabanından', icon: 'money', accent: 'purple' },
        ],
        applications: applications.slice(0, 3).map((item, index) => ({ initials: item.service_name.split(' ').map((word) => word[0]).join('').slice(0, 2), name: customerNames[item.customer_id], detail: item.service_name, time: toDate(item.application_date), color: ['blue', 'orange', 'purple'][index] })),
        teams: teams.slice(0, 3).map((team, index) => ({ name: team.name, status: team.status, task: `${team.active_tasks} aktif görev`, color: ['green', 'blue', 'orange'][index] })),
        revenue: toMoney(invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0)),
      },
      customers: customers.map((item) => ({ 'Müşteri': item.name, 'Müşteri No': item.customer_no, Telefon: item.phone, Hizmet: customerServices.find((service) => service.customer_id === item.id)?.service_name || 'Hizmet yok', Durum: item.status })),
      services: services.map((item) => ({ Hizmet: item.name, Kod: item.code, 'Aktif Abone': item.active_subscribers.toLocaleString('tr-TR'), 'Aylık Ücret': toMoney(item.monthly_price), Durum: item.status })),
      campaigns: campaigns.map((item) => ({ Kampanya: item.name, Kod: item.code, Hedef: item.target, Katılım: item.participation.toLocaleString('tr-TR'), Bitiş: toDate(item.end_date), Durum: item.status })),
      applications: applications.map((item) => ({ Başvuru: customerNames[item.customer_id], No: item.application_no, Hizmet: item.service_name, Kanal: item.channel, Tarih: toDate(item.application_date), Durum: item.status })),
      invoices: invoices.map((item) => ({ Fatura: customerNames[item.customer_id], No: item.invoice_no, Tutar: toMoney(item.amount), 'Son Ödeme': toDate(item.due_date), 'Ödeme Kanalı': item.payment_channel, Durum: item.status })),
      tickets: tickets.map((item) => ({ Talep: item.subject, No: item.ticket_no, Müşteri: customerNames[item.customer_id], Kategori: item.category, Oluşturulma: toDate(item.created_at), Durum: item.status })),
      teams: teams.map((item) => ({ Ekip: item.name, Bölge: item.region, Sorumlu: item.manager, 'Aktif Görev': String(item.active_tasks), Durum: item.status })),
      maintenance: maintenance.map((item) => ({ Bakım: item.title, Bölge: item.region, Başlangıç: toDate(item.starts_at), Bitiş: toDate(item.ends_at), Etkilenen: item.affected_customers.toLocaleString('tr-TR'), Durum: item.status })),
      announcements: announcements.map((item) => ({ Duyuru: item.title, Kategori: item.category, 'Yayın Tarihi': toDate(item.published_at), 'Hedef Kitle': item.audience, Görüntülenme: item.views.toLocaleString('tr-TR'), Durum: item.status })),
      users: users.map((item) => ({ Kullanıcı: item.name, 'E-posta': item.email, Rol: item.role, 'Son Aktivite': item.last_activity, Durum: item.status })),
      settings: settings.map((item) => ({ Ayar: item.name, Kategori: item.category, Değer: item.value, Güncelleme: toDate(item.updated_at), Durum: item.status })),
      mqMessages: mqMessages.map((item) => ({ Kanal: item.channel, Alıcı: item.recipient, Mesaj: item.message, Durum: item.status, 'Oluşturulma': toDate(item.created_at) })),
    }
    response.json(data)
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'Veritabanı verileri alınamadı.' })
  }
})

app.post('/api/automation/connection-issues', async (request, response) => {
  const { customerNo, subject, pingReachable } = request.body
  if (!customerNo || !subject) return response.status(400).json({ message: 'Müşteri ve arıza başlığı zorunludur.' })
  try {
    const [result] = await pool.query(
      'INSERT INTO connection_issue_intake (customer_no, subject, category, ping_reachable) VALUES (?, ?, ?, ?)',
      [customerNo, subject, 'Teknik', Boolean(pingReachable)],
    )
    const [intake] = await pool.query('SELECT id, status, processed_at FROM connection_issue_intake WHERE id = ?', [result.insertId])
    const [process] = await pool.query('SELECT p.id AS process_id, p.ticket_id, p.status, p.current_step FROM connection_issue_processes p JOIN customers c ON c.id = p.customer_id WHERE c.customer_no = ? ORDER BY p.id DESC LIMIT 1', [customerNo])
    response.status(201).json({ intake: intake[0], process: process[0] })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: error.message || 'Arıza otomasyonu çalıştırılamadı.' })
  }
})

app.get('/api/automation/mq-messages', async (_request, response) => {
  try {
    const [messages] = await pool.query(`
      SELECT m.id, o.title AS outage_title, o.region, c.name AS customer,
        m.channel, m.recipient, m.message, m.status, m.created_at
      FROM mq_messages m
      JOIN outage_announcements o ON o.id = m.outage_id
      JOIN customers c ON c.id = m.customer_id
      ORDER BY m.id DESC
      LIMIT 100
    `)
    response.json(messages)
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'MQ mesajları alınamadı.' })
  }
})

app.patch('/api/automation/mq-messages/:id/status', async (request, response) => {
  const { status } = request.body
  if (!['Bekliyor', 'Gönderildi', 'Hata'].includes(status)) return response.status(400).json({ message: 'Geçersiz mesaj durumu.' })
  try {
    const [result] = await pool.query('UPDATE mq_messages SET status = ?, sent_at = IF(? = \'Gönderildi\', CURRENT_TIMESTAMP, NULL) WHERE id = ?', [status, status, request.params.id])
    if (!result.affectedRows) return response.status(404).json({ message: 'Mesaj bulunamadı.' })
    response.json({ id: Number(request.params.id), status })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'Mesaj durumu güncellenemedi.' })
  }
})

app.post('/api/automation/mq-messages/random', async (_request, response) => {
  try {
    const [outages] = await pool.query('SELECT id FROM outage_announcements ORDER BY id DESC LIMIT 1')
    const [customers] = await pool.query('SELECT id, name, phone FROM customers WHERE status = ? ORDER BY RAND() LIMIT 1', ['Aktif'])
    if (!outages[0] || !customers[0]) return response.status(400).json({ message: 'Random mesaj için kesinti ve aktif müşteri bulunamadı.' })
    const channels = ['SMS', 'Telegram', 'E-posta']
    const channel = channels[Math.floor(Math.random() * channels.length)]
    const customer = customers[0]
    const recipient = channel === 'SMS' ? customer.phone : channel === 'Telegram' ? `customer:${customer.id}` : `customer${customer.id}@netline.test`
    const message = `[Random test] ${customer.name} için otomatik ${channel} bildirimi: Kesinti ve otomasyon akışı kontrol ediliyor.`
    const [result] = await pool.query('INSERT INTO mq_messages (outage_id, customer_id, channel, recipient, message, status) VALUES (?, ?, ?, ?, ?, ?)', [outages[0].id, customer.id, channel, recipient, message, 'Bekliyor'])
    response.status(201).json({ id: result.insertId, customer: customer.name, channel, recipient, message, status: 'Bekliyor' })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'Random MQ mesajı oluşturulamadı.' })
  }
})

app.post('/api/automation/outages', async (request, response) => {
  const { title, region, message, startsAt, endsAt } = request.body
  if (!title || !region || !message || !startsAt || !endsAt) return response.status(400).json({ message: 'Kesinti bilgileri zorunludur.' })
  try {
    const [result] = await pool.query(
      'INSERT INTO outage_announcements (title, region, starts_at, ends_at, message) VALUES (?, ?, ?, ?, ?)',
      [title, region, startsAt, endsAt, message],
    )
    await pool.query('UPDATE outage_announcements SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?', ['Mesajlar kuyruğa alındı', result.insertId])
    const [summary] = await pool.query('SELECT status, processed_at FROM outage_announcements WHERE id = ?', [result.insertId])
    const [counts] = await pool.query('SELECT channel, COUNT(*) AS total FROM mq_messages WHERE outage_id = ? GROUP BY channel ORDER BY channel', [result.insertId])
    response.status(201).json({ outageId: result.insertId, outage: summary[0], messages: counts })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: error.message || 'Kesinti duyurusu oluşturulamadı.' })
  }
})

app.post('/api/customers', async (request, response) => {
  const { name, customerNo, phone, serviceName } = request.body
  if (!name || !phone) return response.status(400).json({ message: 'Ad ve telefon zorunludur.' })
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [customerResult] = await connection.execute('INSERT INTO customers (customer_no, name, phone, status) VALUES (?, ?, ?, ?)', [customerNo || `NL-${Date.now().toString().slice(-5)}`, name, phone, 'Aktif'])
    const serviceNameValue = serviceName || 'Fiber 100 Mbps'
    const [serviceRows] = await connection.execute('SELECT id FROM services WHERE name LIKE ? LIMIT 1', [`%${serviceNameValue}%`])
    await connection.execute('INSERT INTO customer_services (customer_id, service_id, service_name) VALUES (?, ?, ?)', [customerResult.insertId, serviceRows[0]?.id || null, serviceNameValue])
    await connection.commit()
    response.status(201).json({ 'Müşteri': name, 'Müşteri No': customerNo || `NL-${String(customerResult.insertId).padStart(5, '0')}`, Telefon: phone, Hizmet: serviceNameValue, Durum: 'Aktif' })
  } catch (error) {
    await connection.rollback()
    response.status(500).json({ message: 'Müşteri kaydedilemedi.' })
  } finally {
    connection.release()
  }
})

app.post('/api/tickets', async (request, response) => {
  const { customerNo, subject, category } = request.body
  if (!customerNo || !subject || !category) return response.status(400).json({ message: 'Müşteri, konu ve kategori zorunludur.' })
  try {
    const [customer] = await pool.query('SELECT id FROM customers WHERE customer_no = ? LIMIT 1', [customerNo])
    if (!customer[0]) return response.status(404).json({ message: 'Müşteri bulunamadı.' })
    const ticketNo = `TLP-${Date.now().toString().slice(-6)}`
    await pool.query('INSERT INTO tickets (ticket_no, subject, customer_id, category, created_at, status) VALUES (?, ?, ?, ?, CURRENT_DATE, ?)', [ticketNo, subject, customer[0].id, category, 'Açık'])
    response.status(201).json({ ticketNo, subject, customerNo, category, status: 'Açık' })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: 'Talep oluşturulamadı.' })
  }
})

app.post('/api/catalog/:entity', async (request, response) => {
  const { entity } = request.params
  const { code, name, monthlyPrice, target, endDate, customerNo, serviceName, channel, applicationDate } = request.body
  try {
    if (entity === 'services') {
      if (!code || !name || !monthlyPrice) return response.status(400).json({ message: 'Hizmet kodu, adı ve ücret zorunludur.' })
      await pool.query('INSERT INTO services (code, name, active_subscribers, monthly_price, status) VALUES (?, ?, 0, ?, ?)', [code, name, monthlyPrice, 'Aktif'])
    } else if (entity === 'campaigns') {
      if (!code || !name || !target || !endDate) return response.status(400).json({ message: 'Kampanya bilgileri zorunludur.' })
      await pool.query('INSERT INTO campaigns (name, code, target, participation, end_date, status) VALUES (?, ?, ?, 0, ?, ?)', [name, code, target, endDate, 'Aktif'])
    } else if (entity === 'applications') {
      const [customer] = await pool.query('SELECT id FROM customers WHERE customer_no = ? LIMIT 1', [customerNo])
      if (!customer[0] || !serviceName || !channel || !applicationDate) return response.status(400).json({ message: 'Müşteri, hizmet, kanal ve tarih zorunludur.' })
      await pool.query('INSERT INTO applications (application_no, customer_id, service_name, channel, application_date, status) VALUES (?, ?, ?, ?, ?, ?)', [`BŞV-${Date.now().toString().slice(-6)}`, customer[0].id, serviceName, channel, applicationDate, 'İnceleniyor'])
    } else return response.status(404).json({ message: 'Geçersiz kayıt türü.' })
    response.status(201).json({ message: 'Kayıt oluşturuldu.' })
  } catch (error) {
    console.error(error)
    response.status(500).json({ message: error.code === 'ER_DUP_ENTRY' ? 'Bu kod zaten kullanılıyor.' : 'Kayıt oluşturulamadı.' })
  }
})

app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
