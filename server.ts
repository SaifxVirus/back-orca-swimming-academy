import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose, { Schema, Types } from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* eslint-disable @typescript-eslint/no-explicit-any */

const app = express()
const port = Number(process.env.PORT ?? 3001)
const mongoUri = process.env.MONGODB_URI
const jwtSecret = process.env.JWT_SECRET ?? 'back-orca-development-secret'
if (!mongoUri) throw new Error('MONGODB_URI is required')
app.use(cors())
app.use(express.json())

const userSchema = new Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true }, passwordHash: { type: String, required: true }, role: { type: String, default: 'استقبال' }, language: { type: String, enum: ['ar', 'en'], default: 'ar' }, active: { type: Boolean, default: true } }, { timestamps: true })

const parentSchema = new Schema({ code: { type: String, unique: true }, name: { type: String, required: true }, phone: { type: String, required: true }, email: String, address: String, notes: String }, { timestamps: true })
const coachSchema = new Schema({ code: { type: String, unique: true }, name: { type: String, required: true }, phone: String, contractType: { type: String, default: 'راتب شهري' }, baseSalary: { type: Number, default: 0, min: 0 }, sessionRate: { type: Number, default: 0, min: 0 }, commissionRate: { type: Number, default: 0, min: 0 }, status: { type: String, default: 'نشط' } })
const groupSchema = new Schema({ code: { type: String, unique: true }, name: { type: String, required: true }, level: { type: String, required: true }, coach: { type: Schema.Types.ObjectId, ref: 'Coach' }, days: { type: String, required: true }, startTime: { type: String, required: true }, endTime: { type: String, required: true }, capacity: { type: Number, required: true, min: 1 }, status: { type: String, default: 'نشطة' } })
const swimmerSchema = new Schema({ code: { type: String, unique: true }, firstName: { type: String, required: true }, fatherName: String, familyName: String, parent: { type: Schema.Types.ObjectId, ref: 'Parent', required: true }, birthDate: String, gender: String, registrationDate: { type: String, required: true }, status: { type: String, default: 'نشط' }, level: String, group: { type: Schema.Types.ObjectId, ref: 'Group' }, notes: String, emergency: String })
const subscriptionSchema = new Schema({ code: { type: String, unique: true }, swimmer: { type: Schema.Types.ObjectId, ref: 'Swimmer', required: true }, package: { type: String, required: true }, sessionsTotal: { type: Number, required: true, min: 1 }, startDate: { type: String, required: true }, endDate: { type: String, required: true }, price: { type: Number, required: true, min: 0 }, discount: { type: Number, default: 0, min: 0 }, paid: { type: Number, default: 0, min: 0 }, freezeStart: String, freezeEnd: String, status: { type: String, default: 'نشط' } })
const invoiceSchema = new Schema({ code: { type: String, unique: true }, subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true }, amount: { type: Number, required: true, min: 0 }, discount: { type: Number, default: 0, min: 0 }, netAmount: { type: Number, required: true, min: 0 }, status: { type: String, default: 'غير مدفوعة' } }, { timestamps: true })
const paymentSchema = new Schema({ code: { type: String, unique: true }, swimmer: { type: Schema.Types.ObjectId, ref: 'Swimmer' }, parent: { type: Schema.Types.ObjectId, ref: 'Parent' }, subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' }, invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' }, items: [{ item: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true }, name: String, quantity: { type: Number, min: 1 }, unitPrice: { type: Number, min: 0 } }], amount: { type: Number, required: true, min: 0.01 }, method: { type: String, required: true }, account: { type: String, required: true }, reference: String }, { timestamps: true })
const settingsSchema = new Schema({ academyName: { type: String, default: 'Back Orca Swimming Academy' }, currency: { type: String, default: 'جنيه مصري' }, alertDays: { type: Number, default: 7 }, allowNegativeStock: { type: Boolean, default: false }, commissionRule: { type: String, default: 'إيرادات الاشتراكات المنسوبة للمدرب' } })
const sessionSchema = new Schema({ code: { type: String, unique: true }, group: { type: Schema.Types.ObjectId, ref: 'Group', required: true }, sessionDate: { type: String, required: true }, startTime: { type: String, required: true }, endTime: { type: String, required: true }, status: { type: String, default: 'مجدولة' } })
const attendanceSchema = new Schema({ swimmer: { type: Schema.Types.ObjectId, ref: 'Swimmer', required: true }, session: { type: Schema.Types.ObjectId, ref: 'Session', required: true }, subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true }, status: { type: String, required: true } })
attendanceSchema.index({ swimmer: 1, session: 1 }, { unique: true })
const inventorySchema = new Schema({ sku: { type: String, unique: true }, name: { type: String, required: true }, category: String, quantity: { type: Number, default: 0, min: 0 }, averageCost: { type: Number, default: 0, min: 0 }, salePrice: { type: Number, default: 0, min: 0 }, minQuantity: { type: Number, default: 0, min: 0 } })
const stockMovementSchema = new Schema({ item: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true }, movementType: { type: String, required: true }, quantity: { type: Number, required: true }, unitCost: { type: Number, default: 0 }, reference: String }, { timestamps: true })

const Parent = mongoose.model('Parent', parentSchema)
const Coach = mongoose.model('Coach', coachSchema)
const Group = mongoose.model('Group', groupSchema)
const Swimmer = mongoose.model('Swimmer', swimmerSchema)
const Subscription = mongoose.model('Subscription', subscriptionSchema)
const Invoice = mongoose.model('Invoice', invoiceSchema)
const Payment = mongoose.model('Payment', paymentSchema)
const Settings = mongoose.model('Settings', settingsSchema)
const User = mongoose.model('User', userSchema)
mongoose.model('Session', sessionSchema)
mongoose.model('Attendance', attendanceSchema)
const InventoryItem = mongoose.model('InventoryItem', inventorySchema)
mongoose.model('StockMovement', stockMovementSchema)

const nextCode = async (model: mongoose.Model<any>, prefix: string) => `${prefix}-${String(await model.countDocuments() + 1).padStart(6, '0')}`
const fullName = (swimmer: any) => [swimmer.firstName, swimmer.fatherName, swimmer.familyName].filter(Boolean).join(' ')
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(currentDir, 'dist')

const authenticate = (req: any, res: any, next: any) => {
  if (!req.path.startsWith('/api/') || req.path === '/api/login' || req.path === '/api/health') return next()
  const token = req.headers.authorization?.replace('Bearer ', '')
  try { req.user = jwt.verify(token, jwtSecret); next() } catch { res.status(401).json({ error: 'انتهت الجلسة أو بيانات الدخول غير صحيحة' }) }
}
const requireAdmin = (req: any, res: any, next: any) => req.user?.role === 'مدير' ? next() : res.status(403).json({ error: 'هذه العملية متاحة للمدير فقط' })
app.use(authenticate)

async function seedDatabase() {
  if (await Parent.exists({})) return
  const parent = await Parent.create({ code: await nextCode(Parent, 'PAR'), name: 'أحمد محمود', phone: '01001234567', email: 'ahmed@example.com' })
  const coach = await Coach.create({ code: await nextCode(Coach, 'COA'), name: 'كابتن كريم', phone: '01009998877', contractType: 'راتب + أجر حصة', baseSalary: 8500, sessionRate: 150, commissionRate: 5 })
  const group = await Group.create({ code: await nextCode(Group, 'GRP'), name: 'الحيتان الصغيرة', level: 'مبتدئ', coach: coach._id, days: 'الأحد - الثلاثاء - الخميس', startTime: '17:00', endTime: '18:00', capacity: 12 })
  const swimmer = await Swimmer.create({ code: await nextCode(Swimmer, 'SWM'), firstName: 'ياسين', fatherName: 'أحمد', familyName: 'محمود', parent: parent._id, birthDate: '2017-05-13', gender: 'ذكر', registrationDate: '2026-01-08', level: 'مبتدئ', group: group._id })
  const subscription = await Subscription.create({ code: await nextCode(Subscription, 'SUB'), swimmer: swimmer._id, package: 'اشتراك شهري', sessionsTotal: 12, startDate: '2026-09-01', endDate: '2026-09-30', price: 1800, paid: 1200 })
  await Invoice.create({ code: await nextCode(Invoice, 'INV'), subscription: subscription._id, amount: 1800, netAmount: 1800, status: 'مدفوعة جزئيًا' })
  await InventoryItem.create({ sku: 'CAP-001', name: 'غطاء سباحة', category: 'معدات', quantity: 18, averageCost: 120, salePrice: 180, minQuantity: 5 })
  await InventoryItem.create({ sku: 'GOG-001', name: 'نظارة سباحة', category: 'معدات', quantity: 4, averageCost: 280, salePrice: 400, minQuantity: 5 })
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@backorca.local'
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!'
  const existingAdmin = await User.findOne({ email })
  if (existingAdmin) { await User.updateOne({ _id: existingAdmin._id }, { name: 'Romaysaa', role: 'مدير' }); return }
  await User.create({ name: 'Romaysaa', email, passwordHash: await bcrypt.hash(password, 12), role: 'مدير' })
  console.log(`Admin account created for ${email}. Set ADMIN_PASSWORD in production.`)
}

app.get('/api/health', (_req, res) => res.json({ ok: mongoose.connection.readyState === 1, service: 'Back Orca API', database: 'MongoDB' }))
app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email).toLowerCase(), active: true })
  if (!user || !(await bcrypt.compare(String(req.body.password), user.passwordHash))) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' })
  const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, jwtSecret, { expiresIn: '7d' })
  res.json({ token, user: { name: user.name, email: user.email, role: user.role }, expiresInDays: 7 })
})
app.get('/api/me', async (req: any, res) => res.json(await User.findById(req.user.id).select('name email role active').lean()))
app.get('/api/profile', async (req: any, res) => res.json(await User.findById(req.user.id).select('name email role language').lean()))
app.patch('/api/profile', async (req: any, res) => {
  try {
    const updates: any = { name: req.body.name, email: req.body.email, language: req.body.language === 'en' ? 'en' : 'ar' }
    if (req.body.password) updates.passwordHash = await bcrypt.hash(req.body.password, 12)
    const user: any = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('name email role language')
    if (!user) return res.status(404).json({ error: 'الحساب غير موجود' })
    const token = jwt.sign({ id: user._id, name: user.name, role: user.role, language: user.language }, jwtSecret, { expiresIn: '7d' })
    res.json({ user, token })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر حفظ الملف الشخصي' }) }
})
app.get('/api/users', requireAdmin, async (_req, res) => res.json(await User.find().select('name email role active createdAt').sort({ createdAt: -1 }).lean()))
app.post('/api/users', requireAdmin, async (req, res) => {
  try { const { name, email, password, role } = req.body; if (!name || !email || !password) return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }); const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: role ?? 'استقبال' }); res.status(201).json({ id: user._id }) } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر إضافة الحساب' }) }
})
app.patch('/api/users/:id', requireAdmin, async (req, res) => { const user = await User.findByIdAndUpdate(req.params.id, { name: req.body.name, role: req.body.role, active: req.body.active }, { new: true }).select('name email role active'); if (!user) return res.status(404).json({ error: 'الحساب غير موجود' }); res.json(user) })
app.get('/api/settings', async (_req, res) => res.json(await Settings.findOne().lean() ?? await Settings.create({})))
app.put('/api/settings', async (req, res) => {
  try { res.json(await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true, runValidators: true })) } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر حفظ الإعدادات' }) }
})
app.get('/api/dashboard', async (_req, res) => {
  const [swimmerCount, subscriptionCount, groupCount, coachCount, lowStock, recentSwimmers, alerts, collected, invoices, payments] = await Promise.all([
    Swimmer.countDocuments({ status: 'نشط' }), Subscription.countDocuments({ status: 'نشط' }), Group.countDocuments({ status: 'نشطة' }), Coach.countDocuments({ status: 'نشط' }), InventoryItem.countDocuments({ $expr: { $lte: ['$quantity', '$minQuantity'] } }),
    Swimmer.find().sort({ _id: -1 }).limit(8).populate('parent', 'name phone').populate('group', 'name coach').lean(),
    Subscription.find({ status: 'نشط' }).populate('swimmer', 'firstName familyName').lean(),
    Payment.aggregate([{ $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Invoice.find({ status: { $ne: 'مستردة' } }).lean(), Payment.find().lean()
  ])
  const paidByInvoice = new Map<string, number>()
  payments.forEach((payment) => paidByInvoice.set(String(payment.invoice), (paidByInvoice.get(String(payment.invoice)) ?? 0) + payment.amount))
  const outstanding = invoices.reduce((total, invoice) => total + invoice.netAmount - (paidByInvoice.get(String(invoice._id)) ?? 0), 0)
  res.json({ metrics: { swimmerCount, subscriptionCount, groupCount, coachCount, collected: collected[0]?.total ?? 0, outstanding, lowStock }, recentSwimmers: recentSwimmers.map((swimmer: any) => ({ id: swimmer._id, swimmer_code: swimmer.code, full_name: fullName(swimmer), parent_name: swimmer.parent?.name, parent_phone: swimmer.parent?.phone, group_name: swimmer.group?.name ?? 'بدون مجموعة', coach_name: 'غير محدد', level: swimmer.level, status: swimmer.status })), alerts: alerts.map((subscription: any) => ({ id: subscription._id, swimmer_name: fullName(subscription.swimmer), end_date: subscription.endDate })) })
})
app.get('/api/swimmers', async (_req, res) => {
  const swimmers = await Swimmer.find().sort({ _id: -1 }).populate('parent', 'name phone').populate({ path: 'group', select: 'name', populate: { path: 'coach', select: 'name' } }).lean()
  res.json(swimmers.map((swimmer: any) => ({ id: swimmer._id, swimmer_code: swimmer.code, full_name: fullName(swimmer), parent_name: swimmer.parent?.name, parent_phone: swimmer.parent?.phone, group_name: swimmer.group?.name ?? 'بدون مجموعة', coach_name: swimmer.group?.coach?.name ?? 'غير محدد', level: swimmer.level, status: swimmer.status })))
})
app.post('/api/swimmers', async (req, res) => {
  try {
    const { firstName, fatherName, familyName, parentId, birthDate, gender, level, groupId } = req.body
    if (!firstName || !parentId) return res.status(400).json({ error: 'الاسم الأول وولي الأمر مطلوبان' })
    if (!Types.ObjectId.isValid(parentId)) return res.status(400).json({ error: 'رقم ولي الأمر غير صحيح' })
    const swimmer = await Swimmer.create({ code: await nextCode(Swimmer, 'SWM'), firstName, fatherName, familyName, parent: parentId, birthDate, gender, registrationDate: new Date().toISOString().slice(0, 10), level, group: groupId || undefined })
    res.status(201).json({ id: swimmer.code })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر إنشاء السباح' }) }
})
app.patch('/api/swimmers/:id', async (req, res) => {
  try {
    const { firstName, fatherName, familyName, parentId, birthDate, gender, level } = req.body
    if (!firstName || !parentId || !Types.ObjectId.isValid(parentId)) return res.status(400).json({ error: 'الاسم الأول وولي الأمر مطلوبان' })
    const swimmer = await Swimmer.findByIdAndUpdate(req.params.id, { firstName, fatherName, familyName, parent: parentId, birthDate, gender, level }, { new: true, runValidators: true })
    if (!swimmer) return res.status(404).json({ error: 'السباح غير موجود' })
    res.json({ id: swimmer.code })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر تعديل السباح' }) }
})
app.delete('/api/swimmers/:id', async (req, res) => {
  try {
    if (await Subscription.exists({ swimmer: req.params.id })) return res.status(409).json({ error: 'لا يمكن حذف سباح لديه اشتراك مرتبط. غيّر حالته إلى غير نشط بدلًا من ذلك.' })
    const swimmer = await Swimmer.findByIdAndDelete(req.params.id)
    if (!swimmer) return res.status(404).json({ error: 'السباح غير موجود' })
    res.json({ ok: true })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر حذف السباح' }) }
})
app.get('/api/inventory', async (_req, res) => {
  const items = await InventoryItem.find().sort({ quantity: 1, name: 1 }).lean()
  res.json(items.map((item) => ({ id: item._id, sku: item.sku, name: item.name, category: item.category, quantity: item.quantity, average_cost: item.averageCost, sale_price: item.salePrice, min_quantity: item.minQuantity, stock_status: item.quantity <= item.minQuantity ? 'منخفض' : 'جيد' })))
})
app.get('/api/subscriptions', async (_req, res) => {
  const rows = await Subscription.find().sort({ _id: -1 }).populate('swimmer', 'firstName fatherName familyName code').lean()
  res.json(rows.map((row: any) => ({ id: row._id, code: row.code, swimmer: fullName(row.swimmer), package: row.package, sessions: row.sessionsTotal, startDate: row.startDate, endDate: row.endDate, price: row.price, paid: row.paid, remaining: row.price - row.paid, status: row.status })))
})
app.get('/api/sessions', async (_req, res) => {
  const Session = mongoose.model('Session')
  const rows = await Session.find().sort({ sessionDate: -1 }).populate('group', 'name').lean()
  res.json(rows.map((row: any) => ({ id: row._id, code: row.code, group: row.group?.name ?? 'غير محددة', date: row.sessionDate, startTime: row.startTime, endTime: row.endTime, status: row.status })))
})
app.get('/api/groups', async (_req, res) => {
  const groups = await Group.find({ status: 'نشطة' }).sort({ name: 1 }).lean()
  res.json(groups.map((group) => ({ id: group._id, code: group.code, name: group.name, capacity: group.capacity })))
})
app.post('/api/sessions', async (req, res) => {
  try {
    const { groupId, sessionDate, startTime, endTime } = req.body
    if (!Types.ObjectId.isValid(groupId) || !sessionDate || !startTime || !endTime) return res.status(400).json({ error: 'المجموعة والتاريخ والأوقات مطلوبة' })
    const Session = mongoose.model('Session')
    const session = await Session.create({ code: await nextCode(Session, 'SES'), group: groupId, sessionDate, startTime, endTime })
    res.status(201).json({ id: session.code })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر إنشاء الجلسة' }) }
})
app.get('/api/sessions/:id/attendance', async (req, res) => {
  try {
    const Session = mongoose.model('Session')
    const session: any = await Session.findById(req.params.id).lean()
    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' })
    const swimmers = await Swimmer.find({ group: session.group, status: 'نشط' }).sort({ firstName: 1 }).lean()
    const Attendance = mongoose.model('Attendance')
    const records: any[] = await Attendance.find({ session: session._id }).lean()
    const recordMap = new Map(records.map((record) => [String(record.swimmer), record]))
    const subscriptions = await Subscription.find({ swimmer: { $in: swimmers.map((swimmer) => swimmer._id) }, status: 'نشط', startDate: { $lte: session.sessionDate }, endDate: { $gte: session.sessionDate } }).lean()
    const subscriptionMap = new Map(subscriptions.map((subscription) => [String(subscription.swimmer), subscription]))
    res.json(swimmers.map((swimmer) => ({ id: swimmer._id, code: swimmer.code, name: fullName(swimmer), subscriptionId: subscriptionMap.get(String(swimmer._id))?._id ?? null, status: recordMap.get(String(swimmer._id))?.status ?? 'لم يسجل' })))
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر تحميل الحضور' }) }
})
app.post('/api/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { swimmerId, subscriptionId, status } = req.body
    if (!Types.ObjectId.isValid(req.params.sessionId) || !Types.ObjectId.isValid(swimmerId) || !Types.ObjectId.isValid(subscriptionId) || !status) return res.status(400).json({ error: 'بيانات الحضور غير مكتملة' })
    const Attendance = mongoose.model('Attendance')
    const record = await Attendance.findOneAndUpdate({ session: req.params.sessionId, swimmer: swimmerId }, { session: req.params.sessionId, swimmer: swimmerId, subscription: subscriptionId, status }, { upsert: true, new: true, runValidators: true })
    res.json({ id: record._id })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر حفظ الحضور' }) }
})
app.get('/api/payments', async (_req, res) => {
  const rows = await Payment.find().sort({ createdAt: -1 }).populate('swimmer', 'firstName fatherName familyName').populate('parent', 'name').lean()
  res.json(rows.map((row: any) => ({ id: row._id, code: row.code, swimmer: fullName(row.swimmer) || 'بيع مخزون', parent: row.parent?.name || 'بيع مباشر', items: row.items?.map((item: any) => `${item.name} × ${item.quantity}`).join('، ') || '', amount: row.amount, method: row.method, account: row.account, date: row.createdAt })))
})
app.get('/api/payment-inventory', async (_req, res) => res.json(await InventoryItem.find({ quantity: { $gt: 0 } }).sort({ name: 1 }).lean()))
app.get('/api/payment-options', async (_req, res) => {
  const rows = await Subscription.find({ status: 'نشط' }).populate('swimmer', 'firstName fatherName familyName').lean()
  const invoices = await Invoice.find({ subscription: { $in: rows.map((row) => row._id) }, status: { $ne: 'مستردة' } }).lean()
  const payments = await Payment.find({ invoice: { $in: invoices.map((invoice) => invoice._id) } }).lean()
  const paid = new Map<string, number>()
  payments.forEach((payment) => paid.set(String(payment.invoice), (paid.get(String(payment.invoice)) ?? 0) + payment.amount))
  const invoiceMap = new Map(invoices.map((invoice) => [String(invoice.subscription), invoice]))
  res.json(rows.map((row: any) => { const invoice: any = invoiceMap.get(String(row._id)); return { id: row._id, swimmerId: row.swimmer?._id, swimmer: fullName(row.swimmer), subscription: row.package, invoiceId: invoice?._id, remaining: invoice ? Math.max(0, invoice.netAmount - (paid.get(String(invoice._id)) ?? 0)) : 0 } }).filter((row) => row.remaining > 0))
})
app.post('/api/payments', async (req, res) => {
  try {
    const { swimmerId, subscriptionId, amount, method, account, reference, items = [] } = req.body
    if (!amount || !method || !account || (!items.length && (!Types.ObjectId.isValid(swimmerId) || !Types.ObjectId.isValid(subscriptionId)))) return res.status(400).json({ error: 'بيانات الدفعة الأساسية مطلوبة' })
    if (items.length) {
      const normalizedItems = []
      let calculatedTotal = 0
      for (const line of items) {
        if (!Types.ObjectId.isValid(line.itemId) || Number(line.quantity) < 1) return res.status(400).json({ error: 'بيانات صنف المخزون غير صحيحة' })
        const item: any = await InventoryItem.findById(line.itemId)
        if (!item || item.quantity < Number(line.quantity)) return res.status(400).json({ error: `الرصيد غير كاف للصنف: ${item?.name ?? 'غير موجود'}` })
        normalizedItems.push({ item: item._id, name: item.name, quantity: Number(line.quantity), unitPrice: item.salePrice })
        calculatedTotal += item.salePrice * Number(line.quantity)
      }
      if (Number(amount) !== calculatedTotal) return res.status(400).json({ error: `إجمالي البيع يجب أن يساوي ${calculatedTotal}` })
      const payment = await Payment.create({ code: await nextCode(Payment, 'PAY'), items: normalizedItems, amount: calculatedTotal, method, account, reference })
      for (const line of normalizedItems) {
        await InventoryItem.findByIdAndUpdate(line.item, { $inc: { quantity: -line.quantity } })
        await mongoose.model('StockMovement').create({ item: line.item, movementType: 'بيع', quantity: -line.quantity, unitCost: line.unitPrice, reference: payment.code })
      }
      return res.status(201).json({ id: payment.code })
    }
    const swimmer: any = await Swimmer.findById(swimmerId).lean()
    const subscription: any = await Subscription.findById(subscriptionId).lean()
    const invoice: any = await Invoice.findOne({ subscription: subscriptionId, status: { $ne: 'مستردة' } })
    if (!swimmer || !subscription || !invoice) return res.status(404).json({ error: 'السباح أو الاشتراك أو الفاتورة غير موجودة' })
    const paid = await Payment.aggregate([{ $match: { invoice: invoice._id } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    const remaining = invoice.netAmount - (paid[0]?.total ?? 0)
    if (Number(amount) <= 0 || Number(amount) > remaining) return res.status(400).json({ error: `المبلغ أكبر من المتبقي (${remaining})` })
    const payment = await Payment.create({ code: await nextCode(Payment, 'PAY'), swimmer: swimmer._id, parent: swimmer.parent, subscription: subscription._id, invoice: invoice._id, amount: Number(amount), method, account, reference })
    const newPaid = (paid[0]?.total ?? 0) + Number(amount)
    await Subscription.findByIdAndUpdate(subscription._id, { paid: newPaid })
    await Invoice.findByIdAndUpdate(invoice._id, { status: newPaid >= invoice.netAmount ? 'مدفوعة بالكامل' : 'مدفوعة جزئيًا' })
    res.status(201).json({ id: payment.code })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر تسجيل الدفعة' }) }
})
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { swimmerId, packageName, sessionsTotal, startDate, endDate, price, discount } = req.body
    if (!Types.ObjectId.isValid(swimmerId) || !packageName || !sessionsTotal || !startDate || !endDate) return res.status(400).json({ error: 'بيانات الاشتراك الأساسية مطلوبة' })
    const subscription = await Subscription.create({ code: await nextCode(Subscription, 'SUB'), swimmer: swimmerId, package: packageName, sessionsTotal, startDate, endDate, price: Number(price) || 0, discount: Number(discount) || 0 })
    await Invoice.create({ code: await nextCode(Invoice, 'INV'), subscription: subscription._id, amount: Number(price) || 0, discount: Number(discount) || 0, netAmount: Math.max(0, (Number(price) || 0) - (Number(discount) || 0)) })
    res.status(201).json({ id: subscription.code })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر إنشاء الاشتراك' }) }
})
app.post('/api/inventory', async (req, res) => {
  try {
    const { sku, name, category, quantity, averageCost, salePrice, minQuantity } = req.body
    if (!sku || !name) return res.status(400).json({ error: 'كود الصنف واسم الصنف مطلوبان' })
    const item = await InventoryItem.create({ sku, name, category, quantity: Number(quantity) || 0, averageCost: Number(averageCost) || 0, salePrice: Number(salePrice) || 0, minQuantity: Number(minQuantity) || 0 })
    res.status(201).json({ id: item._id })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر إضافة الصنف' }) }
})
app.patch('/api/inventory/:id', async (req, res) => {
  try {
    const { sku, name, category, quantity, averageCost, salePrice, minQuantity } = req.body
    if (!sku || !name) return res.status(400).json({ error: 'كود الصنف واسم الصنف مطلوبان' })
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, { sku, name, category, quantity: Number(quantity) || 0, averageCost: Number(averageCost) || 0, salePrice: Number(salePrice) || 0, minQuantity: Number(minQuantity) || 0 }, { new: true, runValidators: true })
    if (!item) return res.status(404).json({ error: 'الصنف غير موجود' })
    res.json({ id: item._id })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر تعديل الصنف' }) }
})
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const StockMovement = mongoose.model('StockMovement')
    if (await StockMovement.exists({ item: req.params.id })) return res.status(409).json({ error: 'لا يمكن حذف صنف لديه حركات مخزون مرتبطة' })
    const item = await InventoryItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ error: 'الصنف غير موجود' })
    res.json({ ok: true })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر حذف الصنف' }) }
})
app.get('/api/parents', async (_req, res) => {
  const parents = await Parent.find().sort({ _id: -1 }).lean()
  const counts = await Swimmer.aggregate([{ $group: { _id: '$parent', count: { $sum: 1 } } }])
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]))
  res.json(parents.map((parent) => ({ id: parent._id, parent_code: parent.code, name: parent.name, phone: parent.phone, email: parent.email, swimmer_count: countMap.get(String(parent._id)) ?? 0 })))
})
app.post('/api/parents', async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body
    if (!name || !phone) return res.status(400).json({ error: 'اسم ولي الأمر ورقم الهاتف مطلوبان' })
    const parent = await Parent.create({ code: await nextCode(Parent, 'PAR'), name, phone, email, address, notes })
    res.status(201).json({ id: parent.code })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر إضافة ولي الأمر' }) }
})
app.patch('/api/parents/:id', async (req, res) => {
  try {
    const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!parent) return res.status(404).json({ error: 'ولي الأمر غير موجود' })
    res.json({ id: parent.code })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر تعديل ولي الأمر' }) }
})
app.delete('/api/parents/:id', async (req, res) => {
  try {
    if (await Swimmer.exists({ parent: req.params.id })) return res.status(409).json({ error: 'لا يمكن حذف ولي أمر مرتبط بسباحين' })
    const parent = await Parent.findByIdAndDelete(req.params.id)
    if (!parent) return res.status(404).json({ error: 'ولي الأمر غير موجود' })
    res.json({ ok: true })
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'تعذر حذف ولي الأمر' }) }
})

if (process.env.NODE_ENV === 'production') { app.use(express.static(publicDir)); app.use((_req, res) => res.sendFile(path.join(publicDir, 'index.html'))) }

async function start() {
  await mongoose.connect(mongoUri)
  await seedDatabase()
  await seedAdmin()
  app.listen(port, () => console.log(`Back Orca API running on http://localhost:${port}`))
}
start().catch((error) => { console.error('MongoDB connection failed', error); process.exit(1) })
