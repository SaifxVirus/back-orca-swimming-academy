import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, Bell, Boxes, CalendarDays, ChevronLeft, CircleDollarSign, ClipboardCheck, LayoutDashboard, Menu, Package, Plus, Search, Settings, Users, WalletCards, X } from 'lucide-react'
import './App.css'

type Dashboard = { metrics: { swimmerCount: number; subscriptionCount: number; groupCount: number; coachCount: number; collected: number; outstanding: number; lowStock: number }; recentSwimmers: Array<Record<string, string | number>>; alerts: Array<Record<string, string | number>> }
type View = 'الرئيسية' | 'السباحون' | 'الاشتراكات' | 'الحضور' | 'المدفوعات' | 'المخزون'
type Parent = { id: string; name: string; phone: string }
type SwimmerForm = { firstName: string; fatherName: string; familyName: string; parentId: string; birthDate: string; gender: string; level: string }

const money = (value: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''
const api = (path: string, options?: RequestInit) => fetch(`${API_BASE}/api${path}`, options).then(async (response) => {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'حدث خطأ أثناء تنفيذ العملية')
  return data
})

function App() {
  const [view, setView] = useState<View>('الرئيسية')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [swimmers, setSwimmers] = useState<Array<Record<string, string | number>>>([])
  const [inventory, setInventory] = useState<Array<Record<string, string | number>>>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState<SwimmerForm>({ firstName: '', fatherName: '', familyName: '', parentId: '', birthDate: '', gender: 'ذكر', level: 'مبتدئ' })

  const loadData = () => {
    api('/dashboard').then(setDashboard).catch(() => setDashboard(null))
    api('/swimmers').then(setSwimmers).catch(() => setSwimmers([]))
    api('/inventory').then(setInventory).catch(() => setInventory([]))
    api('/parents').then(setParents).catch(() => setParents([]))
  }

  useEffect(() => {
    loadData()
  }, [])

  const openAddSwimmer = () => {
    setEditingId(null)
    setMessage(null)
    setForm({ firstName: '', fatherName: '', familyName: '', parentId: parents[0]?.id ?? '', birthDate: '', gender: 'ذكر', level: 'مبتدئ' })
    setFormOpen(true)
  }

  const openEditSwimmer = (swimmer: Record<string, string | number>) => {
    setEditingId(String(swimmer.id))
    const nameParts = String(swimmer.full_name ?? '').split(' ')
    const parent = parents.find((item) => item.name === String(swimmer.parent_name))
    setForm({ firstName: nameParts[0] ?? '', fatherName: nameParts[1] ?? '', familyName: nameParts.slice(2).join(' '), parentId: parent?.id ?? '', birthDate: '', gender: 'ذكر', level: String(swimmer.level ?? 'مبتدئ') })
    setMessage(null)
    setFormOpen(true)
  }

  const deleteSwimmer = async (swimmer: Record<string, string | number>) => {
    if (!window.confirm(`هل تريد حذف ${swimmer.full_name}؟`)) return
    try {
      await api(`/swimmers/${String(swimmer.id)}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: 'تم حذف السباح' })
      loadData()
    } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر حذف السباح' }) }
  }

  const saveSwimmer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const result = await api(editingId ? `/swimmers/${editingId}` : '/swimmers', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setMessage({ type: 'success', text: editingId ? 'تم تعديل بيانات السباح' : `تم حفظ السباح بنجاح: ${result.id}` })
      setFormOpen(false)
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر حفظ البيانات' })
    } finally { setSaving(false) }
  }

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
          {message && <div className={`toast ${message.type}`}>{message.text}<button onClick={() => setMessage(null)}><X size={15} /></button></div>}
          <section className="page-heading"><div><p className="eyebrow">نظرة عامة على الأكاديمية</p><h1>{view === 'الرئيسية' ? 'صباح الخير، محمد' : view}</h1><p className="subheading">إليك ملخص الأداء والتشغيل في أكاديمية Back Orca اليوم.</p></div><button className="primary-button" onClick={openAddSwimmer}><Plus size={18} /> إضافة سبّاح</button></section>
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
          {view === 'السباحون' && <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>قاعدة بيانات السباحين</h2><p>كل سبّاح يُسجل مرة واحدة ويُستخدم في بقية النظام.</p></div><div className="panel-actions"><label className="search"><Search size={17} /><input placeholder="ابحث بالاسم أو الرقم" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="primary-button compact" onClick={openAddSwimmer}><Plus size={16} /> إضافة سبّاح</button></div></div><SwimmerTable swimmers={shownSwimmers} onEdit={openEditSwimmer} onDelete={deleteSwimmer} /></section>}
          {view === 'المخزون' && <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>المخزون</h2><p>الرصيد الحالي والتنبيهات حسب حد إعادة الطلب.</p></div><button className="primary-button"><Plus size={18} /> إضافة صنف</button></div><InventoryTable inventory={inventory} /></section>}
          {!['الرئيسية', 'السباحون', 'المخزون'].includes(view) && <section className="empty-state panel"><div className="empty-state-icon"><CalendarDays size={28} /></div><h2>وحدة {view}</h2><p>الواجهة جاهزة للربط مع الجداول التشغيلية في قاعدة البيانات.</p><button className="primary-button"><Plus size={18} /> إنشاء أول سجل</button></section>}
          {formOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}><form className="modal" onSubmit={saveSwimmer}><div className="modal-heading"><div><h2>إضافة سبّاح جديد</h2><p>أدخل البيانات الأساسية، ثم سيظهر السباح في كل الشاشات.</p></div><button type="button" className="modal-close" onClick={() => setFormOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>الاسم الأول<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label><label>اسم الأب<input value={form.fatherName} onChange={(event) => setForm({ ...form, fatherName: event.target.value })} /></label><label>اسم العائلة<input value={form.familyName} onChange={(event) => setForm({ ...form, familyName: event.target.value })} /></label><label>ولي الأمر<select required value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}><option value="">اختر ولي الأمر</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name} - {parent.phone}</option>)}</select></label><label>تاريخ الميلاد<input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label><label>النوع<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option>ذكر</option><option>أنثى</option></select></label><label>المستوى<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}><option>مبتدئ</option><option>متوسط</option><option>متقدم</option></select></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving || !parents.length}>{saving ? 'جار الحفظ...' : 'حفظ السباح'}</button>{!parents.length && <small>أضف ولي أمر أولًا من قاعدة البيانات.</small>}</div></form></div>}
        </div>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, trend, tone }: { icon: typeof Users; label: string; value: string | number; trend: string; tone: string }) { return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={21} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small className={tone === 'ink' ? 'neutral' : ''}>{trend}</small></div><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div></article> }
function SwimmerTable({ swimmers, onEdit, onDelete }: { swimmers: Array<Record<string, string | number>>; onEdit?: (swimmer: Record<string, string | number>) => void; onDelete?: (swimmer: Record<string, string | number>) => void }) { return <div className="table-scroll"><table><thead><tr><th>السبّاح</th><th>ولي الأمر</th><th>المجموعة</th><th>المدرب</th><th>المستوى</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{swimmers.map((swimmer) => <tr key={String(swimmer.id)}><td><div className="person"><div className="table-avatar">{String(swimmer.full_name ?? '').charAt(0)}</div><div><b>{swimmer.full_name}</b><span>{swimmer.swimmer_code}</span></div></div></td><td>{swimmer.parent_name}<small className="muted">{swimmer.parent_phone}</small></td><td>{swimmer.group_name}</td><td>{swimmer.coach_name}</td><td><span className="level">{swimmer.level}</span></td><td><span className="badge success">نشط</span></td><td>{onEdit && <button className="table-action" onClick={() => onEdit(swimmer)}>تعديل</button>}{onDelete && <button className="table-action danger" onClick={() => onDelete(swimmer)}>حذف</button>}</td></tr>)}</tbody></table>{swimmers.length === 0 && <div className="empty">لا توجد بيانات مطابقة</div>}</div> }
function InventoryTable({ inventory }: { inventory: Array<Record<string, string | number>> }) { return <div className="table-scroll"><table><thead><tr><th>الصنف</th><th>الفئة</th><th>الرصيد</th><th>تكلفة الوحدة</th><th>سعر البيع</th><th>الحالة</th></tr></thead><tbody>{inventory.map((item) => <tr key={String(item.id)}><td><div className="person"><div className="table-avatar box"><Package size={16} /></div><div><b>{item.name}</b><span>{item.sku}</span></div></div></td><td>{item.category}</td><td>{item.quantity}</td><td>{money(Number(item.average_cost))}</td><td>{money(Number(item.sale_price))}</td><td><span className={`badge ${item.stock_status === 'منخفض' ? 'warning' : 'success'}`}>{item.stock_status}</span></td></tr>)}</tbody></table></div> }

export default App
