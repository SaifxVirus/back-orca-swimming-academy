import cors from 'cors'
import express from 'express'
import mongoose, { Schema, Types } from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* eslint-disable @typescript-eslint/no-explicit-any */

const app = express()
const port = Number(process.env.PORT ?? 3001)
const mongoUri = process.env.MONGODB_URI
if (!mongoUri) throw new Error('MONGODB_URI is required')
app.use(cors())
app.use(express.json())

const parentSchema = new Schema({ code: { type: String, unique: true }, name: { type: String, required: true }, phone: { type: String, required: true }, email: String, address: String, notes: String }, { timestamps: true })
const coachSchema = new Schema({ code: { type: String, unique: true }, name: { type: String, required: true }, phone: String, contractType: { type: String, default: 'راتب شهري' }, baseSalary: { type: Number, default: 0, min: 0 }, sessionRate: { type: Number, default: 0, min: 0 }, commissionRate: { type: Number, default: 0, min: 0 }, status: { type: String, default: 'نشط' } })
const groupSchema = new Schema({ code: { type: String, unique: true }, name: { type: String, required: true }, level: { type: String, required: true }, coach: { type: Schema.Types.ObjectId, ref: 'Coach' }, days: { type: String, required: true }, startTime: { type: String, required: true }, endTime: { type: String, required: true }, capacity: { type: Number, required: true, min: 1 }, status: { type: String, default: 'نشطة' } })
const swimmerSchema = new Schema({ code: { type: String, unique: true }, firstName: { type: String, required: true }, fatherName: String, familyName: String, parent: { type: Schema.Types.ObjectId, ref: 'Parent', required: true }, birthDate: String, gender: String, registrationDate: { type: String, required: true }, status: { type: String, default: 'نشط' }, level: String, group: { type: Schema.Types.ObjectId, ref: 'Group' }, notes: String, emergency: String })
const subscriptionSchema = new Schema({ code: { type: String, unique: true }, swimmer: { type: Schema.Types.ObjectId, ref: 'Swimmer', required: true }, package: { type: String, required: true }, sessionsTotal: { type: Number, required: true, min: 1 }, startDate: { type: String, required: true }, endDate: { type: String, required: true }, price: { type: Number, required: true, min: 0 }, discount: { type: Number, default: 0, min: 0 }, paid: { type: Number, default: 0, min: 0 }, freezeStart: String, freezeEnd: String, status: { type: String, default: 'نشط' } })
const invoiceSchema = new Schema({ code: { type: String, unique: true }, subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true }, amount: { type: Number, required: true, min: 0 }, discount: { type: Number, default: 0, min: 0 }, netAmount: { type: Number, required: true, min: 0 }, status: { type: String, default: 'غير مدفوعة' } }, { timestamps: true })
const paymentSchema = new Schema({ code: { type: String, unique: true }, swimmer: { type: Schema.Types.ObjectId, ref: 'Swimmer', required: true }, parent: { type: Schema.Types.ObjectId, ref: 'Parent', required: true }, subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true }, invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true }, amount: { type: Number, required: true, min: 0.01 }, method: { type: String, required: true }, account: { type: String, required: true }, reference: String }, { timestamps: true })
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
mongoose.model('Session', sessionSchema)
mongoose.model('Attendance', attendanceSchema)
const InventoryItem = mongoose.model('InventoryItem', inventorySchema)
mongoose.model('StockMovement', stockMovementSchema)

const nextCode = async (model: mongoose.Model<any>, prefix: string) => `${prefix}-${String(await model.countDocuments() + 1).padStart(6, '0')}`
const fullName = (swimmer: any) => [swimmer.firstName, swimmer.fatherName, swimmer.familyName].filter(Boolean).join(' ')
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(currentDir, 'dist')

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

app.get('/api/health', (_req, res) => res.json({ ok: mongoose.connection.readyState === 1, service: 'Back Orca API', database: 'MongoDB' }))
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
app.get('/api/inventory', async (_req, res) => {
  const items = await InventoryItem.find().sort({ quantity: 1, name: 1 }).lean()
  res.json(items.map((item) => ({ id: item._id, sku: item.sku, name: item.name, category: item.category, quantity: item.quantity, average_cost: item.averageCost, sale_price: item.salePrice, min_quantity: item.minQuantity, stock_status: item.quantity <= item.minQuantity ? 'منخفض' : 'جيد' })))
})
app.get('/api/parents', async (_req, res) => {
  const parents = await Parent.find().sort({ _id: -1 }).lean()
  const counts = await Swimmer.aggregate([{ $group: { _id: '$parent', count: { $sum: 1 } } }])
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]))
  res.json(parents.map((parent) => ({ id: parent._id, parent_code: parent.code, name: parent.name, phone: parent.phone, email: parent.email, swimmer_count: countMap.get(String(parent._id)) ?? 0 })))
})

if (process.env.NODE_ENV === 'production') { app.use(express.static(publicDir)); app.use((_req, res) => res.sendFile(path.join(publicDir, 'index.html'))) }

async function start() {
  await mongoose.connect(mongoUri)
  await seedDatabase()
  app.listen(port, () => console.log(`Back Orca API running on http://localhost:${port}`))
}
start().catch((error) => { console.error('MongoDB connection failed', error); process.exit(1) })
