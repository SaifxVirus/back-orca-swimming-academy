import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, Bell, Boxes, CalendarDays, ChevronLeft, CircleDollarSign, ClipboardCheck, LayoutDashboard, Menu, Package, Plus, Search, Settings, Users, WalletCards, X } from 'lucide-react'
import './App.css'

type Dashboard = { metrics: { swimmerCount: number; subscriptionCount: number; groupCount: number; coachCount: number; collected: number; outstanding: number; lowStock: number }; recentSwimmers: Array<Record<string, string | number>>; alerts: Array<Record<string, string | number>> }
type View = 'الرئيسية' | 'السباحون' | 'أولياء الأمور' | 'الاشتراكات' | 'الحضور' | 'المدفوعات' | 'المخزون'
type Parent = { id: string; name: string; phone: string; email?: string; swimmer_count?: number }
type Group = { id: string; name: string; capacity: number }
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
  const [subscriptions, setSubscriptions] = useState<Array<Record<string, string | number>>>([])
  const [sessions, setSessions] = useState<Array<Record<string, string | number>>>([])
  const [payments, setPayments] = useState<Array<Record<string, string | number>>>([])
  const [groups, setGroups] = useState<Group[]>([])
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
    api('/subscriptions').then(setSubscriptions).catch(() => setSubscriptions([]))
    api('/sessions').then(setSessions).catch(() => setSessions([]))
    api('/payments').then(setPayments).catch(() => setPayments([]))
    api('/groups').then(setGroups).catch(() => setGroups([]))
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
    { label: 'الرئيسية', icon: LayoutDashboard }, { label: 'السباحون', icon: Users }, { label: 'أولياء الأمور', icon: Users }, { label: 'الاشتراكات', icon: ClipboardCheck },
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
          {view === 'أولياء الأمور' && <ParentPage parents={parents} onSaved={loadData} />}
          {view === 'المخزون' && <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>المخزون</h2><p>الرصيد الحالي والتنبيهات حسب حد إعادة الطلب.</p></div><button className="primary-button"><Plus size={18} /> إضافة صنف</button></div><InventoryTable inventory={inventory} /></section>}
          {view === 'الاشتراكات' && <OperationsPage title="الاشتراكات" kind="subscriptions" rows={subscriptions} swimmers={swimmers} onSaved={loadData} />}
          {view === 'الحضور' && <AttendancePage sessions={sessions} groups={groups} onSaved={loadData} />}
          {view === 'المدفوعات' && <PaymentPage rows={payments} onSaved={loadData} />}
          {formOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}><form className="modal" onSubmit={saveSwimmer}><div className="modal-heading"><div><h2>إضافة سبّاح جديد</h2><p>أدخل البيانات الأساسية، ثم سيظهر السباح في كل الشاشات.</p></div><button type="button" className="modal-close" onClick={() => setFormOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>الاسم الأول<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label><label>اسم الأب<input value={form.fatherName} onChange={(event) => setForm({ ...form, fatherName: event.target.value })} /></label><label>اسم العائلة<input value={form.familyName} onChange={(event) => setForm({ ...form, familyName: event.target.value })} /></label><label>ولي الأمر<select required value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}><option value="">اختر ولي الأمر</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name} - {parent.phone}</option>)}</select></label><label>تاريخ الميلاد<input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label><label>النوع<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option>ذكر</option><option>أنثى</option></select></label><label>المستوى<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}><option>مبتدئ</option><option>متوسط</option><option>متقدم</option></select></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving || !parents.length}>{saving ? 'جار الحفظ...' : 'حفظ السباح'}</button>{!parents.length && <small>أضف ولي أمر أولًا من قاعدة البيانات.</small>}</div></form></div>}
        </div>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, trend, tone }: { icon: typeof Users; label: string; value: string | number; trend: string; tone: string }) { return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={21} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small className={tone === 'ink' ? 'neutral' : ''}>{trend}</small></div><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div></article> }
function SwimmerTable({ swimmers, onEdit, onDelete }: { swimmers: Array<Record<string, string | number>>; onEdit?: (swimmer: Record<string, string | number>) => void; onDelete?: (swimmer: Record<string, string | number>) => void }) { return <div className="table-scroll"><table><thead><tr><th>السبّاح</th><th>ولي الأمر</th><th>المجموعة</th><th>المدرب</th><th>المستوى</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{swimmers.map((swimmer) => <tr key={String(swimmer.id)}><td><div className="person"><div className="table-avatar">{String(swimmer.full_name ?? '').charAt(0)}</div><div><b>{swimmer.full_name}</b><span>{swimmer.swimmer_code}</span></div></div></td><td>{swimmer.parent_name}<small className="muted">{swimmer.parent_phone}</small></td><td>{swimmer.group_name}</td><td>{swimmer.coach_name}</td><td><span className="level">{swimmer.level}</span></td><td><span className="badge success">نشط</span></td><td>{onEdit && <button className="table-action" onClick={() => onEdit(swimmer)}>تعديل</button>}{onDelete && <button className="table-action danger" onClick={() => onDelete(swimmer)}>حذف</button>}</td></tr>)}</tbody></table>{swimmers.length === 0 && <div className="empty">لا توجد بيانات مطابقة</div>}</div> }
function InventoryTable({ inventory }: { inventory: Array<Record<string, string | number>> }) { return <div className="table-scroll"><table><thead><tr><th>الصنف</th><th>الفئة</th><th>الرصيد</th><th>تكلفة الوحدة</th><th>سعر البيع</th><th>الحالة</th></tr></thead><tbody>{inventory.map((item) => <tr key={String(item.id)}><td><div className="person"><div className="table-avatar box"><Package size={16} /></div><div><b>{item.name}</b><span>{item.sku}</span></div></div></td><td>{item.category}</td><td>{item.quantity}</td><td>{money(Number(item.average_cost))}</td><td>{money(Number(item.sale_price))}</td><td><span className={`badge ${item.stock_status === 'منخفض' ? 'warning' : 'success'}`}>{item.stock_status}</span></td></tr>)}</tbody></table></div> }

function AttendancePage({ sessions, groups, onSaved }: { sessions: Array<Record<string, string | number>>; groups: Group[]; onSaved: () => void }) {
  const [selectedSession, setSelectedSession] = useState('')
  const [roster, setRoster] = useState<Array<Record<string, string | number>>>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ groupId: '', sessionDate: '', startTime: '17:00', endTime: '18:00' })
  const [saving, setSaving] = useState(false)
  const loadRoster = async (sessionId: string) => { setSelectedSession(sessionId); if (!sessionId) return; setRoster(await api(`/sessions/${sessionId}/attendance`)) }
  const createSession = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await api('/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setOpen(false); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر إنشاء الجلسة') } finally { setSaving(false) } }
  const mark = async (row: Record<string, string | number>, status: string) => { if (!row.subscriptionId) return window.alert('لا يوجد اشتراك نشط لهذا السباح في تاريخ الجلسة'); await api(`/sessions/${selectedSession}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ swimmerId: row.id, subscriptionId: row.subscriptionId, status }) }); setRoster(roster.map((item) => item.id === row.id ? { ...item, status } : item)) }
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>الجلسات والحضور</h2><p>اختر جلسة لعرض سباحي المجموعة تلقائيًا وتسجيل حضورهم.</p></div><button type="button" className="primary-button compact" onClick={() => setOpen(true)}><Plus size={16} /> إنشاء جلسة</button></div><div className="attendance-toolbar"><label>الجلسة<select value={selectedSession} onChange={(event) => loadRoster(event.target.value)}><option value="">اختر الجلسة</option>{sessions.map((session) => <option key={String(session.id)} value={String(session.id)}>{session.code} - {session.group} - {session.date}</option>)}</select></label></div>{!selectedSession && <div className="attendance-empty"><CalendarDays size={26} /><b>اختر جلسة لعرض قائمة السباحين</b><span>يمكنك إنشاء جلسة جديدة من الزر أعلى الصفحة.</span><button type="button" className="primary-button compact" onClick={() => setOpen(true)}><Plus size={16} /> إنشاء جلسة جديدة</button></div>}{selectedSession && <div className="table-scroll"><table><thead><tr><th>السباح</th><th>الاشتراك</th><th>الحالة</th><th>تسجيل الحضور</th></tr></thead><tbody>{roster.map((row) => <tr key={String(row.id)}><td><b>{row.name}</b><small className="muted">{row.code}</small></td><td>{row.subscriptionId ? 'اشتراك نشط' : 'لا يوجد اشتراك'}</td><td><span className={`badge ${row.status === 'حاضر' ? 'success' : row.status === 'لم يسجل' ? 'warning' : 'neutral'}`}>{row.status}</span></td><td><button type="button" className="attendance-button present" onClick={() => mark(row, 'حاضر')}>حاضر</button><button type="button" className="attendance-button absent" onClick={() => mark(row, 'غائب')}>غائب</button><button type="button" className="attendance-button excused" onClick={() => mark(row, 'غياب بعذر')}>بعذر</button></td></tr>)}</tbody></table>{roster.length === 0 && <div className="empty">لا يوجد سباحون مسجلون في هذه المجموعة</div>}</div>}{open && <div className="modal-backdrop"><form className="modal" onSubmit={createSession}><div className="modal-heading"><div><h2>إنشاء جلسة</h2><p>بعد الحفظ ستظهر الجلسة في قائمة الاختيار.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>المجموعة<select required value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}><option value="">اختر المجموعة</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} - سعة {group.capacity}</option>)}</select></label><label>التاريخ<input required type="date" value={form.sessionDate} onChange={(event) => setForm({ ...form, sessionDate: event.target.value })} /></label><label>وقت البداية<input required type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label>وقت النهاية<input required type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ الجلسة'}</button></div></form></div>}</section>
}

function ParentPage({ parents, onSaved }: { parents: Parent[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true)
    try { await api('/parents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setOpen(false); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر الحفظ') } finally { setSaving(false) }
  }
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>قاعدة بيانات أولياء الأمور</h2><p>ولي الأمر الواحد يمكن أن يرتبط بعدة سباحين.</p></div><button className="primary-button compact" onClick={() => setOpen(true)}><Plus size={16} /> إضافة ولي أمر</button></div><div className="table-scroll"><table><thead><tr><th>الكود</th><th>الاسم</th><th>الهاتف</th><th>البريد الإلكتروني</th><th>عدد السباحين</th></tr></thead><tbody>{parents.map((parent) => <tr key={parent.id}><td>{parent.id}</td><td><b>{parent.name}</b></td><td>{parent.phone}</td><td>{parent.email || 'غير مضاف'}</td><td><span className="badge success">{parent.swimmer_count ?? 0} سباح</span></td></tr>)}</tbody></table>{parents.length === 0 && <div className="empty">لا توجد بيانات لأولياء الأمور</div>}</div>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><h2>إضافة ولي أمر</h2><p>سيظهر ولي الأمر مباشرة عند إضافة سباح.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>الاسم<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>الهاتف<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>البريد الإلكتروني<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>العنوان<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ ولي الأمر'}</button></div></form></div>}</section>
}

function PaymentPage({ rows, onSaved }: { rows: Array<Record<string, string | number>>; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Array<Record<string, string | number>>>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ swimmerId: '', subscriptionId: '', amount: '', method: 'نقدي', account: 'الخزينة', reference: '' })
  const loadOptions = () => api('/payment-options').then(setOptions).catch(() => setOptions([]))
  const openForm = () => { loadOptions(); setForm({ swimmerId: '', subscriptionId: '', amount: '', method: 'نقدي', account: 'الخزينة', reference: '' }); setOpen(true) }
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await api('/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setOpen(false); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر تسجيل الدفعة') } finally { setSaving(false) } }
  const chosen = options.find((option) => option.id === form.subscriptionId)
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>المدفوعات</h2><p>كل دفعة مرتبطة بسباح واشتراك وفاتورة وحساب مالي.</p></div><button className="primary-button compact" onClick={openForm}><Plus size={16} /> تسجيل دفعة</button></div><div className="table-scroll"><table><thead><tr><th>الكود</th><th>السبّاح</th><th>ولي الأمر</th><th>المبلغ</th><th>طريقة الدفع</th><th>الحساب</th><th>التاريخ</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}><td>{row.code}</td><td>{row.swimmer}</td><td>{row.parent}</td><td>{money(Number(row.amount))}</td><td>{row.method}</td><td>{row.account}</td><td>{String(row.date).slice(0, 10)}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty">لا توجد دفعات مسجلة</div>}</div>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><h2>تسجيل دفعة</h2><p>سيتم تحديث الفاتورة والاشتراك تلقائيًا.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>الاشتراك<select required value={form.subscriptionId} onChange={(event) => { const option = options.find((item) => item.id === event.target.value); setForm({ ...form, subscriptionId: event.target.value, swimmerId: String(option?.swimmerId ?? '') }) }}><option value="">اختر الاشتراك</option>{options.map((option) => <option key={String(option.id)} value={String(option.id)}>{option.swimmer} - {option.subscription} - متبقي {money(Number(option.remaining))}</option>)}</select></label><label>المبلغ<input required type="number" min="1" max={Number(chosen?.remaining ?? 0)} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label>طريقة الدفع<select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}><option>نقدي</option><option>بنك</option><option>بطاقة</option><option>محفظة إلكترونية</option></select></label><label>الحساب المالي<select value={form.account} onChange={(event) => setForm({ ...form, account: event.target.value })}><option>الخزينة</option><option>البنك</option><option>المحفظة الإلكترونية</option></select></label><label>رقم المرجع<input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving || !options.length}>{saving ? 'جار الحفظ...' : 'حفظ الدفعة'}</button>{!options.length && <small>لا توجد فواتير بها متبقي.</small>}</div></form></div>}</section>
}

function OperationsPage({ title, kind, rows, swimmers, onSaved }: { title: string; kind: 'subscriptions' | 'sessions' | 'payments'; rows: Array<Record<string, string | number>>; swimmers: Array<Record<string, string | number>>; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ swimmerId: '', packageName: 'اشتراك شهري', sessionsTotal: '12', startDate: '', endDate: '', price: '0', discount: '0' })
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true)
    try { await api('/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setOpen(false); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر الحفظ') } finally { setSaving(false) }
  }
  const headers = kind === 'subscriptions' ? ['الكود', 'السبّاح', 'الباقة', 'الحصص', 'المدة', 'السعر', 'المتبقي', 'الحالة'] : kind === 'sessions' ? ['الكود', 'المجموعة', 'التاريخ', 'الوقت', 'الحالة'] : ['الكود', 'السبّاح', 'ولي الأمر', 'المبلغ', 'طريقة الدفع', 'الحساب', 'التاريخ']
  const fields = kind === 'subscriptions' ? ['code', 'swimmer', 'package', 'sessions', 'startDate', 'price', 'remaining', 'status'] : kind === 'sessions' ? ['code', 'group', 'date', 'startTime', 'status'] : ['code', 'swimmer', 'parent', 'amount', 'method', 'account', 'date']
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>{title}</h2><p>بيانات حقيقية محفوظة في MongoDB.</p></div>{kind === 'subscriptions' && <button className="primary-button compact" onClick={() => setOpen(true)}><Plus size={16} /> إضافة اشتراك</button>}</div><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}>{fields.map((field) => <td key={field}>{field === 'price' || field === 'remaining' || field === 'amount' ? money(Number(row[field])) : row[field]}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <div className="empty">لا توجد سجلات بعد</div>}</div>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><h2>إضافة اشتراك</h2><p>سيتم إنشاء الفاتورة تلقائيًا مع الاشتراك.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>السبّاح<select required value={form.swimmerId} onChange={(event) => setForm({ ...form, swimmerId: event.target.value })}><option value="">اختر السباح</option>{swimmers.map((swimmer) => <option key={String(swimmer.id)} value={String(swimmer.id)}>{swimmer.full_name}</option>)}</select></label><label>الباقة<input required value={form.packageName} onChange={(event) => setForm({ ...form, packageName: event.target.value })} /></label><label>عدد الحصص<input required type="number" min="1" value={form.sessionsTotal} onChange={(event) => setForm({ ...form, sessionsTotal: event.target.value })} /></label><label>السعر<input required type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>الخصم<input type="number" min="0" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} /></label><label>تاريخ البداية<input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>تاريخ النهاية<input required type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ الاشتراك'}</button></div></form></div>}</section>
}

export default App
