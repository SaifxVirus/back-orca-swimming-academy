import { useEffect, useState } from 'react'
import { Activity, Bell, Boxes, CalendarDays, ChevronLeft, CircleDollarSign, ClipboardCheck, LayoutDashboard, Menu, Package, Plus, Search, Settings, Users, WalletCards, X } from 'lucide-react'
import './App.css'

type Dashboard = { metrics: { swimmerCount: number; subscriptionCount: number; groupCount: number; coachCount: number; collected: number; outstanding: number; lowStock: number }; recentSwimmers: Array<Record<string, string | number>>; alerts: Array<Record<string, string | number>> }
type View = 'الرئيسية' | 'السباحون' | 'الاشتراكات' | 'الحضور' | 'المدفوعات' | 'المخزون'

const money = (value: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''
const api = (path: string) => fetch(`${API_BASE}/api${path}`).then((response) => response.json())

function App() {
  const [view, setView] = useState<View>('الرئيسية')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [swimmers, setSwimmers] = useState<Array<Record<string, string | number>>>([])
  const [inventory, setInventory] = useState<Array<Record<string, string | number>>>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api('/dashboard').then(setDashboard).catch(() => setDashboard(null))
    api('/swimmers').then(setSwimmers).catch(() => setSwimmers([]))
    api('/inventory').then(setInventory).catch(() => setInventory([]))
  }, [])

  const nav = [
    { label: 'الرئيسية', icon: LayoutDashboard }, { label: 'السباحون', icon: Users }, { label: 'الاشتراكات', icon: ClipboardCheck },
    { label: 'الحضور', icon: CalendarDays }, { label: 'المدفوعات', icon: CircleDollarSign }, { label: 'المخزون', icon: Boxes },
  ] as const
  const shownSwimmers = swimmers.filter((swimmer) => String(swimmer.full_name).includes(search) || String(swimmer.swimmer_code).includes(search))

  return (
    <div className="app-shell" dir="rtl">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark">BO</div><div><strong>Back Orca</strong><span>أكاديمية السباحة</span></div><button className="close-menu" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
        <div className="workspace"><span className="status-dot" /> النظام يعمل بشكل طبيعي</div>
        <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={view === label ? 'active' : ''} onClick={() => { setView(label); setMenuOpen(false) }}><Icon size={19} /><span>{label}</span>{label === 'الرئيسية' && <span className="nav-arrow"><ChevronLeft size={15} /></span>}</button>)}</nav>
        <div className="sidebar-bottom"><button><Settings size={18} /> الإعدادات</button><div className="user-card"><div className="avatar">م</div><div><b>محمد مدير</b><span>مدير النظام</span></div><ChevronLeft size={15} /></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="menu-toggle" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div className="breadcrumb"><span>الأكاديمية</span><ChevronLeft size={15} /><b>{view}</b></div><div className="top-actions"><button className="icon-button notification"><Bell size={20} /><i /></button><div className="date-label">الثلاثاء، ٨ سبتمبر ٢٠٢٦</div></div></header>
        <div className="page-wrap">
          <section className="page-heading"><div><p className="eyebrow">نظرة عامة على الأكاديمية</p><h1>{view === 'الرئيسية' ? 'صباح الخير، محمد' : view}</h1><p className="subheading">إليك ملخص الأداء والتشغيل في أكاديمية Back Orca اليوم.</p></div><button className="primary-button"><Plus size={18} /> إضافة سجل جديد</button></section>
          {view === 'الرئيسية' && <>
            <section className="metric-grid">
              <Metric icon={Users} label="السباحون النشطون" value={dashboard?.metrics.swimmerCount ?? 0} trend="+12%" tone="teal" />
              <Metric icon={ClipboardCheck} label="الاشتراكات النشطة" value={dashboard?.metrics.subscriptionCount ?? 0} trend="+8%" tone="coral" />
              <Metric icon={WalletCards} label="تحصيل اليوم" value={money(dashboard?.metrics.collected ?? 0)} trend="+18%" tone="gold" />
              <Metric icon={Activity} label="المتأخرات" value={money(dashboard?.metrics.outstanding ?? 0)} trend="تحتاج متابعة" tone="ink" />
            </section>
            <div className="content-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>نشاط الأكاديمية</h2><p>الحضور والتحصيل خلال هذا الشهر</p></div><select defaultValue="هذا الشهر"><option>هذا الشهر</option><option>هذا الأسبوع</option></select></div><div className="chart"><div className="chart-y"><span>١٠٠</span><span>٧٥</span><span>٥٠</span><span>٢٥</span><span>٠</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 180" preserveAspectRatio="none"><path className="line-fill" d="M0 140 C40 130, 65 100, 110 115 S170 155, 210 100 S270 90, 305 110 S350 70, 390 85 S430 120, 470 68 S530 92, 570 45 S625 70, 700 25 L700 180 L0 180 Z" /><path className="line" d="M0 140 C40 130, 65 100, 110 115 S170 155, 210 100 S270 90, 305 110 S350 70, 390 85 S430 120, 470 68 S530 92, 570 45 S625 70, 700 25" /></svg><div className="chart-labels"><span>١ سبتمبر</span><span>٧ سبتمبر</span><span>١٤ سبتمبر</span><span>٢١ سبتمبر</span><span>٣٠ سبتمبر</span></div></div></div><div className="legend"><span><i className="teal-dot" /> التحصيل</span><span><i className="coral-dot" /> الحضور</span></div></section><section className="panel alerts-panel"><div className="panel-heading"><div><h2>تنبيهات مهمة</h2><p>تحتاج إلى انتباهك</p></div><button className="text-button">عرض الكل</button></div>{dashboard?.alerts.length ? dashboard.alerts.slice(0, 4).map((alert) => <div className="alert-row" key={String(alert.id)}><div className="alert-icon"><Bell size={16} /></div><div><b>اشتراك {alert.swimmer_name}</b><span>ينتهي في {alert.end_date}</span></div><ChevronLeft size={16} /></div>) : <div className="empty">لا توجد تنبيهات عاجلة</div>}{(dashboard?.metrics.lowStock ?? 0) > 0 && <div className="alert-row"><div className="alert-icon orange"><Package size={16} /></div><div><b>مخزون منخفض</b><span>{dashboard?.metrics.lowStock} أصناف تحتاج إعادة طلب</span></div><ChevronLeft size={16} /></div>}</section></div>
            <section className="panel table-panel"><div className="panel-heading"><div><h2>آخر السباحين المسجلين</h2><p>بيانات محدثة لحظيًا من قاعدة البيانات</p></div><button className="text-button" onClick={() => setView('السباحون')}>عرض جميع السباحين <ChevronLeft size={15} /></button></div><SwimmerTable swimmers={dashboard?.recentSwimmers ?? []} /></section>
          </>}
          {view === 'السباحون' && <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>قاعدة بيانات السباحين</h2><p>كل سبّاح يُسجل مرة واحدة ويُستخدم في بقية النظام.</p></div><label className="search"><Search size={17} /><input placeholder="ابحث بالاسم أو الرقم" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><SwimmerTable swimmers={shownSwimmers} /></section>}
          {view === 'المخزون' && <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>المخزون</h2><p>الرصيد الحالي والتنبيهات حسب حد إعادة الطلب.</p></div><button className="primary-button"><Plus size={18} /> إضافة صنف</button></div><InventoryTable inventory={inventory} /></section>}
          {!['الرئيسية', 'السباحون', 'المخزون'].includes(view) && <section className="empty-state panel"><div className="empty-state-icon"><CalendarDays size={28} /></div><h2>وحدة {view}</h2><p>الواجهة جاهزة للربط مع الجداول التشغيلية في قاعدة البيانات.</p><button className="primary-button"><Plus size={18} /> إنشاء أول سجل</button></section>}
        </div>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, trend, tone }: { icon: typeof Users; label: string; value: string | number; trend: string; tone: string }) { return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={21} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small className={tone === 'ink' ? 'neutral' : ''}>{trend}</small></div><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div></article> }
function SwimmerTable({ swimmers }: { swimmers: Array<Record<string, string | number>> }) { return <div className="table-scroll"><table><thead><tr><th>السبّاح</th><th>ولي الأمر</th><th>المجموعة</th><th>المدرب</th><th>المستوى</th><th>الحالة</th></tr></thead><tbody>{swimmers.map((swimmer) => <tr key={String(swimmer.id)}><td><div className="person"><div className="table-avatar">{String(swimmer.full_name ?? '').charAt(0)}</div><div><b>{swimmer.full_name}</b><span>{swimmer.swimmer_code}</span></div></div></td><td>{swimmer.parent_name}<small className="muted">{swimmer.parent_phone}</small></td><td>{swimmer.group_name}</td><td>{swimmer.coach_name}</td><td><span className="level">{swimmer.level}</span></td><td><span className="badge success">نشط</span></td></tr>)}</tbody></table>{swimmers.length === 0 && <div className="empty">لا توجد بيانات مطابقة</div>}</div> }
function InventoryTable({ inventory }: { inventory: Array<Record<string, string | number>> }) { return <div className="table-scroll"><table><thead><tr><th>الصنف</th><th>الفئة</th><th>الرصيد</th><th>تكلفة الوحدة</th><th>سعر البيع</th><th>الحالة</th></tr></thead><tbody>{inventory.map((item) => <tr key={String(item.id)}><td><div className="person"><div className="table-avatar box"><Package size={16} /></div><div><b>{item.name}</b><span>{item.sku}</span></div></div></td><td>{item.category}</td><td>{item.quantity}</td><td>{money(Number(item.average_cost))}</td><td>{money(Number(item.sale_price))}</td><td><span className={`badge ${item.stock_status === 'منخفض' ? 'warning' : 'success'}`}>{item.stock_status}</span></td></tr>)}</tbody></table></div> }

export default App
