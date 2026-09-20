import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { HabitModel } from '../models/Habit';
import { CreateHabitDto, UpdateHabitDto, LogHabitEntryDto, IHabitTracker } from '@mychecklist/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Protect all habit routes with authMiddleware
router.use(authMiddleware);

const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to get today's date in YYYY-MM-DD
const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET /api/habits - List all habits for authenticated user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (isDbConnected()) {
      const habits = await HabitModel.find({ userId }).sort({ createdAt: 1 });
      return res.json({ success: true, data: habits });
    }
    return res.json({ success: true, data: [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/habits - Create a new habit tracker
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dto: CreateHabitDto = req.body;
    const userId = req.userId;

    if (!dto.title || !dto.unit || dto.dailyTarget === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Tiêu đề, đơn vị tính và mục tiêu hàng ngày là bắt buộc.'
      });
    }

    if (isDbConnected()) {
      const newHabit = await HabitModel.create({
        userId,
        title: dto.title.trim(),
        unit: dto.unit.trim(),
        dailyTarget: Math.max(1, Number(dto.dailyTarget)),
        icon: dto.icon || 'sparkles',
        color: dto.color || '#6366f1',
        quickOptions: dto.quickOptions || [1, 5],
        history: []
      });
      return res.status(201).json({ success: true, data: newHabit });
    }

    return res.status(500).json({ success: false, error: 'Database disconnected' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/habits/:id - Update habit metadata
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const dto: UpdateHabitDto = req.body;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const habit = await HabitModel.findOne({ _id: id, userId });
      if (!habit) return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });

      if (dto.title !== undefined) habit.title = dto.title.trim();
      if (dto.unit !== undefined) habit.unit = dto.unit.trim();
      if (dto.dailyTarget !== undefined) habit.dailyTarget = Math.max(1, Number(dto.dailyTarget));
      if (dto.icon !== undefined) habit.icon = dto.icon;
      if (dto.color !== undefined) habit.color = dto.color;
      if (dto.quickOptions !== undefined) habit.quickOptions = dto.quickOptions;

      const updated = await habit.save();
      return res.json({ success: true, data: updated });
    }

    return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/habits/:id/log - Log consumption/activity for a date
router.post('/:id/log', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const dto: LogHabitEntryDto = req.body;

    if (dto.value === undefined) {
      return res.status(400).json({ success: false, error: 'Giá trị ghi nhận là bắt buộc.' });
    }

    const targetDate = dto.date || getTodayDateString();
    const mode = dto.mode || 'add';

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const habit = await HabitModel.findOne({ _id: id, userId });
      if (!habit) return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });

      const entryIndex = habit.history.findIndex(entry => entry.date === targetDate);
      const delta = Number(dto.value);

      if (entryIndex >= 0) {
        if (mode === 'add') {
          habit.history[entryIndex].value = Math.max(0, habit.history[entryIndex].value + delta);
        } else {
          habit.history[entryIndex].value = Math.max(0, delta);
        }
      } else {
        habit.history.push({
          date: targetDate,
          value: Math.max(0, delta)
        });
      }

      await habit.save();
      return res.json({ success: true, data: habit });
    }

    return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/habits/:id/reset - Reset habit value for a date
router.delete('/:id/reset', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const dateQuery = (req.query.date as string) || getTodayDateString();

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const habit = await HabitModel.findOne({ _id: id, userId });
      if (!habit) return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });

      const entryIndex = habit.history.findIndex(entry => entry.date === dateQuery);
      if (entryIndex >= 0) {
        habit.history[entryIndex].value = 0;
        await habit.save();
      }

      return res.json({ success: true, data: habit });
    }

    return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/habits/:id - Delete habit
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const deleted = await HabitModel.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });
      return res.json({ success: true, message: 'Thói quen đã được xóa thành công' });
    }

    return res.status(404).json({ success: false, error: 'Không tìm thấy thói quen' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
