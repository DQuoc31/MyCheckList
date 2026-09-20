import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { TransactionModel } from '../models/Transaction';
import { 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  FinanceSummary, 
  TimeOfDaySlot, 
  TimeSlotStat,
  CategoryStat,
  ITransaction
} from '@mychecklist/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Protect all transaction routes with authMiddleware
router.use(authMiddleware);

const isDbConnected = () => mongoose.connection.readyState === 1;

export const autoDetectTimeSlot = (timeStr?: string): TimeOfDaySlot => {
  if (!timeStr) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'MORNING';
    if (hour >= 11 && hour < 17) return 'AFTERNOON';
    if (hour >= 17 && hour < 22) return 'EVENING';
    return 'NIGHT';
  }

  const [hourPart] = timeStr.split(':');
  const hour = parseInt(hourPart, 10);
  if (isNaN(hour)) return 'MORNING';

  if (hour >= 5 && hour < 11) return 'MORNING';
  if (hour >= 11 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 22) return 'EVENING';
  return 'NIGHT';
};

export const calculateFinanceSummary = (transactions: Array<ITransaction | any>): FinanceSummary => {
  const initialSlots: Record<TimeOfDaySlot, TimeSlotStat> = {
    MORNING: { income: 0, expense: 0, balance: 0, count: 0 },
    AFTERNOON: { income: 0, expense: 0, balance: 0, count: 0 },
    EVENING: { income: 0, expense: 0, balance: 0, count: 0 },
    NIGHT: { income: 0, expense: 0, balance: 0, count: 0 }
  };

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap: Record<string, { total: number; type: 'EXPENSE' | 'INCOME' }> = {};

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    const slot: TimeOfDaySlot = t.timeSlot && initialSlots[t.timeSlot as TimeOfDaySlot] 
      ? (t.timeSlot as TimeOfDaySlot) 
      : 'MORNING';

    initialSlots[slot].count += 1;

    if (t.type === 'INCOME') {
      totalIncome += amount;
      initialSlots[slot].income += amount;
    } else {
      totalExpense += amount;
      initialSlots[slot].expense += amount;
    }

    const catKey = `${t.category || 'Khác'}__${t.type}`;
    if (!categoryMap[catKey]) {
      categoryMap[catKey] = { total: 0, type: t.type };
    }
    categoryMap[catKey].total += amount;
  }

  // Calculate balances per slot
  for (const slotKey of Object.keys(initialSlots) as TimeOfDaySlot[]) {
    initialSlots[slotKey].balance = initialSlots[slotKey].income - initialSlots[slotKey].expense;
  }

  const byCategory: CategoryStat[] = Object.entries(categoryMap).map(([key, item]) => {
    const [category] = key.split('__');
    const baseTotal = item.type === 'INCOME' ? totalIncome : totalExpense;
    const percentage = baseTotal > 0 ? Math.round((item.total / baseTotal) * 100) : 0;
    return {
      category,
      type: item.type,
      total: item.total,
      percentage
    };
  }).sort((a, b) => b.total - a.total);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    transactionCount: transactions.length,
    byTimeSlot: initialSlots,
    byCategory
  };
};

// GET /api/transactions - List all transactions (with optional date / timeSlot / type query)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { date, timeSlot, type, startDate, endDate } = req.query;

    const query: any = { userId };
    if (date) query.date = date;
    if (timeSlot) query.timeSlot = timeSlot;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (isDbConnected()) {
      const items = await TransactionModel.find(query).sort({ date: -1, createdAt: -1 });
      return res.json({ success: true, data: items });
    }

    return res.json({ success: true, data: [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/transactions/summary - Get calculated summary for filtered transactions
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { date, startDate, endDate } = req.query;

    const query: any = { userId };
    if (date) query.date = date;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (isDbConnected()) {
      const items = await TransactionModel.find(query);
      const summary = calculateFinanceSummary(items);
      return res.json({ success: true, data: summary });
    }

    const emptySummary = calculateFinanceSummary([]);
    return res.json({ success: true, data: emptySummary });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const dto: CreateTransactionDto = req.body;

    if (!dto.title || dto.title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Tiêu đề khoản thu chi không được để trống' });
    }

    if (dto.amount === undefined || dto.amount === null || isNaN(Number(dto.amount)) || Number(dto.amount) < 0) {
      return res.status(400).json({ success: false, error: 'Số tiền không hợp lệ' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const date = dto.date || todayStr;
    const time = dto.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const timeSlot = dto.timeSlot || autoDetectTimeSlot(time);

    if (isDbConnected()) {
      const transaction = await TransactionModel.create({
        userId,
        title: dto.title.trim(),
        amount: Number(dto.amount),
        type: dto.type || 'EXPENSE',
        category: dto.category ? dto.category.trim() : 'Khác',
        timeSlot,
        date,
        time,
        note: dto.note || ''
      });

      return res.status(201).json({ success: true, data: transaction });
    }

    return res.status(500).json({ success: false, error: 'Database disconnected' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const dto: UpdateTransactionDto = req.body;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const existing = await TransactionModel.findOne({ _id: id, userId });
      if (!existing) return res.status(404).json({ success: false, error: 'Giao dịch không tồn tại' });

      if (dto.title !== undefined) existing.title = dto.title.trim();
      if (dto.amount !== undefined) existing.amount = Number(dto.amount);
      if (dto.type !== undefined) existing.type = dto.type;
      if (dto.category !== undefined) existing.category = dto.category.trim();
      if (dto.timeSlot !== undefined) existing.timeSlot = dto.timeSlot;
      if (dto.date !== undefined) existing.date = dto.date;
      if (dto.time !== undefined) existing.time = dto.time;
      if (dto.note !== undefined) existing.note = dto.note;

      const updated = await existing.save();
      return res.json({ success: true, data: updated });
    }

    return res.status(404).json({ success: false, error: 'Giao dịch không tồn tại' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const deleted = await TransactionModel.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ success: false, error: 'Giao dịch không tồn tại' });
      return res.json({ success: true, message: 'Đã xóa giao dịch thành công' });
    }

    return res.status(404).json({ success: false, error: 'Giao dịch không tồn tại' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
