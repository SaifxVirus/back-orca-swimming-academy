import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, Bell, Boxes, CalendarDays, ChevronLeft, CircleDollarSign, ClipboardCheck, Fish, LayoutDashboard, Menu, Package, Plus, Search, Settings, Users, WalletCards, X } from 'lucide-react'
import './App.css'

type Dashboard = { metrics: { swimmerCount: number; subscriptionCount: number; groupCount: number; coachCount: number; collected: number; outstanding: number; lowStock: number }; recentSwimmers: Array<Record<string, string | number>>; alerts: Array<Record<string, string | number>> }
type View = 'الرئيسية' | 'السباحون' | 'أولياء الأمور' | 'الاشتراكات' | 'الحضور' | 'المدفوعات' | 'المخزون' | 'الإعدادات'
type Parent = { id: string; name: string; phone: string; email?: string; swimmer_count?: number }
type Group = { id: string; name: string; capacity: number }
type SwimmerForm = { firstName: string; fatherName: string; familyName: string; parentId: string; birthDate: string; gender: string; level: string }

const arabicEnglishPairs: Array<[string, string]> = [
  ['مركز الإعدادات', 'Settings center'], ['إعدادات الأكاديمية والتنبيهات والمخزون.', 'Academy, alerts, and inventory settings.'], ['اسم الأكاديمية', 'Academy name'], ['جنيه مصري', 'Egyptian Pound'], ['دولار أمريكي', 'US Dollar'], ['التنبيه قبل انتهاء الاشتراك بأيام', 'Subscription expiry alert days'], ['قاعدة العمولة', 'Commission rule'], ['السماح بالمخزون السالب', 'Allow negative stock'], ['حفظ الإعدادات', 'Save settings'], ['إضافة حساب مساعد', 'Add staff account'], ['الملف الشخصي', 'Profile'], ['الاسم الأول', 'First name'], ['اسم الأب', 'Father name'], ['اسم العائلة', 'Family name'], ['ولي الأمر', 'Parent'], ['اختر ولي الأمر', 'Choose parent'], ['تاريخ الميلاد', 'Birth date'], ['النوع', 'Gender'], ['ذكر', 'Male'], ['أنثى', 'Female'], ['المستوى', 'Level'], ['مبتدئ', 'Beginner'], ['متوسط', 'Intermediate'], ['متقدم', 'Advanced'], ['حفظ السباح', 'Save swimmer'], ['إضافة سبّاح', 'Add swimmer'], ['تعديل بيانات السباح', 'Edit swimmer'], ['حذف', 'Delete'], ['تعديل', 'Edit'], ['إلغاء', 'Cancel'], ['حفظ', 'Save'], ['جار الحفظ...', 'Saving...'], ['قاعدة بيانات السباحين', 'Swimmer database'], ['قاعدة بيانات أولياء الأمور', 'Parents database'], ['ولي الأمر الواحد يمكن أن يرتبط بعدة سباحين.', 'One parent can be linked to multiple swimmers.'], ['إضافة ولي أمر', 'Add parent'], ['عدد السباحين', 'Swimmer count'], ['غير مضاف', 'Not added'], ['الاشتراكات', 'Subscriptions'], ['إضافة اشتراك', 'Add subscription'], ['الباقة', 'Package'], ['عدد الحصص', 'Sessions count'], ['السعر', 'Price'], ['الخصم', 'Discount'], ['تاريخ البداية', 'Start date'], ['تاريخ النهاية', 'End date'], ['حفظ الاشتراك', 'Save subscription'], ['الجلسات والحضور', 'Sessions and attendance'], ['اختر الجلسة', 'Choose session'], ['إنشاء جلسة', 'Create session'], ['إنشاء جلسة جديدة', 'Create new session'], ['حاضر', 'Present'], ['غائب', 'Absent'], ['غياب بعذر', 'Excused absence'], ['لم يسجل', 'Not recorded'], ['تسجيل الحضور', 'Record attendance'], ['المدفوعات', 'Payments'], ['تسجيل دفعة', 'Record payment'], ['تحصيل اشتراك', 'Subscription collection'], ['بيع مخزون', 'Inventory sale'], ['اختر صنفًا', 'Choose item'], ['الكمية', 'Quantity'], ['إضافة الصنف', 'Add item'], ['الإجمالي', 'Total'], ['طريقة الدفع', 'Payment method'], ['الحساب المالي', 'Financial account'], ['نقدي', 'Cash'], ['بنك', 'Bank'], ['بطاقة', 'Card'], ['محفظة إلكترونية', 'E-wallet'], ['الخزينة', 'Cashbox'], ['المحفظة الإلكترونية', 'E-wallet'], ['رقم المرجع', 'Reference number'], ['حفظ الدفعة', 'Save payment'], ['المخزون', 'Inventory'], ['إضافة صنف', 'Add item'], ['تعديل الصنف', 'Edit item'], ['إضافة صنف', 'Add item'], ['كود الصنف', 'Item code'], ['اسم الصنف', 'Item name'], ['الفئة', 'Category'], ['الرصيد', 'Quantity on hand'], ['تكلفة الوحدة', 'Unit cost'], ['سعر البيع', 'Sale price'], ['حد إعادة الطلب', 'Reorder level'], ['حفظ الصنف', 'Save item'], ['جيد', 'Good'], ['منخفض', 'Low'], ['الإعدادات', 'Settings'], ['تسجيل الخروج', 'Log out'], ['لا توجد سجلات بعد', 'No records yet'], ['لا توجد دفعات مسجلة', 'No payments recorded'], ['لا توجد أصناف', 'No inventory items'], ['لا توجد بيانات مطابقة', 'No matching data'], ['لا توجد تنبيهات عاجلة', 'No urgent alerts'], ['مستخدم النظام', 'System user'], ['اشتراك نشط', 'Active subscription'], ['لا يوجد اشتراك', 'No active subscription'], ['حسابات أولياء الأمور', 'Parent accounts']
]

function translateArabicDom() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  nodes.forEach((node) => { if (node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE') return; let value = node.nodeValue ?? ''; arabicEnglishPairs.forEach(([arabic, english]) => { value = value.split(arabic).join(english) }); if (value !== node.nodeValue) node.nodeValue = value })
  document.querySelectorAll<HTMLElement>('[placeholder]').forEach((element) => { let value = element.getAttribute('placeholder') ?? ''; arabicEnglishPairs.forEach(([arabic, english]) => { value = value.split(arabic).join(english) }); if (value !== element.getAttribute('placeholder')) element.setAttribute('placeholder', value) })
}

const money = (value: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)
const displayUserName = (value: string) => {
  if (!/[ÙØÃ]/.test(value)) return value
  try { return decodeURIComponent(escape(value)) } catch { return value }
}
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''
const api = (path: string, options: RequestInit = {}) => fetch(`${API_BASE}/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}), ...(localStorage.getItem('back_orca_token') ? { Authorization: `Bearer ${localStorage.getItem('back_orca_token')}` } : {}) } }).then(async (response) => {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'حدث خطأ أثناء تنفيذ العملية')
  return data
})

function DashboardApp({ onLogout, userName, language, onProfileSaved, theme, onToggleTheme }: { onLogout: () => void; userName: string; language: 'ar' | 'en'; onProfileSaved: (name: string, nextLanguage: 'ar' | 'en', token: string) => void; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
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
  const [profileOpen, setProfileOpen] = useState(false)
  const [parentFormOpen, setParentFormOpen] = useState(false)
  const [parentSaving, setParentSaving] = useState(false)
  const [parentForm, setParentForm] = useState({ name: '', phone: '', email: '' })
  const [form, setForm] = useState<SwimmerForm>({ firstName: '', fatherName: '', familyName: '', parentId: '', birthDate: '', gender: 'ذكر', level: 'مبتدئ' })
  const [now, setNow] = useState(() => new Date())

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (language !== 'en') return
    translateArabicDom()
    const observer = new MutationObserver(() => translateArabicDom())
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [language])

  const openAddSwimmer = () => {
    setEditingId(null)
    setMessage(null)
    setForm({ firstName: '', fatherName: '', familyName: '', parentId: parents[0]?.id ?? '', birthDate: '', gender: 'ذكر', level: 'مبتدئ' })
    setParentFormOpen(false)
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

  const saveParentFromSwimmer = async () => {
    if (!parentForm.name.trim() || !parentForm.phone.trim()) return
    setParentSaving(true)
    try {
      const result = await api('/parents', { method: 'POST', body: JSON.stringify(parentForm) })
      setParents((current) => [{ id: String(result.id), name: parentForm.name, phone: parentForm.phone, email: parentForm.email }, ...current])
      setForm((current) => ({ ...current, parentId: String(result.id) }))
      setParentForm({ name: '', phone: '', email: '' })
      setParentFormOpen(false)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'تعذر إضافة ولي الأمر')
    } finally { setParentSaving(false) }
  }

  const nav = [
    { label: 'الرئيسية', icon: LayoutDashboard }, { label: 'السباحون', icon: Users }, { label: 'أولياء الأمور', icon: Users }, { label: 'الاشتراكات', icon: ClipboardCheck },
    { label: 'الحضور', icon: CalendarDays }, { label: 'المدفوعات', icon: CircleDollarSign }, { label: 'المخزون', icon: Boxes },
  ] as const
  const en = language === 'en'
  const viewLabels: Record<View, string> = { الرئيسية: 'Dashboard', السباحون: 'Swimmers', 'أولياء الأمور': 'Parents', الاشتراكات: 'Subscriptions', الحضور: 'Attendance', المدفوعات: 'Payments', المخزون: 'Inventory', الإعدادات: 'Settings' }
  const navLabels: Record<string, string> = { الرئيسية: 'Dashboard', السباحون: 'Swimmers', 'أولياء الأمور': 'Parents', الاشتراكات: 'Subscriptions', الحضور: 'Attendance', المدفوعات: 'Payments', المخزون: 'Inventory' }
  const shownSwimmers = swimmers.filter((swimmer) => String(swimmer.full_name).includes(search) || String(swimmer.swimmer_code).includes(search))

  return (
    <div className="app-shell" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Fish size={18} /></div><div><strong>Black Orca</strong><span>أكاديمية السباحة</span></div><button type="button" className="close-menu" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
        <div className="workspace"><span className="status-dot" /> النظام يعمل بشكل طبيعي</div>
        <nav>{nav.map(({ label, icon: Icon }) => <button type="button" key={label} className={view === label ? 'active' : ''} onClick={() => { setView(label); setMenuOpen(false) }}><Icon size={19} /><span>{en ? navLabels[label] : label}</span>{label === 'الرئيسية' && <span className="nav-arrow"><ChevronLeft size={15} /></span>}</button>)}</nav>
        <div className="sidebar-bottom"><button type="button" onClick={() => { setView('الإعدادات'); setMenuOpen(false) }}><Settings size={18} /> {en ? 'Settings' : 'الإعدادات'}</button><button type="button" className="logout-button" onClick={onLogout}>{en ? 'Log out' : 'تسجيل الخروج'}</button><button type="button" className="user-card" onClick={() => { setProfileOpen(true); setMenuOpen(false) }}><div className="avatar">{userName.charAt(0).toUpperCase()}</div><div><b>{userName}</b><span>{en ? 'Profile' : 'الملف الشخصي'}</span></div><ChevronLeft size={15} /></button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button type="button" className="menu-toggle" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div className="breadcrumb"><span>{en ? 'Academy' : 'الأكاديمية'}</span><ChevronLeft size={15} /><b>{en ? viewLabels[view] : view}</b></div><div className="top-actions"><button type="button" className="icon-button theme-toggle" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button><button type="button" className="icon-button notification"><Bell size={20} /><i /></button><div className="date-label">{new Intl.DateTimeFormat(en ? 'en-US' : 'ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)}<strong>{new Intl.DateTimeFormat(en ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' }).format(now)}</strong></div></div></header>
        <div className="page-wrap">
          {message && <div className={`toast ${message.type}`}>{message.text}<button onClick={() => setMessage(null)}><X size={15} /></button></div>}
          <section className="page-heading"><div><p className="eyebrow">{en ? 'Academy overview' : 'نظرة عامة على الأكاديمية'}</p><h1>{view === 'الرئيسية' ? (en ? `Good morning, ${userName}` : `صباح الخير، ${userName}`) : viewLabels[view]}</h1><p className="subheading">{en ? 'Your academy performance and operations at a glance.' : 'إليك ملخص الأداء والتشغيل في أكاديمية Black Orca اليوم.'}</p></div></section>
          {view === 'الرئيسية' && <>
            <section className="metric-grid">
              <Metric icon={Users} label={en ? 'Active swimmers' : 'السباحون النشطون'} value={dashboard?.metrics.swimmerCount ?? 0} trend="+12%" tone="teal" />
              <Metric icon={ClipboardCheck} label={en ? 'Active subscriptions' : 'الاشتراكات النشطة'} value={dashboard?.metrics.subscriptionCount ?? 0} trend="+8%" tone="coral" />
              <Metric icon={WalletCards} label={en ? "Today's collection" : 'تحصيل اليوم'} value={money(dashboard?.metrics.collected ?? 0)} trend="+18%" tone="gold" />
              <Metric icon={Activity} label={en ? 'Outstanding' : 'المتأخرات'} value={money(dashboard?.metrics.outstanding ?? 0)} trend={en ? 'Needs attention' : 'تحتاج متابعة'} tone="ink" />
            </section>
            <div className="content-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>{en ? 'Academy activity' : 'نشاط الأكاديمية'}</h2><p>{en ? 'Attendance and collection this month' : 'الحضور والتحصيل خلال هذا الشهر'}</p></div><select defaultValue={en ? 'This month' : 'هذا الشهر'}><option>{en ? 'This month' : 'هذا الشهر'}</option><option>{en ? 'This week' : 'هذا الأسبوع'}</option></select></div><div className="chart"><div className="chart-y"><span>١٠٠</span><span>٧٥</span><span>٥٠</span><span>٢٥</span><span>٠</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 180" preserveAspectRatio="none"><path className="line-fill" d="M0 140 C40 130, 65 100, 110 115 S170 155, 210 100 S270 90, 305 110 S350 70, 390 85 S430 120, 470 68 S530 92, 570 45 S625 70, 700 25 L700 180 L0 180 Z" /><path className="line" d="M0 140 C40 130, 65 100, 110 115 S170 155, 210 100 S270 90, 305 110 S350 70, 390 85 S430 120, 470 68 S530 92, 570 45 S625 70, 700 25" /></svg><div className="chart-labels"><span>Sep 1</span><span>Sep 7</span><span>Sep 14</span><span>Sep 21</span><span>Sep 30</span></div></div></div><div className="legend"><span><i className="teal-dot" /> {en ? 'Collections' : 'التحصيل'}</span><span><i className="coral-dot" /> {en ? 'Attendance' : 'الحضور'}</span></div></section><section className="panel alerts-panel"><div className="panel-heading"><div><h2>{en ? 'Important alerts' : 'تنبيهات مهمة'}</h2><p>{en ? 'Needs your attention' : 'تحتاج إلى انتباهك'}</p></div><button className="text-button">{en ? 'View all' : 'عرض الكل'}</button></div>{dashboard?.alerts.length ? dashboard.alerts.slice(0, 4).map((alert) => <div className="alert-row" key={String(alert.id)}><div className="alert-icon"><Bell size={16} /></div><div><b>{en ? `Subscription: ${alert.swimmer_name}` : `اشتراك ${alert.swimmer_name}`}</b><span>{en ? `Ends ${alert.end_date}` : `ينتهي في ${alert.end_date}`}</span></div><ChevronLeft size={16} /></div>) : <div className="empty">{en ? 'No urgent alerts' : 'لا توجد تنبيهات عاجلة'}</div>}{(dashboard?.metrics.lowStock ?? 0) > 0 && <div className="alert-row"><div className="alert-icon orange"><Package size={16} /></div><div><b>{en ? 'Low stock' : 'مخزون منخفض'}</b><span>{en ? `${dashboard?.metrics.lowStock} items need reordering` : `${dashboard?.metrics.lowStock} أصناف تحتاج إعادة طلب`}</span></div><ChevronLeft size={16} /></div>}</section></div>
            <section className="panel table-panel"><div className="panel-heading"><div><h2>{en ? 'Recently registered swimmers' : 'آخر السباحين المسجلين'}</h2><p>{en ? 'Live data from the database' : 'بيانات محدثة لحظيًا من قاعدة البيانات'}</p></div><button className="text-button" onClick={() => setView('السباحون')}>{en ? 'View all swimmers' : 'عرض جميع السباحين'} <ChevronLeft size={15} /></button></div><SwimmerTable swimmers={dashboard?.recentSwimmers ?? []} language={language} /></section>
          </>}
          {view === 'السباحون' && <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>قاعدة بيانات السباحين</h2><p>كل سبّاح يُسجل مرة واحدة ويُستخدم في بقية النظام.</p></div><div className="panel-actions"><label className="search"><Search size={17} /><input placeholder="ابحث بالاسم أو الرقم" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="primary-button compact" onClick={openAddSwimmer}><Plus size={16} /> إضافة سبّاح</button></div></div><SwimmerTable swimmers={shownSwimmers} onEdit={openEditSwimmer} onDelete={deleteSwimmer} /></section>}
          {view === 'أولياء الأمور' && <ParentPage parents={parents} onSaved={loadData} />}
          {view === 'المخزون' && <InventoryPage inventory={inventory} onSaved={loadData} />}
          {view === 'الاشتراكات' && <OperationsPage title="الاشتراكات" kind="subscriptions" rows={subscriptions} swimmers={swimmers} onSaved={loadData} />}
          {view === 'الحضور' && <AttendancePage sessions={sessions} groups={groups} onSaved={loadData} />}
          {view === 'المدفوعات' && <PaymentPage rows={payments} inventory={inventory} onSaved={loadData} />}
          {view === 'الإعدادات' && <SettingsPage />}
          {profileOpen && <ProfileModal language={language} onClose={() => setProfileOpen(false)} onSaved={onProfileSaved} />}
          {formOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}>
            <form className="modal" onSubmit={saveSwimmer}>
              <div className="modal-heading"><div><h2>إضافة سبّاح جديد</h2><p>أدخل البيانات الأساسية، ثم سيظهر السباح في كل الشاشات.</p></div><button type="button" className="modal-close" onClick={() => setFormOpen(false)}><X size={18} /></button></div>
              <div className="form-grid">
                <label>الاسم الأول<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
                <label>اسم الأب<input value={form.fatherName} onChange={(event) => setForm({ ...form, fatherName: event.target.value })} /></label>
                <label>اسم العائلة<input value={form.familyName} onChange={(event) => setForm({ ...form, familyName: event.target.value })} /></label>
                <div className="parent-picker"><label>ولي الأمر<select required value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}><option value="">اختر ولي الأمر</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name} - {parent.phone}</option>)}</select></label><button type="button" className="secondary-button compact" onClick={() => setParentFormOpen((current) => !current)}>إضافة ولي أمر</button></div>
                {parentFormOpen && <div className="inline-parent-form"><label>اسم ولي الأمر<input required value={parentForm.name} onChange={(event) => setParentForm({ ...parentForm, name: event.target.value })} /></label><label>الهاتف<input required value={parentForm.phone} onChange={(event) => setParentForm({ ...parentForm, phone: event.target.value })} /></label><label>البريد الإلكتروني<input type="email" value={parentForm.email} onChange={(event) => setParentForm({ ...parentForm, email: event.target.value })} /></label><button type="button" className="primary-button compact" disabled={parentSaving} onClick={saveParentFromSwimmer}>{parentSaving ? 'جار الحفظ...' : 'حفظ ولي الأمر'}</button></div>}
                <label>تاريخ الميلاد<input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label>
                <label>النوع<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option>ذكر</option><option>أنثى</option></select></label>
                <label>المستوى<select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}><option>مبتدئ</option><option>متوسط</option><option>متقدم</option></select></label>
              </div>
              <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving || !parents.length}>{saving ? 'جار الحفظ...' : 'حفظ السباح'}</button>{!parents.length && <small>أضف ولي أمر أولًا من قاعدة البيانات.</small>}</div>
            </form>
          </div>}
        </div>
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, trend, tone }: { icon: typeof Users; label: string; value: string | number; trend: string; tone: string }) { return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={21} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small className={tone === 'ink' ? 'neutral' : ''}>{trend}</small></div><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div></article> }
function SwimmerTable({ swimmers, language = 'ar', onEdit, onDelete }: { swimmers: Array<Record<string, string | number>>; language?: 'ar' | 'en'; onEdit?: (swimmer: Record<string, string | number>) => void; onDelete?: (swimmer: Record<string, string | number>) => void }) { const en = language === 'en'; return <div className="table-scroll"><table><thead><tr><th>{en ? 'Swimmer' : 'السبّاح'}</th><th>{en ? 'Parent' : 'ولي الأمر'}</th><th>{en ? 'Group' : 'المجموعة'}</th><th>{en ? 'Coach' : 'المدرب'}</th><th>{en ? 'Level' : 'المستوى'}</th><th>{en ? 'Status' : 'الحالة'}</th><th>{en ? 'Actions' : 'إجراءات'}</th></tr></thead><tbody>{swimmers.map((swimmer) => <tr key={String(swimmer.id)}><td><div className="person"><div className="table-avatar">{String(swimmer.full_name ?? '').charAt(0)}</div><div><b>{swimmer.full_name}</b><span>{swimmer.swimmer_code}</span></div></div></td><td>{swimmer.parent_name}<small className="muted">{swimmer.parent_phone}</small></td><td>{swimmer.group_name}</td><td>{swimmer.coach_name}</td><td><span className="level">{swimmer.level}</span></td><td><span className="badge success">{en ? 'Active' : 'نشط'}</span></td><td>{onEdit && <button className="table-action" onClick={() => onEdit(swimmer)}>{en ? 'Edit' : 'تعديل'}</button>}{onDelete && <button className="table-action danger" onClick={() => onDelete(swimmer)}>{en ? 'Delete' : 'حذف'}</button>}</td></tr>)}</tbody></table>{swimmers.length === 0 && <div className="empty">{en ? 'No matching records' : 'لا توجد بيانات مطابقة'}</div>}</div> }
function InventoryPage({ inventory, onSaved }: { inventory: Array<Record<string, string | number>>; onSaved: () => void }) {
  const blank = { sku: '', name: '', category: 'معدات', quantity: '0', averageCost: '0', salePrice: '0', minQuantity: '0' }
  const [open, setOpen] = useState(false); const [editingId, setEditingId] = useState<string | null>(null); const [form, setForm] = useState(blank); const [saving, setSaving] = useState(false)
  const startAdd = () => { setEditingId(null); setForm(blank); setOpen(true) }
  const startEdit = (item: Record<string, string | number>) => { setEditingId(String(item.id)); setForm({ sku: String(item.sku), name: String(item.name), category: String(item.category ?? ''), quantity: String(item.quantity), averageCost: String(item.average_cost), salePrice: String(item.sale_price), minQuantity: String(item.min_quantity) }); setOpen(true) }
  const remove = async (item: Record<string, string | number>) => { if (!window.confirm(`هل تريد حذف ${item.name}؟`)) return; try { await api(`/inventory/${item.id}`, { method: 'DELETE' }); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر حذف الصنف') } }
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await api(editingId ? `/inventory/${editingId}` : '/inventory', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setOpen(false); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر حفظ الصنف') } finally { setSaving(false) } }
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>المخزون</h2><p>إدارة الأصناف والكميات والتكاليف وحدود إعادة الطلب.</p></div><button className="primary-button compact" onClick={startAdd}><Plus size={16} /> إضافة صنف</button></div><div className="table-scroll"><table><thead><tr><th>الصنف</th><th>الفئة</th><th>الرصيد</th><th>تكلفة الوحدة</th><th>سعر البيع</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{inventory.map((item) => <tr key={String(item.id)}><td><div className="person"><div className="table-avatar box"><Package size={16} /></div><div><b>{item.name}</b><span>{item.sku}</span></div></div></td><td>{item.category}</td><td>{item.quantity}</td><td>{money(Number(item.average_cost))}</td><td>{money(Number(item.sale_price))}</td><td><span className={`badge ${item.stock_status === 'منخفض' ? 'warning' : 'success'}`}>{item.stock_status}</span></td><td><button className="table-action" onClick={() => startEdit(item)}>تعديل</button><button className="table-action danger" onClick={() => remove(item)}>حذف</button></td></tr>)}</tbody></table>{inventory.length === 0 && <div className="empty">لا توجد أصناف</div>}</div>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><h2>{editingId ? 'تعديل الصنف' : 'إضافة صنف'}</h2><p>تحديث الكمية هنا يغيّر الرصيد الحالي مباشرة.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>كود الصنف<input required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label><label>اسم الصنف<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>الفئة<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>الرصيد<input required type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label>تكلفة الوحدة<input required type="number" min="0" value={form.averageCost} onChange={(event) => setForm({ ...form, averageCost: event.target.value })} /></label><label>سعر البيع<input required type="number" min="0" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} /></label><label>حد إعادة الطلب<input required type="number" min="0" value={form.minQuantity} onChange={(event) => setForm({ ...form, minQuantity: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ الصنف'}</button></div></form></div>}</section>
}

function AttendancePage({ sessions, groups, onSaved }: { sessions: Array<Record<string, string | number>>; groups: Group[]; onSaved: () => void }) {
  const [selectedSession, setSelectedSession] = useState('')
  const [roster, setRoster] = useState<Array<Record<string, string | number>>>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ groupId: '', sessionDate: '', startTime: '17:00', endTime: '18:00' })
  const [saving, setSaving] = useState(false)
  const openCreate = () => { setForm({ groupId: groups[0]?.id ?? '', sessionDate: new Date().toISOString().slice(0, 10), startTime: '17:00', endTime: '18:00' }); setOpen(true) }
  const loadRoster = async (sessionId: string) => { setSelectedSession(sessionId); if (!sessionId) return; setRoster(await api(`/sessions/${sessionId}/attendance`)) }
  const createSession = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await api('/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setOpen(false); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر إنشاء الجلسة') } finally { setSaving(false) } }
  const mark = async (row: Record<string, string | number>, status: string) => { if (!row.subscriptionId) return window.alert('لا يوجد اشتراك نشط لهذا السباح في تاريخ الجلسة'); await api(`/sessions/${selectedSession}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ swimmerId: row.id, subscriptionId: row.subscriptionId, status }) }); setRoster(roster.map((item) => item.id === row.id ? { ...item, status } : item)) }
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>الجلسات والحضور</h2><p>اختر جلسة لعرض سباحي المجموعة تلقائيًا وتسجيل حضورهم.</p></div><button type="button" className="primary-button compact" onClick={openCreate}><Plus size={16} /> إنشاء جلسة</button></div><div className="attendance-toolbar"><label>الجلسة<select value={selectedSession} onChange={(event) => loadRoster(event.target.value)}><option value="">اختر الجلسة</option>{sessions.map((session) => <option key={String(session.id)} value={String(session.id)}>{session.code} - {session.group} - {session.date}</option>)}</select></label></div>{!selectedSession && <div className="attendance-empty"><CalendarDays size={26} /><b>اختر جلسة لعرض قائمة السباحين</b><span>يمكنك إنشاء جلسة جديدة من إعدادات الجلسة داخل النظام.</span></div>}{selectedSession && <div className="table-scroll"><table><thead><tr><th>السباح</th><th>الاشتراك</th><th>الحالة</th><th>تسجيل الحضور</th></tr></thead><tbody>{roster.map((row) => <tr key={String(row.id)}><td><b>{row.name}</b><small className="muted">{row.code}</small></td><td>{row.subscriptionId ? 'اشتراك نشط' : 'لا يوجد اشتراك'}</td><td><span className={`badge ${row.status === 'حاضر' ? 'success' : row.status === 'لم يسجل' ? 'warning' : 'neutral'}`}>{row.status}</span></td><td><button type="button" className="attendance-button present" onClick={() => mark(row, 'حاضر')}>حاضر</button><button type="button" className="attendance-button absent" onClick={() => mark(row, 'غائب')}>غائب</button><button type="button" className="attendance-button excused" onClick={() => mark(row, 'غياب بعذر')}>بعذر</button></td></tr>)}</tbody></table>{roster.length === 0 && <div className="empty">لا يوجد سباحون مسجلون في هذه المجموعة</div>}</div>}{open && <div className="modal-backdrop"><form className="modal" onSubmit={createSession}><div className="modal-heading"><div><h2>إنشاء جلسة</h2><p>بعد الحفظ ستظهر الجلسة في قائمة الاختيار.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>المجموعة<select required value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}><option value="">اختر المجموعة</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} - سعة {group.capacity}</option>)}</select></label><label>التاريخ<input required type="date" value={form.sessionDate} onChange={(event) => setForm({ ...form, sessionDate: event.target.value })} /></label><label>وقت البداية<input required type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label>وقت النهاية<input required type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ الجلسة'}</button></div></form></div>}</section>
}

function ParentPage({ parents, onSaved }: { parents: Parent[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const openCreate = () => { setForm({ name: '', phone: '', email: '', address: '', notes: '' }); setOpen(true) }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true)
    try { await api('/parents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setOpen(false); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر الحفظ') } finally { setSaving(false) }
  }
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>قاعدة بيانات أولياء الأمور</h2><p>ولي الأمر الواحد يمكن أن يرتبط بعدة سباحين.</p></div><button type="button" className="primary-button compact" onClick={openCreate}><Plus size={16} /> إضافة ولي أمر</button></div><div className="table-scroll"><table><thead><tr><th>الكود</th><th>الاسم</th><th>الهاتف</th><th>البريد الإلكتروني</th><th>عدد السباحين</th></tr></thead><tbody>{parents.map((parent) => <tr key={parent.id}><td>{parent.id}</td><td><b>{parent.name}</b></td><td>{parent.phone}</td><td>{parent.email || 'غير مضاف'}</td><td><span className="badge success">{parent.swimmer_count ?? 0} سباح</span></td></tr>)}</tbody></table>{parents.length === 0 && <div className="empty">لا توجد بيانات لأولياء الأمور</div>}</div>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><h2>إضافة ولي أمر</h2><p>سيظهر ولي الأمر مباشرة عند إضافة سباح.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>الاسم<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>الهاتف<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>البريد الإلكتروني<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>العنوان<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ ولي الأمر'}</button></div></form></div>}</section>
}

function PaymentPage({ rows, inventory, onSaved }: { rows: Array<Record<string, string | number>>; inventory: Array<Record<string, string | number>>; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Array<Record<string, string | number>>>([])
  const [saving, setSaving] = useState(false)
  const [saleMode, setSaleMode] = useState(false)
  const [saleItemId, setSaleItemId] = useState('')
  const [saleQuantity, setSaleQuantity] = useState('1')
  const [saleItems, setSaleItems] = useState<Array<{ itemId: string; name: string; quantity: number; unitPrice: number }>>([])
  const [form, setForm] = useState({ swimmerId: '', subscriptionId: '', amount: '', method: 'نقدي', account: 'الخزينة', reference: '' })
  const loadOptions = () => api('/payment-options').then(setOptions).catch(() => setOptions([]))
  useEffect(() => { loadOptions() }, [])
  const addSaleItem = () => { const item = inventory.find((entry) => String(entry.id) === saleItemId); if (!item) return; const quantity = Number(saleQuantity); if (quantity < 1 || quantity > Number(item.quantity)) return window.alert('الكمية غير متاحة في المخزون'); setSaleItems([...saleItems, { itemId: String(item.id), name: String(item.name), quantity, unitPrice: Number(item.sale_price) }]); setSaleItemId(''); setSaleQuantity('1') }
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await api('/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: saleMode ? saleTotal : form.amount, items: saleMode ? saleItems : [] }) }); setOpen(false); onSaved() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر تسجيل الدفعة') } finally { setSaving(false) } }
  const chosen = options.find((option) => option.id === form.subscriptionId)
  const saleTotal = saleItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  const openCreate = () => {
    setOpen(true)
    setSaleMode(false)
    setSaleItemId('')
    setSaleQuantity('1')
    setSaleItems([])
    setForm({ swimmerId: '', subscriptionId: '', amount: '', method: 'نقدي', account: 'الخزينة', reference: '' })
  }
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>المدفوعات</h2><p>تحصيل الاشتراكات أو بيع أصناف المخزون من نفس الشاشة.</p></div><div className="panel-actions"><button type="button" className="primary-button compact" onClick={openCreate}><Plus size={16} /> تسجيل دفعة</button></div></div><div className="table-scroll"><table><thead><tr><th>الكود</th><th>السبّاح / العملية</th><th>الأصناف</th><th>المبلغ</th><th>طريقة الدفع</th><th>الحساب</th><th>التاريخ</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}><td>{row.code}</td><td>{row.swimmer}</td><td>{row.items || '-'}</td><td>{money(Number(row.amount))}</td><td>{row.method}</td><td>{row.account}</td><td>{String(row.date).slice(0, 10)}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty">لا توجد دفعات مسجلة</div>}</div>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><h2>تسجيل دفعة</h2><p>اختر تحصيل اشتراك أو بيع صنف من المخزون.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>نوع العملية<select value={saleMode ? 'بيع مخزون' : 'تحصيل اشتراك'} onChange={(event) => setSaleMode(event.target.value === 'بيع مخزون')}><option>تحصيل اشتراك</option><option>بيع مخزون</option></select></label>{!saleMode && <label>الاشتراك<select required value={form.subscriptionId} onChange={(event) => { const option = options.find((item) => item.id === event.target.value); setForm({ ...form, subscriptionId: event.target.value, swimmerId: String(option?.swimmerId ?? '') }) }}><option value="">اختر الاشتراك</option>{options.map((option) => <option key={String(option.id)} value={String(option.id)}>{option.swimmer} - {option.subscription} - متبقي {money(Number(option.remaining))}</option>)}</select></label>}{saleMode && <><label>الصنف<select value={saleItemId} onChange={(event) => setSaleItemId(event.target.value)}><option value="">اختر صنفًا</option>{inventory.map((item) => <option key={String(item.id)} value={String(item.id)}>{item.name} - متاح {item.quantity}</option>)}</select></label><label>الكمية<input type="number" min="1" value={saleQuantity} onChange={(event) => setSaleQuantity(event.target.value)} /></label><button type="button" className="secondary-button" onClick={addSaleItem}>إضافة الصنف</button><div className="sale-items">{saleItems.map((item) => <span key={item.itemId}>{item.name} × {item.quantity} = {money(item.quantity * item.unitPrice)}</span>)}</div></>}{!saleMode && <label>المبلغ<input required type="number" min="1" max={Number(chosen?.remaining ?? 0)} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>}{saleMode && <label>الإجمالي<input readOnly value={saleTotal} /></label>}<label>طريقة الدفع<select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}><option>نقدي</option><option>بنك</option><option>بطاقة</option><option>محفظة إلكترونية</option></select></label><label>الحساب المالي<select value={form.account} onChange={(event) => setForm({ ...form, account: event.target.value })}><option>الخزينة</option><option>البنك</option><option>المحفظة الإلكترونية</option></select></label><label>رقم المرجع<input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving || (saleMode ? !saleItems.length : !options.length)}>{saving ? 'جار الحفظ...' : 'حفظ الدفعة'}</button></div></form></div>}</section>
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
  return <section className="panel table-panel full-panel"><div className="panel-heading"><div><h2>{title}</h2><p>بيانات حقيقية محفوظة في MongoDB.</p></div></div><div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}>{fields.map((field) => <td key={field}>{field === 'price' || field === 'remaining' || field === 'amount' ? money(Number(row[field])) : row[field]}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <div className="empty">لا توجد سجلات بعد</div>}</div>{open && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><h2>إضافة اشتراك</h2><p>سيتم إنشاء الفاتورة تلقائيًا مع الاشتراك.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label>السبّاح<select required value={form.swimmerId} onChange={(event) => setForm({ ...form, swimmerId: event.target.value })}><option value="">اختر السباح</option>{swimmers.map((swimmer) => <option key={String(swimmer.id)} value={String(swimmer.id)}>{swimmer.full_name}</option>)}</select></label><label>الباقة<input required value={form.packageName} onChange={(event) => setForm({ ...form, packageName: event.target.value })} /></label><label>عدد الحصص<input required type="number" min="1" value={form.sessionsTotal} onChange={(event) => setForm({ ...form, sessionsTotal: event.target.value })} /></label><label>السعر<input required type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>الخصم<input type="number" min="0" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} /></label><label>تاريخ البداية<input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>تاريخ النهاية<input required type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ الاشتراك'}</button></div></form></div>}</section>
}

function ProfileModal({ language, onClose, onSaved }: { language: 'ar' | 'en'; onClose: () => void; onSaved: (name: string, language: 'ar' | 'en', token: string) => void }) {
  const [profile, setProfile] = useState({ name: '', email: '', password: '', language: 'ar' as 'ar' | 'en' })
  const [saving, setSaving] = useState(false)
  useEffect(() => { api('/profile').then((data) => setProfile({ name: data.name, email: data.email, password: '', language: data.language ?? 'ar' })).catch(() => undefined) }, [])
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { const result = await api('/profile', { method: 'PATCH', body: JSON.stringify(profile) }); localStorage.setItem('back_orca_token', result.token); onSaved(result.user.name, result.user.language, result.token); onClose() } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر حفظ الملف الشخصي') } finally { setSaving(false) } }
  const en = language === 'en'
  return <div className="modal-backdrop"><form className="modal profile-modal" onSubmit={save}><div className="modal-heading"><div><h2>{en ? 'Profile' : 'الملف الشخصي'}</h2><p>{en ? 'Update your account details and preferred language.' : 'عدّل بيانات الحساب واللغة المفضلة.'}</p></div><button type="button" className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="form-grid"><label>{en ? 'Name' : 'الاسم'}<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label>{en ? 'Email' : 'البريد الإلكتروني'}<input required type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label><label>{en ? 'New password' : 'كلمة مرور جديدة'}<input type="password" placeholder={en ? 'Leave blank to keep current password' : 'اتركها فارغة بدون تغيير'} value={profile.password} onChange={(event) => setProfile({ ...profile, password: event.target.value })} /></label><label>{en ? 'Language' : 'اللغة'}<select value={profile.language} onChange={(event) => setProfile({ ...profile, language: event.target.value as 'ar' | 'en' })}><option value="ar">العربية</option><option value="en">English</option></select></label></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>{en ? 'Cancel' : 'إلغاء'}</button><button className="primary-button" type="submit" disabled={saving}>{saving ? (en ? 'Saving...' : 'جار الحفظ...') : (en ? 'Save profile' : 'حفظ الملف الشخصي')}</button></div></form></div>
}

function SettingsPage() {
  const [form, setForm] = useState({ academyName: '', currency: 'جنيه مصري', alertDays: 7, allowNegativeStock: false, commissionRule: '' })
  const [saved, setSaved] = useState(false)
  useEffect(() => { api('/settings').then(setForm).catch(() => undefined) }, [])
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await api('/settings', { method: 'PUT', body: JSON.stringify(form) }); setSaved(true); window.setTimeout(() => setSaved(false), 2500) }
  const addAccount = async () => { const name = window.prompt('اسم المستخدم'); const email = window.prompt('البريد الإلكتروني'); const password = window.prompt('كلمة المرور المؤقتة'); if (!name || !email || !password) return; try { await api('/users', { method: 'POST', body: JSON.stringify({ name, email, password, role: 'استقبال' }) }); window.alert('تم إنشاء الحساب.'); } catch (error) { window.alert(error instanceof Error ? error.message : 'تعذر إنشاء الحساب') } }
  return <section className="panel settings-panel"><div className="panel-heading"><div><h2>مركز الإعدادات</h2><p>إعدادات الأكاديمية والتنبيهات والمخزون.</p></div><Settings size={22} color="var(--teal)" /></div><form className="settings-form" onSubmit={save}><label>اسم الأكاديمية<input value={form.academyName} onChange={(event) => setForm({ ...form, academyName: event.target.value })} /></label><label>العملة<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}><option>جنيه مصري</option><option>دولار أمريكي</option></select></label><label>التنبيه قبل انتهاء الاشتراك بأيام<input type="number" min="0" value={form.alertDays} onChange={(event) => setForm({ ...form, alertDays: Number(event.target.value) })} /></label><label>قاعدة العمولة<input value={form.commissionRule} onChange={(event) => setForm({ ...form, commissionRule: event.target.value })} /></label><label className="toggle-label"><input type="checkbox" checked={form.allowNegativeStock} onChange={(event) => setForm({ ...form, allowNegativeStock: event.target.checked })} /> السماح بالمخزون السالب</label><div className="modal-footer"><button className="primary-button" type="submit">حفظ الإعدادات</button><button className="secondary-button" type="button" onClick={addAccount}>إضافة حساب مساعد</button>{saved && <span className="settings-saved">تم حفظ الإعدادات</span>}</div></form></section>
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(''); try { const result = await api('/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('back_orca_token', result.token); onLogin() } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر تسجيل الدخول') } finally { setLoading(false) } }
  return <main className="login-shell" dir="rtl"><div className="login-card"><div className="login-brand"><div className="brand-mark"><Fish size={18} /></div><div><strong>Black Orca</strong><span>أكاديمية السباحة</span></div></div><p className="eyebrow">نظام إدارة الأكاديمية</p><h1>تسجيل الدخول</h1><p className="login-copy">أدخل بيانات حسابك للمتابعة. ستظل الجلسة صالحة لمدة ٧ أيام على هذا الجهاز.</p><form onSubmit={submit}><label>البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>كلمة المرور<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="login-error">{error}</div>}<button className="primary-button login-button" disabled={loading}>{loading ? 'جار التحقق...' : 'دخول'}</button></form></div></main>
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('back_orca_theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [userName, setUserName] = useState(() => {
    const token = localStorage.getItem('back_orca_token')
    if (!token) return ''
    try { const payload = JSON.parse(atob(token.split('.')[1])); if (payload.exp * 1000 <= Date.now()) { localStorage.removeItem('back_orca_token'); return '' } return displayUserName(payload.name ?? '') } catch { localStorage.removeItem('back_orca_token'); return '' }
  })
  const [language, setLanguage] = useState<'ar' | 'en'>(() => { const token = localStorage.getItem('back_orca_token'); try { return JSON.parse(atob(token?.split('.')[1] ?? '')).language === 'en' ? 'en' : 'ar' } catch { return 'ar' } })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('back_orca_theme', theme)
  }, [theme])
  const logout = () => { localStorage.removeItem('back_orca_token'); setUserName('') }
  const login = () => { const token = localStorage.getItem('back_orca_token'); if (!token) return; try { const payload = JSON.parse(atob(token.split('.')[1])); setUserName(displayUserName(payload.name ?? 'مستخدم')); setLanguage(payload.language === 'en' ? 'en' : 'ar') } catch { setUserName('مستخدم') } }
  const profileSaved = (name: string, nextLanguage: 'ar' | 'en', token: string) => { localStorage.setItem('back_orca_token', token); setUserName(displayUserName(name)); setLanguage(nextLanguage) }
  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  return userName ? <DashboardApp onLogout={logout} userName={userName} language={language} onProfileSaved={profileSaved} theme={theme} onToggleTheme={toggleTheme} /> : <LoginPage onLogin={login} />
}

export default App
