import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { ScheduleEventModel } from '../models/ScheduleEvent';
import { CreateScheduleEventDto, UpdateScheduleEventDto, IScheduleEvent } from '@mychecklist/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Protect all schedule routes with authMiddleware
router.use(authMiddleware);

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/schedule - List all schedule events for authenticated user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (isDbConnected()) {
      const events = await ScheduleEventModel.find({ userId }).sort({ startTime: 1 });
      return res.json({ success: true, data: events });
    }
    return res.json({ success: true, data: [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/schedule - Create schedule event for user
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dto: CreateScheduleEventDto = req.body;
    const userId = req.userId;

    if (!dto.title || !dto.startTime || !dto.endTime) {
      return res.status(400).json({ success: false, error: 'Title, startTime, và endTime là bắt buộc' });
    }

    if (isDbConnected()) {
      const newEvt = await ScheduleEventModel.create({
        ...dto,
        userId
      });
      return res.status(201).json({ success: true, data: newEvt });
    }

    return res.status(500).json({ success: false, error: 'Database disconnected' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/schedule/:id - Update schedule event for user
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const dto: UpdateScheduleEventDto = req.body;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const updated = await ScheduleEventModel.findOneAndUpdate(
        { _id: id, userId },
        dto,
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, error: 'Event not found' });
      return res.json({ success: true, data: updated });
    }

    return res.status(404).json({ success: false, error: 'Event not found' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/schedule/:id - Delete event for user
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const deleted = await ScheduleEventModel.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ success: false, error: 'Event not found' });
      return res.json({ success: true, message: 'Event deleted' });
    }

    return res.status(404).json({ success: false, error: 'Event not found' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
