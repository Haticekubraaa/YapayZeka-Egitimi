import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Check,
  Eye,
  Filter,
  Gauge,
  Headphones,
  LayoutDashboard,
  Mail,
  Menu,
  Megaphone,
  Network,
  Package,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  Send,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FormEvent } from "react";
type TableRecord = Record<string, string>;
type AppData = {
  dashboard: {
    kpis: {
      label: string;
      value: string;
      change: string;
      direction: string;
      note: string;
      icon: string;
      accent: string;
    }[];
    applications: {
      initials: string;
      name: string;
      detail: string;
      time: string;
      color: string;
    }[];
    teams: { name: string; status: string; task: string; color: string }[];
    revenue: string;
  };
  [key: string]: unknown;
};
type NavItem = {
  label: string;
  icon: LucideIcon;
  badge?: string;
  dataKey?: Exclude<keyof AppData, "dashboard">;
};
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Genel Bakış",
    items: [{ label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Müşteri & Hizmet",
    items: [
      {
        label: "Müşteriler",
        icon: Users,
        badge: "12.8K",
        dataKey: "customers",
      },
      { label: "Hizmetler", icon: Package, dataKey: "services" },
      { label: "Kampanyalar", icon: Megaphone, dataKey: "campaigns" },
      {
        label: "Başvurular",
        icon: ClipboardList,
        badge: "24",
        dataKey: "applications",
      },
    ],
  },
  {
    label: "Operasyon",
    items: [
      {
        label: "Faturalar & Tahsilatlar",
        icon: CreditCard,
        dataKey: "invoices",
      },
      {
        label: "Talep-Şikayet",
        icon: Headphones,
        badge: "8",
        dataKey: "tickets",
      },
      { label: "Saha & Teknik Ekip", icon: Wrench, dataKey: "teams" },
      { label: "Kesinti & Bakım", icon: Network, dataKey: "maintenance" },
    ],
  },
  {
    label: "Otomasyon",
    items: [
      { label: "Arıza Tespiti", icon: Siren },
      {
        label: "MQ Bildirim ve Otomasyon Masası",
        icon: Radio,
        dataKey: "mqMessages",
      },
      { label: "Kampanya Uygunluk Testi", icon: Megaphone },
      { label: "Kullanıcı Yetki Senaryosu Testi", icon: ShieldCheck },
      { label: "Fatura & Tahsilat Senaryo Testi", icon: CreditCard },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Duyurular", icon: Bell, dataKey: "announcements" },
      { label: "Kullanıcı Yönetimi", icon: ShieldCheck, dataKey: "users" },
    ],
  },
];
const pageMeta: Record<
  string,
  { title: string; subtitle: string; action: string }
> = {
  Müşteriler: {
    title: "Müşteriler",
    subtitle: "Müşteri hesapları ve aktif hizmetler",
    action: "Yeni müşteri",
  },
  Hizmetler: {
    title: "Hizmetler",
    subtitle: "Sunulan ürün ve paketlerin özeti",
    action: "Yeni hizmet",
  },
  Kampanyalar: {
    title: "Kampanyalar",
    subtitle: "Kampanya performansı ve katılım durumu",
    action: "Yeni kampanya",
  },
  Başvurular: {
    title: "Başvurular",
    subtitle: "Yeni hizmet başvurularını takip edin",
    action: "Yeni başvuru",
  },
  "Faturalar & Tahsilatlar": {
    title: "Faturalar & Tahsilatlar",
    subtitle: "Fatura ve ödeme hareketleri",
    action: "Tahsilat ekle",
  },
  "Talep-Şikayet": {
    title: "Talep-Şikayet",
    subtitle: "Müşteri taleplerini ve çözüm süreçlerini yönetin",
    action: "Yeni talep",
  },
  "Saha & Teknik Ekip": {
    title: "Saha & Teknik Ekip",
    subtitle: "Ekiplerin anlık görev ve uygunluk durumu",
    action: "Ekip ekle",
  },
  "Kesinti & Bakım": {
    title: "Kesinti & Bakım",
    subtitle: "Planlı çalışmalar ve etkilenen bölgeler",
    action: "Random kesinti",
  },
  Duyurular: {
    title: "Duyurular",
    subtitle: "Müşterilerle paylaşılan bilgilendirmeler",
    action: "Yeni duyuru",
  },
  "Kullanıcı Yönetimi": {
    title: "Kullanıcı Yönetimi",
    subtitle: "Portal kullanıcıları ve erişim rolleri",
    action: "Kullanıcı davet et",
  },
  Ayarlar: {
    title: "Ayarlar",
    subtitle: "Portal tercihleri ve güvenlik yapılandırması",
    action: "Ayar ekle",
  },
  "Arıza Tespiti": {
    title: "Arıza Tespiti",
    subtitle: "Bağlantı sorunu otomasyonunu test edin",
    action: "Süreci çalıştır",
  },
  "MQ Bildirim ve Otomasyon Masası": {
    title: "MQ Bildirim ve Otomasyon Masası",
    subtitle:
      "Bildirim akışlarını, otomasyon durumlarını ve mesaj kuyruğunu yönetin",
    action: "Random mesaj oluştur",
  },
  "Kampanya Uygunluk Testi": {
    title: "Kampanya Uygunluk Testi",
    subtitle: "Müşterinin kampanya koşullarını karşılayıp karşılamadığını test edin",
    action: "Uygunluğu test et",
  },
  "Kullanıcı Yetki Senaryosu Testi": {
    title: "Kullanıcı Yetki Senaryosu Testi",
    subtitle: "Kullanıcının belirli operasyon senaryolarına erişimini doğrulayın",
    action: "Yetkiyi test et",
  },
  "Fatura & Tahsilat Senaryo Testi": {
    title: "Fatura & Tahsilat Senaryo Testi",
    subtitle: "Fatura ödeme ve tahsilat akışlarını veritabanı otomasyonu ile doğrulayın",
    action: "Senaryoyu test et",
  },
};
type DataKey = keyof AppData;
type CampaignEligibilityResult = {
  eligible: boolean | number;
  status: string;
  reason: string;
  customer: string;
  campaign: string;
  target: string;
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("Bu ay");
  const [query, setQuery] = useState("");
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [ticketFormOpen, setTicketFormOpen] = useState(false);
  const [recordFormPage, setRecordFormPage] = useState<string | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [customers, setCustomers] = useState<TableRecord[]>([]);
  const [automationResult, setAutomationResult] = useState<{
    intakeId: number;
    processId?: number;
    ticketId?: number;
    outcome: string;
  } | null>(null);
  const [mqMessages, setMqMessages] = useState<TableRecord[]>([]);
  useEffect(() => {
    fetch("/api/data")
      .then((response) => {
        if (!response.ok) throw new Error("API error");
        return response.json();
      })
      .then((loadedData: AppData) => {
        setData(loadedData);
        setCustomers(loadedData.customers as TableRecord[]);
      })
      .catch((error) => console.error(error));
  }, []);
  if (!data) return <div className="loading-state">Veriler yükleniyor...</div>;
  const selectedItem = navGroups
    .flatMap((group) => group.items)
    .find((item) => item.label === activePage);
  const openPage = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
    setQuery("");
  };
  const reloadData = async () => {
    const response = await fetch("/api/data");
    const loadedData: AppData = await response.json();
    setData(loadedData);
    setCustomers(loadedData.customers as TableRecord[]);
  };
  const createRandomOutage = async () => {
    const regions = ["İstanbul Avrupa", "İstanbul Anadolu", "Ankara", "İzmir"];
    const region = regions[Math.floor(Math.random() * regions.length)];
    await fetch("/api/automation/outages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Bölgesel bağlantı kesintisi - ${region}`,
        region,
        message:
          "Teknik ekiplerimiz kesintiyi gidermek için çalışıyor. Gelişmeler SMS, Telegram ve e-posta ile iletilecektir.",
        startsAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
      }),
    });
    window.location.reload();
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Gauge size={19} strokeWidth={2.5} />
          </div>
          <span className="brand-name">
            netline<span>+</span>
          </span>
          <button
            className="icon-button mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Menüyü kapat"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-icon">
            <Building2 size={17} />
          </div>
          <div>
            <strong>Netline Operasyon</strong>
            <span>Genel merkez</span>
          </div>
          <ChevronDown size={15} className="muted-icon" />
        </div>
        <nav className="main-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${activePage === item.label ? "active" : ""}`}
                    onClick={() => openPage(item.label)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge && <small>{item.badge}</small>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="help-card">
            <div className="help-icon">
              <Headphones size={17} />
            </div>
            <div>
              <strong>Yardıma mı ihtiyacın var?</strong>
              <span>Destek merkezine git</span>
            </div>
            <ArrowUpRight size={15} />
          </div>
          <button
            className={`nav-item ${activePage === "Ayarlar" ? "active" : ""}`}
            onClick={() => openPage("Ayarlar")}
          >
            <Settings size={18} />
            <span>Ayarlar</span>
          </button>
          <div className="user-card">
            <div className="avatar avatar-navy">BK</div>
            <div>
              <strong>Berkay Kaya</strong>
              <span>Yönetici</span>
            </div>
            <ChevronDown size={15} className="muted-icon" />
          </div>
        </div>
      </aside>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Menüyü kapat"
        />
      )}
      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>
              {activePage === "Dashboard"
                ? "Genel Bakış"
                : activePage === "Arıza Tespiti" ||
                    activePage === "MQ Bildirim ve Otomasyon Masası"
                  ? "Otomasyon"
                  : "Müşteri & Hizmet"}
            </span>
            <i>/</i>
            <strong>{activePage}</strong>
          </div>
          <div className="topbar-actions">
            <div className="top-search">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Müşteri, hizmet ara..."
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="notification-button" aria-label="Bildirimler">
              <Bell size={19} />
              <b />
            </button>
            <div className="avatar avatar-orange">BK</div>
          </div>
        </header>
        <div className="page-body">
          {activePage === "Dashboard" ? (
            <Dashboard
              data={data}
              period={period}
              setPeriod={setPeriod}
              openPage={openPage}
              query={query}
            />
          ) : activePage === "Arıza Tespiti" ? (
            <AutomationPage
              customers={customers}
              result={automationResult}
              setResult={setAutomationResult}
            />
          ) : activePage === "MQ Bildirim ve Otomasyon Masası" ? (
            <MqMessagePage />
          ) : activePage === "Kampanya Uygunluk Testi" ? (
            <CampaignEligibilityPage
              customers={customers}
              campaigns={data.campaigns as TableRecord[]}
            />
          ) : activePage === "Kullanıcı Yetki Senaryosu Testi" ? (
            <AuthorizationScenarioPage />
          ) : activePage === "Fatura & Tahsilat Senaryo Testi" ? (
            <CollectionScenarioPage />
          ) : (
            <DataPage
              data={data}
              page={activePage}
              dataKey={selectedItem?.dataKey as DataKey}
              source={activePage === "Müşteriler" ? customers : undefined}
              query={query}
              setQuery={setQuery}
              action={pageMeta[activePage]?.action ?? "Yeni kayıt"}
              onAction={
                activePage === "Müşteriler"
                  ? () => setCustomerFormOpen(true)
                  : activePage === "Talep-Şikayet"
                    ? () => setTicketFormOpen(true)
                    : ["Hizmetler", "Kampanyalar", "Başvurular"].includes(
                          activePage,
                        )
                      ? () => setRecordFormPage(activePage)
                      : undefined
              }
            />
          )}
        </div>
      </main>
      {customerFormOpen && (
        <CustomerForm
          onClose={() => setCustomerFormOpen(false)}
          onSave={async (customer) => {
            const response = await fetch("/api/customers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: customer["Müşteri"],
                customerNo: customer["Müşteri No"],
                phone: customer.Telefon,
                serviceName: customer.Hizmet,
              }),
            });
            if (response.ok) {
              setCustomers([await response.json(), ...customers]);
              setCustomerFormOpen(false);
            }
          }}
        />
      )}
      {ticketFormOpen && (
        <TicketForm
          customers={customers}
          onClose={() => setTicketFormOpen(false)}
          onSaved={() => setTicketFormOpen(false)}
        />
      )}
      {recordFormPage && (
        <CatalogForm
          page={recordFormPage}
          customers={customers}
          onClose={() => setRecordFormPage(null)}
          onSaved={async () => {
            await reloadData();
            setRecordFormPage(null);
          }}
        />
      )}
    </div>
  );
}

function Dashboard({
  data,
  period,
  setPeriod,
  openPage,
  query,
}: {
  data: AppData;
  period: string;
  setPeriod: (value: string) => void;
  openPage: (page: string) => void;
  query: string;
}) {
  const applications = data.dashboard.applications.filter((item) =>
    item.name
      .toLocaleLowerCase("tr-TR")
      .includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">PAZARTESİ, 24 HAZİRAN 2024</p>
          <h1>
            Günaydın, Berkay <span>✦</span>
          </h1>
          <p className="heading-subtitle">
            Operasyonun bugünkü görünümü ve önemli gelişmeler burada.
          </p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button">
            <CalendarDays size={16} /> <span>Son 30 gün</span>
            <ChevronDown size={14} />
          </button>
          <button
            className="primary-button"
            onClick={() => openPage("Başvurular")}
          >
            <Plus size={17} /> Yeni başvuru
          </button>
        </div>
      </section>
      <div className="alert-strip">
        <div className="alert-symbol">
          <AlertTriangle size={17} />
        </div>
        <div>
          <strong>Planlı bakım bildirimi</strong>
          <span>
            İstanbul Avrupa yakasında 23:00 - 03:00 arası bakım çalışması
            yapılacaktır.
          </span>
        </div>
        <button onClick={() => openPage("Kesinti & Bakım")}>
          Detayları gör <ArrowUpRight size={14} />
        </button>
      </div>
      <section className="kpi-grid">
        {data.dashboard.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>
      <section className="content-grid">
        <div className="panel revenue-panel">
          <div className="panel-header">
            <div>
              <h2>Tahsilat özeti</h2>
              <p>Gerçekleşen tahsilat performansı</p>
            </div>
            <div className="segmented">
              <button
                className={period === "Bu ay" ? "selected" : ""}
                onClick={() => setPeriod("Bu ay")}
              >
                Bu ay
              </button>
              <button
                className={period === "Bu yıl" ? "selected" : ""}
                onClick={() => setPeriod("Bu yıl")}
              >
                Bu yıl
              </button>
            </div>
          </div>
          <div className="revenue-total">
            <strong>{data.dashboard.revenue}</strong>
            <span>
              <ArrowUpRight size={14} /> %14,6 <em>önceki döneme göre</em>
            </span>
          </div>
          <RevenueChart />
        </div>
        <div className="panel service-panel">
          <div className="panel-header">
            <div>
              <h2>Hizmet dağılımı</h2>
              <p>Aktif hizmetlerin özeti</p>
            </div>
            <button className="more-button">•••</button>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>18.392</strong>
                <span>aktif hizmet</span>
              </div>
            </div>
            <div className="legend">
              <Legend
                color="var(--blue)"
                label="Fiber internet"
                value="9.842"
                percent="53,5%"
              />
              <Legend
                color="var(--coral)"
                label="Kablo TV"
                value="4.218"
                percent="22,9%"
              />
              <Legend
                color="var(--orange)"
                label="D-Smart"
                value="2.906"
                percent="15,8%"
              />
              <Legend
                color="var(--lavender)"
                label="Diğer"
                value="1.426"
                percent="7,8%"
              />
            </div>
          </div>
          <button className="text-button" onClick={() => openPage("Hizmetler")}>
            Tüm hizmetleri görüntüle <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
      <section className="lower-grid">
        <div className="panel table-panel">
          <div className="panel-header">
            <div>
              <h2>Son başvurular</h2>
              <p>İşlem bekleyen yeni başvurular</p>
            </div>
            <button
              className="text-button"
              onClick={() => openPage("Başvurular")}
            >
              Tümünü gör <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="application-list">
            {applications.map((application) => (
              <div className="application-row" key={application.name}>
                <div className={`avatar avatar-${application.color}`}>
                  {application.initials}
                </div>
                <div className="row-main">
                  <strong>{application.name}</strong>
                  <span>{application.detail}</span>
                </div>
                <span className="row-time">{application.time}</span>
                <span className="status-pill pending">İnceleniyor</span>
                <button className="row-action">•••</button>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="empty-state">
                Aramanızla eşleşen başvuru bulunamadı.
              </div>
            )}
          </div>
        </div>
        <div className="panel teams-panel">
          <div className="panel-header">
            <div>
              <h2>Saha ekipleri</h2>
              <p>Anlık ekip durumu</p>
            </div>
            <button className="more-button">•••</button>
          </div>
          <div className="team-list">
            {data.dashboard.teams.map((team) => (
              <div className="team-row" key={team.name}>
                <span className={`status-dot ${team.color}`} />
                <div className="row-main">
                  <strong>{team.name}</strong>
                  <span>{team.task}</span>
                </div>
                <span className={`team-status ${team.color}`}>
                  {team.status}
                </span>
              </div>
            ))}
          </div>
          <button
            className="outline-button"
            onClick={() => openPage("Saha & Teknik Ekip")}
          >
            Ekipleri yönet <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
    </>
  );
}

function DataPage({
  data,
  page,
  dataKey,
  source,
  query,
  setQuery,
  action,
  onAction,
}: {
  data: AppData;
  page: string;
  dataKey: DataKey;
  source?: TableRecord[];
  query: string;
  setQuery: (value: string) => void;
  action: string;
  onAction?: () => void;
}) {
  const recordsSource = source ?? (data[dataKey] as TableRecord[]);
  const records = recordsSource.filter((record) =>
    Object.values(record).some((value) =>
      value
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
    ),
  );
  const columns = Object.keys(recordsSource[0] ?? {});
  const meta = pageMeta[page];
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">NETLINE OPERASYON</p>
          <h1>{meta.title}</h1>
          <p className="heading-subtitle">{meta.subtitle}</p>
        </div>
        <button className="primary-button" onClick={onAction}>
          <Plus size={17} /> {action}
        </button>
      </section>
      <section className="panel data-page-panel">
        <div className="panel-header">
          <div>
            <h2>{records.length} kayıt</h2>
            <p>Veritabanından güncel görünüm</p>
          </div>
          <div className="table-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Kayıtlarda ara..."
            />
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={`${page}-${index}`}>
                  {columns.map((column) => (
                    <td key={column}>
                      {column === "Durum" ? (
                        <span
                          className={`status-pill ${statusClass(record[column])}`}
                        >
                          {record[column]}
                        </span>
                      ) : (
                        record[column]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <div className="empty-state">
              Aramanızla eşleşen kayıt bulunamadı.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

type MqMessage = {
  id: number;
  outage_title: string;
  region: string;
  customer: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
  created_at: string;
};

function MqMessagePage() {
  const [messages, setMessages] = useState<MqMessage[]>([]);
  const [channel, setChannel] = useState("Tümü");
  const [status, setStatus] = useState("Tümü");
  const [selected, setSelected] = useState<MqMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/automation/mq-messages");
      if (!response.ok) throw new Error("MQ bildirimleri alınamadı.");
      const loadedMessages = await response.json();
      setMessages(loadedMessages);
      setSelected((current) => current ?? loadedMessages[0] ?? null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadMessages();
  }, []);
  const createRandomMessage = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/automation/mq-messages/random", {
        method: "POST",
      });
      const message = await response.json();
      if (!response.ok)
        throw new Error(message.message ?? "Random mesaj oluşturulamadı.");
      await loadMessages();
      setSelected(message);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Random mesaj oluşturulamadı.",
      );
    } finally {
      setCreating(false);
    }
  };
  const filtered = messages.filter(
    (item) =>
      (channel === "Tümü" || item.channel === channel) &&
      (status === "Tümü" || item.status === status),
  );
  const markSent = async (item: MqMessage) => {
    await fetch(`/api/automation/mq-messages/${item.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Gönderildi" }),
    });
    setMessages(
      messages.map((message) =>
        message.id === item.id ? { ...message, status: "Gönderildi" } : message,
      ),
    );
    setSelected({ ...item, status: "Gönderildi" });
  };
  const count = (value: string) =>
    messages.filter((item) => value === "Tümü" || item.status === value).length;
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">OTOMASYON / BİLDİRİM MASASI</p>
          <h1>MQ Bildirim ve Otomasyon Masası</h1>
          <p className="heading-subtitle">
            Kesinti bildirimlerini, kanal durumlarını ve otomasyon çıktısını tek
            merkezden yönetin.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={createRandomMessage}
          disabled={creating}
        >
          <RefreshCw size={15} className={creating ? "spin" : ""} />{" "}
          {creating ? "Oluşturuluyor..." : "Random mesaj oluştur"}
        </button>
      </section>
      <section className="mq-stats">
        <div>
          <span>Toplam</span>
          <strong>{messages.length}</strong>
        </div>
        <div>
          <span>Bekliyor</span>
          <strong>{count("Bekliyor")}</strong>
        </div>
        <div>
          <span>Gönderildi</span>
          <strong>{count("Gönderildi")}</strong>
        </div>
        <div>
          <span>Hata</span>
          <strong>{count("Hata")}</strong>
        </div>
      </section>
      <section className="panel mq-panel">
        <div className="mq-toolbar">
          <div className="filter-label">
            <Filter size={14} /> Filtrele
          </div>
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            <option>Tümü</option>
            <option>SMS</option>
            <option>Telegram</option>
            <option>E-posta</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option>Tümü</option>
            <option>Bekliyor</option>
            <option>Gönderildi</option>
            <option>Hata</option>
          </select>
          <span className="mq-count">{filtered.length} mesaj</span>
        </div>
        <div className="mq-table-wrap">
          <table className="data-table mq-table">
            <thead>
              <tr>
                <th>Kanal</th>
                <th>Müşteri</th>
                <th>Kesinti</th>
                <th>Alıcı</th>
                <th>Durum</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td>
                    <span
                      className={`channel-badge ${item.channel.toLowerCase().replace("ı", "i")}`}
                    >
                      <ChannelIcon channel={item.channel} />
                      {item.channel}
                    </span>
                  </td>
                  <td>{item.customer}</td>
                  <td>{item.outage_title}</td>
                  <td>{item.recipient}</td>
                  <td>
                    <span className={`status-pill ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(item);
                      }}
                      aria-label="Mesajı görüntüle"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              Filtreye uyan MQ mesajı bulunamadı.
            </div>
          )}
        </div>
        {selected && filtered.some((item) => item.id === selected.id) && (
          <div className="mq-inline-preview">
            <div className="mq-preview-heading">
              <div>
                <p className="eyebrow">MESAJ ÖNİZLEME</p>
                <h3>
                  {selected.channel} · {selected.customer}
                </h3>
              </div>
              <span className={`status-pill ${statusClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>
            <p>{selected.message}</p>
            <small>
              Alıcı: {selected.recipient} · {selected.outage_title}
            </small>
          </div>
        )}
      </section>
      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <section
            className="customer-modal mq-detail"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">MESAJ DETAYI</p>
                <h2>{selected.channel} bildirimi</h2>
                <p>
                  {selected.customer} · {selected.region}
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="Detayı kapat"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mq-message-preview">{selected.message}</div>
            <div className="mq-detail-meta">
              <span>
                Alıcı<strong>{selected.recipient}</strong>
              </span>
              <span>
                Durum<strong>{selected.status}</strong>
              </span>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setSelected(null)}
              >
                Kapat
              </button>
              {selected.status !== "Gönderildi" && (
                <button
                  className="primary-button"
                  onClick={() => markSent(selected)}
                >
                  <Check size={16} /> Gönderildi işaretle
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  return channel === "E-posta" ? (
    <Mail size={13} />
  ) : channel === "Telegram" ? (
    <Send size={13} />
  ) : (
    <Radio size={13} />
  );
}

function CampaignEligibilityPage({
  customers,
  campaigns,
}: {
  customers: TableRecord[];
  campaigns: TableRecord[];
}) {
  const [customerNo, setCustomerNo] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [result, setResult] = useState<CampaignEligibilityResult | null>(null);
  const [history, setHistory] = useState<(CampaignEligibilityResult & { id: number; eligible: boolean | number; checked_at: string })[]>([]);
  const [campaignQuery, setCampaignQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/automation/campaign-eligibility/history")
      .then((response) => response.json())
      .then((loadedHistory) => setHistory(loadedHistory))
      .catch(() => setError("Uygunluk geçmişi alınamadı."));
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/automation/campaign-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerNo, campaignCode }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || "Uygunluk testi çalıştırılamadı.");
      setResult(payload);
      setHistory((current) => [payload, ...current.filter((item) => item.id !== payload.id)]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Uygunluk testi çalıştırılamadı.",
      );
    } finally {
      setLoading(false);
    }
  };
  const isEligible = result?.eligible === true || result?.eligible === 1;
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesQuery = Object.values(campaign).some((value) => value.toLocaleLowerCase("tr-TR").includes(campaignQuery.toLocaleLowerCase("tr-TR")));
    const matchesStatus = statusFilter === "Tümü" || campaign.Durum === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const selectedCampaign = campaigns.find((campaign) => campaign.Kod === campaignCode);
  return (
    <>
      <section className="page-heading auth-heading">
        <div>
          <p className="eyebrow">OTOMASYON / KAMPANYA</p>
          <h1>Kampanya Uygunluk Testi</h1>
          <p className="heading-subtitle">
            Müşteri ve kampanya koşullarını veritabanı otomasyonu ile doğrulayın.
          </p>
        </div>
      </section>
      <section className="campaign-command-bar">
        <div><span className="auth-kicker">KAMPANYA KATALOĞU</span><strong>{campaigns.length} kampanya</strong></div>
        <div className="campaign-search"><Search size={15} /><input value={campaignQuery} onChange={(event) => setCampaignQuery(event.target.value)} placeholder="Kampanya ara..." /></div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Tümü</option><option>Aktif</option><option>Taslak</option><option>Sona erdi</option></select>
        <span className="campaign-visible">{filteredCampaigns.length} gösteriliyor</span>
      </section>
      <section className="authorization-workspace">
        <AuthorizationRail label="KAMPANYA" description="Müşteri ve kampanya koşullarını tek kontrolde karşılaştırın." />
        <div className="authorization-main">
        <form className="panel authorization-form" onSubmit={submit}>
          <div className="panel-header">
            <div>
              <h2>Yeni uygunluk testi</h2>
              <p>Kayıt trigger tarafından otomatik olarak değerlendirilir.</p>
            </div>
            <Megaphone size={23} className="automation-icon" />
          </div>
          <label>
            Müşteri
            <select required value={customerNo} onChange={(event) => setCustomerNo(event.target.value)}>
              <option value="">Müşteri seçin</option>
              {customers.map((customer) => (
                <option key={customer["Müşteri No"]} value={customer["Müşteri No"]}>
                  {customer["Müşteri"]} · {customer["Müşteri No"]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kampanya
            <select required value={campaignCode} onChange={(event) => setCampaignCode(event.target.value)}>
              <option value="">Kampanya seçin</option>
              {filteredCampaigns.map((campaign) => (
                <option key={campaign.Kod} value={campaign.Kod}>
                  {campaign.Kampanya} · {campaign.Kod}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" disabled={loading}>
            <Megaphone size={16} /> {loading ? "Kontrol ediliyor..." : "Uygunluğu test et"}
          </button>
          {error && <p className="form-error">{error}</p>}
          {selectedCampaign && <div className="campaign-preview"><span className="preview-label">SEÇİLİ KAMPANYA</span><strong>{selectedCampaign.Kampanya}</strong><small>{selectedCampaign.Hedef} · Bitiş: {selectedCampaign.Bitiş}</small></div>}
        </form>
        <section className="panel authorization-result eligibility-guide result-idle">
          <p className="eyebrow">SONUÇ</p>
          <h2>Uygunluk kararı</h2>
          {result ? (
            <div className={`eligibility-result ${isEligible ? "eligible" : "ineligible"}`}>
              {isEligible ? <CheckCircle2 size={22} /> : <X size={22} />}
              <div>
                <strong>{result.status}</strong>
                <small>{result.reason}</small>
                <small>{result.customer} · {result.campaign} · Hedef: {result.target}</small>
              </div>
            </div>
          ) : (
            <div className="eligibility-empty">
              <Megaphone size={25} />
              <strong>Henüz test çalıştırılmadı</strong>
              <small>Bir müşteri ve kampanya seçerek sonucu görüntüleyin.</small>
            </div>
          )}
          <div className="flow-step">
            <span>1</span>
            <div><strong>Test kaydı</strong><small>Seçimler audit tablosuna eklenir</small></div>
          </div>
          <div className="flow-step">
            <span>2</span>
            <div><strong>Procedure değerlendirmesi</strong><small>Durum, tarih ve hedef kontrol edilir</small></div>
          </div>
          <div className="flow-step">
            <span>3</span>
            <div><strong>Karar kaydı</strong><small>Uygunluk sonucu ve açıklaması saklanır</small></div>
          </div>
        </section>
        </div>
      </section>
      <section className="campaign-insights">
        <div className="campaign-insight-card"><span>Test sayısı</span><strong>{history.length}</strong><small>Son 50 kontrol</small></div>
        <div className="campaign-insight-card"><span>Uygun sonuçlar</span><strong>{history.filter((item) => item.eligible === true || item.eligible === 1).length}</strong><small>Koşulları sağlayanlar</small></div>
        <div className="campaign-insight-card"><span>Uygun olmayanlar</span><strong>{history.filter((item) => item.eligible === false || item.eligible === 0).length}</strong><small>İnceleme gerekenler</small></div>
        <div className="campaign-insight-card campaign-insight-highlight"><span>Son karar</span><strong>{result ? (isEligible ? "Uygun" : "Değil") : "-"}</strong><small>{result?.campaign ?? "Henüz test yok"}</small></div>
      </section>
      <section className="panel campaign-history-panel">
        <div className="history-header"><div><span className="auth-kicker">KARAR GEÇMİŞİ</span><h2>Son uygunluk kontrolleri</h2></div><span className="history-count">{history.length} kayıt</span></div>
        <div className="history-table-wrap"><table className="data-table campaign-history-table"><thead><tr><th>Müşteri</th><th>Kampanya</th><th>Hedef</th><th>Karar</th><th>Gerekçe</th><th>Zaman</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{item.customer}</td><td>{item.campaign}</td><td>{item.target}</td><td><span className={`status-pill ${item.eligible === true || item.eligible === 1 ? "success" : "danger"}`}>{item.status}</span></td><td>{item.reason}</td><td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.checked_at))}</td></tr>)}</tbody></table>{history.length === 0 && <div className="history-empty"><Megaphone size={18} /> Henüz uygunluk kontrolü yapılmadı.</div>}</div>
      </section>
    </>
  );
}

type AuthorizationUser = { id: number; name: string; email: string; role: string; status: string };
type AuthorizationScenario = { id: number; code: string; name: string; description: string; required_level: number };
type AuthorizationResult = { allowed: boolean | number; status: string; reason: string; user_name: string; role: string; scenario: string; description: string };
type AuthorizationCheck = { id: number; status: string; reason: string; checked_at: string; user_name: string; role: string; scenario: string };

function AuthorizationRail({ label, description }: { label: string; description: string }) {
  return <aside className="authorization-rail"><div className="auth-rail-top"><span className="auth-pulse" /> Otomasyon motoru aktif</div><div className="auth-lockup"><ShieldCheck size={32} /><span>NETLINE<br /><strong>{label}</strong></span></div><p>{description}</p><div className="auth-rule"><span>01</span><div><strong>Girdi</strong><small>Test parametreleri</small></div></div><div className="auth-rule"><span>02</span><div><strong>Procedure</strong><small>İş kuralı kontrolü</small></div></div><div className="auth-rule"><span>03</span><div><strong>Karar</strong><small>Sonuç ve audit kaydı</small></div></div><div className="auth-rail-footer">TRIGGER <b>·</b> PROCEDURE <b>·</b> AUDIT</div></aside>;
}

type CollectionInvoice = { id: number; invoice_no: string; amount: string; due_date: string; payment_channel: string; status: string; customer: string };
type CollectionScenario = { id: number; code: string; name: string; description: string };
type CollectionResult = { decision: string; status: string; reason: string; invoice_no: string; amount: string; invoice_status: string; customer: string; scenario: string };
type CollectionCheck = { id: number; decision: string; status: string; reason: string; checked_at: string; invoice_no: string; amount: string; customer: string; scenario: string };

function CollectionScenarioPage() {
  const [invoices, setInvoices] = useState<CollectionInvoice[]>([]);
  const [scenarios, setScenarios] = useState<CollectionScenario[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [scenarioCode, setScenarioCode] = useState("");
  const [result, setResult] = useState<CollectionResult | null>(null);
  const [recentChecks, setRecentChecks] = useState<CollectionCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/automation/collection-scenarios")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Tahsilat senaryoları alınamadı.");
        setInvoices(payload.invoices);
        setScenarios(payload.scenarios);
        setRecentChecks(payload.recentChecks);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Tahsilat senaryoları alınamadı."))
      .finally(() => setLoading(false));
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/automation/collection-scenarios/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: Number(invoiceId), scenarioCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Tahsilat testi çalıştırılamadı.");
      setResult(payload);
      setRecentChecks((current) => [payload, ...current.filter((check) => check.id !== payload.id)]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tahsilat testi çalıştırılamadı.");
    } finally {
      setChecking(false);
    }
  };
  const decisionReady = result?.decision === "Uygun";
  return (
    <>
      <section className="page-heading auth-heading">
        <div><p className="eyebrow">OTOMASYON / TAHSİLAT</p><h1>Fatura akışını doğrula</h1><p className="heading-subtitle">Bir faturayı seçin, tahsilat senaryosunu simüle edin.</p></div>
        <div className="auth-heading-mark"><CreditCard size={18} /><span>BILLING LAB<br /><b>LIVE</b></span></div>
      </section>
      <section className="authorization-workspace">
        <AuthorizationRail label="BILLING OPS" description="Fatura durumu, vade ve ödeme kanalını tek kontrolde değerlendirin." />
        <div className="authorization-main">
          <form className="authorization-form" onSubmit={submit}>
            <div className="auth-form-header"><div><span className="auth-kicker">TAHSİLAT SENARYOSU</span><h2>Bir fatura işlemi oluşturun</h2></div><span className="auth-index">01 / 01</span></div>
            <label>Fatura<select required value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} disabled={loading}><option value="">Fatura seçin</option>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_no} · {invoice.customer} · {invoice.amount} TL</option>)}</select></label>
            <label>İşlem senaryosu<select required value={scenarioCode} onChange={(event) => setScenarioCode(event.target.value)} disabled={loading}><option value="">Senaryo seçin</option>{scenarios.map((scenario) => <option key={scenario.code} value={scenario.code}>{scenario.name}</option>)}</select></label>
            {scenarioCode && <div className="scenario-note"><span>?</span><p>{scenarios.find((scenario) => scenario.code === scenarioCode)?.description}</p></div>}
            <button className="auth-submit" disabled={loading || checking}><CreditCard size={17} /> {loading ? "Senaryolar yükleniyor..." : checking ? "Fatura kontrol ediliyor..." : "Tahsilatı kontrol et"}<ArrowUpRight size={16} /></button>
            {error && <p className="form-error">{error}</p>}
          </form>
          <section className={`authorization-result ${result ? (decisionReady ? "result-allowed" : "result-denied") : "result-idle"}`}>
            <div className="result-top"><span className="auth-kicker">KARAR ÇIKTISI</span>{result && <span className="result-code">CHECK COMPLETE</span>}</div>
            {result ? <><div className="result-symbol">{decisionReady ? <CheckCircle2 size={30} /> : <X size={30} />}</div><h2>{result.status}</h2><p>{result.reason}</p><div className="result-subject"><span>{result.invoice_no}<small>{result.customer} · {result.amount} TL</small></span><span>{result.scenario}<small>{result.invoice_status}</small></span></div></> : <div className="result-placeholder"><span>00</span><h2>Karar bekleniyor</h2><p>Seçimleri tamamladığınızda tahsilat kararı burada görünecek.</p></div>}
          </section>
        </div>
      </section>
      <section className="collection-summary">
        <div><span>Toplam kontrol</span><strong>{recentChecks.length}</strong><small>Son 50 kayıt</small></div>
        <div><span>İşleme uygun</span><strong>{recentChecks.filter((check) => check.decision === "Uygun").length}</strong><small>Otomatik aksiyon bekliyor</small></div>
        <div><span>İşlem gerekmiyor</span><strong>{recentChecks.filter((check) => check.decision === "Tamamlandı").length}</strong><small>Ödenmiş faturalar</small></div>
        <div><span>Kontrol zamanı</span><strong>{recentChecks[0] ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(recentChecks[0].checked_at)) : "-"}</strong><small>Son çalışma</small></div>
      </section>
      <section className="panel collection-history">
        <div className="history-header"><div><span className="auth-kicker">TAHSİLAT AUDIT</span><h2>Son fatura senaryo testleri</h2></div><span className="history-count">{recentChecks.length} kayıt</span></div>
        <div className="history-table-wrap"><table className="data-table history-table collection-history-table"><thead><tr><th>Fatura</th><th>Müşteri</th><th>Senaryo</th><th>Karar</th><th>Durum</th><th>Kontrol zamanı</th></tr></thead><tbody>{recentChecks.map((check) => <tr key={check.id}><td>{check.invoice_no}<small>{check.amount} TL</small></td><td>{check.customer}</td><td>{check.scenario}</td><td><span className={`status-pill ${check.decision === "Uygun" ? "success" : check.decision === "Tamamlandı" ? "success" : "danger"}`}>{check.decision}</span></td><td>{check.status}</td><td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(check.checked_at))}</td></tr>)}</tbody></table>{recentChecks.length === 0 && <div className="history-empty"><CreditCard size={18} /> Henüz fatura senaryo testi çalıştırılmadı.</div>}</div>
      </section>
    </>
  );
}

function AuthorizationScenarioPage() {
  const [users, setUsers] = useState<AuthorizationUser[]>([]);
  const [scenarios, setScenarios] = useState<AuthorizationScenario[]>([]);
  const [userId, setUserId] = useState("");
  const [scenarioCode, setScenarioCode] = useState("");
  const [result, setResult] = useState<AuthorizationResult | null>(null);
  const [allowedChecks, setAllowedChecks] = useState<AuthorizationCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/automation/authorization-scenarios")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Yetki senaryoları alınamadı.");
        setUsers(payload.users);
        setScenarios(payload.scenarios);
        setAllowedChecks(payload.allowedChecks);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Yetki senaryoları alınamadı."))
      .finally(() => setLoading(false));
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/automation/authorization-scenarios/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), scenarioCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Yetki testi çalıştırılamadı.");
      setResult(payload);
      if (payload.allowed === true || payload.allowed === 1) {
        setAllowedChecks((current) => [payload, ...current.filter((check) => check.id !== payload.id)]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Yetki testi çalıştırılamadı.");
    } finally {
      setChecking(false);
    }
  };
  const allowed = result?.allowed === true || result?.allowed === 1;
  return (
    <>
      <section className="page-heading auth-heading">
        <div>
          <p className="eyebrow">OTOMASYON / YETKİ KONTROLÜ</p>
          <h1>İşlem erişimini doğrula</h1>
          <p className="heading-subtitle">Bir kullanıcıyı seçin, yapabileceği işlemi simüle edin.</p>
        </div>
        <div className="auth-heading-mark"><ShieldCheck size={18} /><span>POLICY LAB<br /><b>LIVE</b></span></div>
      </section>
      <section className="authorization-workspace">
        <aside className="authorization-rail">
          <div className="auth-rail-top"><span className="auth-pulse" /> Yetki motoru aktif</div>
          <div className="auth-lockup"><ShieldCheck size={32} /><span>NETLINE<br /><strong>ACCESS</strong></span></div>
          <p>Rol, hesap durumu ve senaryo seviyesini tek kontrolde karşılaştırın.</p>
          <div className="auth-rule"><span>01</span><div><strong>Kimlik</strong><small>Kullanıcı hesabı</small></div></div>
          <div className="auth-rule"><span>02</span><div><strong>Rol seviyesi</strong><small>Operasyon kapsamı</small></div></div>
          <div className="auth-rule"><span>03</span><div><strong>Karar</strong><small>İzin veya ret gerekçesi</small></div></div>
          <div className="auth-rail-footer">TRIGGER <b>·</b> PROCEDURE <b>·</b> AUDIT</div>
        </aside>
        <div className="authorization-main">
          <form className="authorization-form" onSubmit={submit}>
            <div className="auth-form-header"><div><span className="auth-kicker">TEST SENARYOSU</span><h2>Bir erişim isteği oluşturun</h2></div><span className="auth-index">01 / 01</span></div>
            <label>Kullanıcı<select required value={userId} onChange={(event) => setUserId(event.target.value)} disabled={loading}><option value="">Kullanıcı seçin</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}</select></label>
            <label>İşlem senaryosu<select required value={scenarioCode} onChange={(event) => setScenarioCode(event.target.value)} disabled={loading}><option value="">Senaryo seçin</option>{scenarios.map((scenario) => <option key={scenario.code} value={scenario.code}>{scenario.name}</option>)}</select></label>
            {scenarioCode && <div className="scenario-note"><span>?</span><p>{scenarios.find((scenario) => scenario.code === scenarioCode)?.description}</p></div>}
            <button className="auth-submit" disabled={loading || checking}><ShieldCheck size={17} /> {loading ? "Senaryolar yükleniyor..." : checking ? "Yetki doğrulanıyor..." : "Erişimi kontrol et"}<ArrowUpRight size={16} /></button>
            {error && <p className="form-error">{error}</p>}
          </form>
          <section className={`authorization-result ${result ? (allowed ? "result-allowed" : "result-denied") : "result-idle"}`}>
            <div className="result-top"><span className="auth-kicker">KARAR ÇIKTISI</span>{result && <span className="result-code">CHECK COMPLETE</span>}</div>
            {result ? <><div className="result-symbol">{allowed ? <CheckCircle2 size={30} /> : <X size={30} />}</div><h2>{result.status}</h2><p>{result.reason}</p><div className="result-subject"><span>{result.user_name}<small>{result.role}</small></span><span>{result.scenario}<small>Yetki senaryosu</small></span></div></> : <div className="result-placeholder"><span>00</span><h2>Karar bekleniyor</h2><p>Seçimleri tamamladığınızda erişim kararı burada görünecek.</p></div>}
          </section>
        </div>
      </section>
      <section className="panel authorization-history">
        <div className="history-header"><div><span className="auth-kicker">AUDIT KAYITLARI</span><h2>İzin verilen erişimler</h2></div><span className="history-count">{allowedChecks.length} kayıt</span></div>
        <div className="history-table-wrap">
          <table className="data-table history-table"><thead><tr><th>Kullanıcı</th><th>Rol</th><th>Senaryo</th><th>Durum</th><th>Kontrol zamanı</th></tr></thead><tbody>{allowedChecks.map((check) => <tr key={check.id}><td>{check.user_name}</td><td>{check.role}</td><td>{check.scenario}</td><td><span className="status-pill success">{check.status}</span></td><td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(check.checked_at))}</td></tr>)}</tbody></table>
          {allowedChecks.length === 0 && <div className="history-empty"><ShieldCheck size={18} /> Henüz izin verilen bir erişim kaydı yok.</div>}
        </div>
      </section>
    </>
  );
}

function AutomationPage({
  customers,
  result,
  setResult,
}: {
  customers: TableRecord[];
  result: {
    intakeId: number;
    processId?: number;
    ticketId?: number;
    outcome: string;
  } | null;
  setResult: (
    result: {
      intakeId: number;
      processId?: number;
      ticketId?: number;
      outcome: string;
    } | null,
  ) => void;
}) {
  const [customerNo, setCustomerNo] = useState("");
  const [subject, setSubject] = useState("Bağlantı sorunu bildirimi");
  const [pingReachable, setPingReachable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/automation/connection-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerNo, subject, pingReachable }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || "Otomasyon çalıştırılamadı.");
      setResult({
        intakeId: payload.intake.id,
        processId: payload.process?.process_id,
        ticketId: payload.process?.ticket_id,
        outcome: pingReachable
          ? "Sorun giderilmiştir"
          : "Saha ekibine iş açıldı",
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Otomasyon çalıştırılamadı.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <section className="page-heading auth-heading">
        <div>
          <p className="eyebrow">OTOMASYON / TEST</p>
          <h1>Arıza Tespiti</h1>
          <p className="heading-subtitle">
            Bağlantı sorunu sürecini trigger üzerinden çalıştırın.
          </p>
        </div>
      </section>
      <section className="authorization-workspace">
        <AuthorizationRail label="FAULT OPS" description="Bağlantı sorununu trigger üzerinden analiz edip aksiyona dönüştürün." />
        <div className="authorization-main">
        <form className="panel authorization-form" onSubmit={submit}>
          <div className="panel-header">
            <div>
              <h2>Yeni test kaydı</h2>
              <p>Bu kayıt connection_issue_intake tablosuna eklenir.</p>
            </div>
            <Siren size={23} className="automation-icon" />
          </div>
          <label>
            Müşteri
            <select
              required
              value={customerNo}
              onChange={(event) => setCustomerNo(event.target.value)}
            >
              <option value="">Müşteri seçin</option>
              {customers.map((customer) => (
                <option
                  key={customer["Müşteri No"]}
                  value={customer["Müşteri No"]}
                >
                  {customer["Müşteri"]} · {customer["Müşteri No"]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Arıza başlığı
            <input
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Ping erişimi var</strong>
              <small>Açıksa süreç ticket'ı otomatik çözer.</small>
            </span>
            <input
              type="checkbox"
              checked={pingReachable}
              onChange={(event) => setPingReachable(event.target.checked)}
            />
          </label>
          <button className="primary-button" disabled={loading}>
            <Siren size={16} /> {loading ? "Çalışıyor..." : "Süreci çalıştır"}
          </button>
          {error && <p className="form-error">{error}</p>}
        </form>
        <section className="panel authorization-result result-idle">
          <p className="eyebrow">AKIŞ</p>
          <h2>Trigger adımları</h2>
          <div className="flow-step">
            <span>1</span>
            <div>
              <strong>Test kaydı</strong>
              <small>Yeni teknik kayıt alınır</small>
            </div>
          </div>
          <div className="flow-step">
            <span>2</span>
            <div>
              <strong>Otomatik kontrol</strong>
              <small>Trigger procedure'ü çağırır</small>
            </div>
          </div>
          <div className="flow-step">
            <span>3</span>
            <div>
              <strong>
                {pingReachable ? "Ticket kapanır" : "Saha görevi açılır"}
              </strong>
              <small>
                {pingReachable ? "Bağlantı doğrulanır" : "Müsait ekibe atanır"}
              </small>
            </div>
          </div>
          {result && (
            <div className="automation-result">
              <CheckCircle2 size={18} />
              <div>
                <strong>{result.outcome}</strong>
                <small>
                  Ticket #{result.ticketId} · Süreç #{result.processId}
                </small>
              </div>
            </div>
          )}
        </section>
        </div>
      </section>
    </>
  );
}
function CustomerForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (customer: TableRecord) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    number: "",
    phone: "",
    service: "Fiber 100 Mbps",
  });
  const update = (field: keyof typeof form, value: string) =>
    setForm({ ...form, [field]: value });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      Müşteri: form.name,
      "Müşteri No": form.number || `NL-${Date.now().toString().slice(-5)}`,
      Telefon: form.phone,
      Hizmet: form.service,
      Durum: "Aktif",
    });
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="customer-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">MÜŞTERİ YÖNETİMİ</p>
            <h2>Yeni müşteri kaydı</h2>
            <p>Yeni müşteri bilgilerini girin.</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Formu kapat"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Ad soyad
            <input
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Örn. Ayşe Yıldız"
            />
          </label>
          <label>
            Müşteri numarası
            <input
              value={form.number}
              onChange={(event) => update("number", event.target.value)}
              placeholder="Boş bırakılırsa otomatik oluşturulur"
            />
          </label>
          <label>
            Telefon
            <input
              required
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="05xx xxx xx xx"
            />
          </label>
          <label>
            Hizmet
            <select
              value={form.service}
              onChange={(event) => update("service", event.target.value)}
            >
              <option>Fiber 100 Mbps</option>
              <option>Fiber 500 Mbps</option>
              <option>Fiber 1000 Mbps</option>
              <option>Kablo TV</option>
              <option>D-Smart</option>
            </select>
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Vazgeç
            </button>
            <button type="submit" className="primary-button">
              <Plus size={17} /> Kaydet
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TicketForm({
  customers,
  onClose,
  onSaved,
}: {
  customers: TableRecord[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [customerNo, setCustomerNo] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Teknik");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerNo, subject, category }),
    });
    if (response.ok) onSaved();
    else setError((await response.json()).message ?? "Talep oluşturulamadı.");
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="customer-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">TALEP YÖNETİMİ</p>
            <h2>Yeni talep oluştur</h2>
            <p>Müşteri talebini destek akışına ekleyin.</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Formu kapat"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Müşteri
            <select
              required
              value={customerNo}
              onChange={(event) => setCustomerNo(event.target.value)}
            >
              <option value="">Müşteri seçin</option>
              {customers.map((customer) => (
                <option
                  key={customer["Müşteri No"]}
                  value={customer["Müşteri No"]}
                >
                  {customer.Müşteri} · {customer["Müşteri No"]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Konu
            <input
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Örn. İnternet bağlantısı yavaş"
            />
          </label>
          <label>
            Kategori
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Teknik</option>
              <option>Faturalama</option>
              <option>Kurulum</option>
              <option>Abonelik</option>
              <option>Satış</option>
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Vazgeç
            </button>
            <button type="submit" className="primary-button">
              <Plus size={17} /> Kaydet
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CatalogForm({
  page,
  customers,
  onClose,
  onSaved,
}: {
  page: string;
  customers: TableRecord[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    monthlyPrice: "",
    target: "",
    endDate: "",
    customerNo: "",
    serviceName: "Fiber 100 Mbps",
    channel: "Web",
    applicationDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field: keyof typeof form, value: string) =>
    setForm({ ...form, [field]: value });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const entity =
      page === "Hizmetler"
        ? "services"
        : page === "Kampanyalar"
          ? "campaigns"
          : "applications";
    try {
      const response = await fetch(`/api/catalog/${entity}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (response.ok) onSaved();
      else setError(payload.message ?? "Kayıt oluşturulamadı.");
    } catch {
      setError(
        "Sunucuya ulaşılamadı. API servisinin çalıştığını kontrol edin.",
      );
    } finally {
      setSaving(false);
    }
  };
  const labels = {
    Hizmetler: ["Yeni hizmet", "Yeni hizmet bilgilerini girin."],
    Kampanyalar: [
      "Yeni kampanya",
      "Kampanya bilgilerini ve hedefini tanımlayın.",
    ],
    Başvurular: ["Yeni başvuru", "Başvuruyu müşteri hizmet akışına ekleyin."],
  }[page] ?? ["Yeni kayıt", "Kayıt bilgilerini girin."];
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="customer-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{page.toUpperCase()}</p>
            <h2>{labels[0]}</h2>
            <p>{labels[1]}</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Formu kapat"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          {page === "Hizmetler" && (
            <>
              <label>
                Hizmet adı
                <input
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Örn. Fiber 200 Mbps"
                />
              </label>
              <label>
                Hizmet kodu
                <input
                  required
                  value={form.code}
                  onChange={(event) => update("code", event.target.value)}
                  placeholder="FBR-200"
                />
              </label>
              <label>
                Aylık ücret
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyPrice}
                  onChange={(event) =>
                    update("monthlyPrice", event.target.value)
                  }
                  placeholder="499.00"
                />
              </label>
            </>
          )}
          {page === "Kampanyalar" && (
            <>
              <label>
                Kampanya adı
                <input
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Örn. Sonbahar fırsatı"
                />
              </label>
              <label>
                Kampanya kodu
                <input
                  required
                  value={form.code}
                  onChange={(event) => update("code", event.target.value)}
                  placeholder="SONBAHAR26"
                />
              </label>
              <label>
                Hedef kitle
                <input
                  required
                  value={form.target}
                  onChange={(event) => update("target", event.target.value)}
                  placeholder="Yeni müşteri"
                />
              </label>
              <label>
                Bitiş tarihi
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(event) => update("endDate", event.target.value)}
                />
              </label>
            </>
          )}
          {page === "Başvurular" && (
            <>
              <label>
                Müşteri
                <select
                  required
                  value={form.customerNo}
                  onChange={(event) => update("customerNo", event.target.value)}
                >
                  <option value="">Müşteri seçin</option>
                  {customers.map((customer) => (
                    <option
                      key={customer["Müşteri No"]}
                      value={customer["Müşteri No"]}
                    >
                      {customer.Müşteri} · {customer["Müşteri No"]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Hizmet
                <input
                  required
                  value={form.serviceName}
                  onChange={(event) =>
                    update("serviceName", event.target.value)
                  }
                />
              </label>
              <label>
                Kanal
                <select
                  value={form.channel}
                  onChange={(event) => update("channel", event.target.value)}
                >
                  <option>Web</option>
                  <option>Çağrı merkezi</option>
                  <option>Bayi</option>
                  <option>Mobil</option>
                </select>
              </label>
              <label>
                Başvuru tarihi
                <input
                  required
                  type="date"
                  value={form.applicationDate}
                  onChange={(event) =>
                    update("applicationDate", event.target.value)
                  }
                />
              </label>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Vazgeç
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              <Plus size={17} /> {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
function statusClass(status: string) {
  return status.includes("Aktif") ||
    status.includes("Gönderildi") ||
    status.includes("Ödendi") ||
    status.includes("Onaylandı") ||
    status.includes("Yayında") ||
    status.includes("Çözüldü")
    ? "success"
    : status.includes("Gecik") || status.includes("İptal")
      ? "danger"
      : "pending";
}
function KpiCard({
  label,
  value,
  change,
  direction,
  note,
  icon,
  accent,
}: {
  label: string;
  value: string;
  change: string;
  direction: string;
  note: string;
  icon: string;
  accent: string;
}) {
  const icons = {
    users: Users,
    package: Package,
    clipboard: ClipboardList,
    money: CircleDollarSign,
  };
  const Icon = icons[icon as keyof typeof icons];
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${accent}`}>
        <Icon size={19} />
      </div>
      <div className="kpi-label">
        {label}
        <span className="info-dot">i</span>
      </div>
      <strong className="kpi-value">{value}</strong>
      <div className={`kpi-change ${direction}`}>
        <span>
          {direction === "up" ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {change}
        </span>
        <em>{note}</em>
      </div>
    </div>
  );
}
function Legend({
  color,
  label,
  value,
  percent,
}: {
  color: string;
  label: string;
  value: string;
  percent: string;
}) {
  return (
    <div className="legend-row">
      <span className="legend-color" style={{ background: color }} />
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{percent}</em>
    </div>
  );
}
function RevenueChart() {
  const bars = [42, 56, 48, 72, 62, 80, 67, 92, 73, 84, 78, 96];
  return (
    <div className="chart-area">
      <div className="chart-y">
        <span>₺400K</span>
        <span>₺300K</span>
        <span>₺200K</span>
        <span>₺100K</span>
        <span>₺0</span>
      </div>
      <div className="chart">
        <div className="grid-lines">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="bars">
          {bars.map((height, index) => (
            <div
              className={`bar-wrap ${index === 7 ? "highlighted" : ""}`}
              key={index}
            >
              <div className="bar" style={{ height: `${height}%` }} />
              {index === 7 && <span>₺385K</span>}
            </div>
          ))}
        </div>
        <div className="chart-x">
          <span>Oca</span>
          <span>Şub</span>
          <span>Mar</span>
          <span>Nis</span>
          <span>May</span>
          <span>Haz</span>
        </div>
      </div>
    </div>
  );
}
export default App;
