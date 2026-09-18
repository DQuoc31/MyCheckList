import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task';
import { CreateTaskDto, UpdateTaskDto, ITask } from '@mychecklist/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Protect all task routes with authMiddleware
router.use(authMiddleware);

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/tasks - List all tasks for authenticated user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (isDbConnected()) {
      const tasks = await TaskModel.find({ userId }).sort({ createdAt: -1 });
      return res.json({ success: true, data: tasks });
    }
    return res.json({ success: true, data: [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tasks/:id - Get single task by ID for user
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const task = await TaskModel.findOne({ _id: id, userId });
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      return res.json({ success: true, data: task });
    }
    return res.status(404).json({ success: false, error: 'Task not found' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks - Create task for user
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dto: CreateTaskDto = req.body;
    const userId = req.userId;

    if (!dto.title) {
      return res.status(400).json({ success: false, error: 'Tiêu đề task không được để trống' });
    }

    const checklistItems = (dto.checklist || []).map((item, index) => ({
      id: `sub-${Date.now()}-${index}`,
      title: item.title,
      completed: item.completed || false
    }));

    if (isDbConnected()) {
      const newTask = await TaskModel.create({
        userId,
        title: dto.title,
        description: dto.description || '',
        priority: dto.priority || 'MEDIUM',
        status: dto.status || 'TODO',
        tags: dto.tags || [],
        dueDate: dto.dueDate,
        estimatedMinutes: dto.estimatedMinutes || 30,
        checklist: checklistItems
      });
      return res.status(201).json({ success: true, data: newTask });
    }

    return res.status(500).json({ success: false, error: 'Database disconnected' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/tasks/:id - Update task for user
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const dto: UpdateTaskDto = req.body;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const existing = await TaskModel.findOne({ _id: id, userId });
      if (!existing) return res.status(404).json({ success: false, error: 'Task not found' });

      let checklist = existing.checklist;
      if (dto.checklist) {
        checklist = dto.checklist.map((item, idx) => ({
          id: `sub-${Date.now()}-${idx}`,
          title: item.title,
          completed: item.completed || false
        }));
      }

      existing.title = dto.title ?? existing.title;
      existing.description = dto.description ?? existing.description;
      existing.priority = dto.priority ?? existing.priority;
      existing.status = dto.status ?? existing.status;
      existing.tags = dto.tags ?? existing.tags;
      existing.dueDate = dto.dueDate ?? existing.dueDate;
      existing.estimatedMinutes = dto.estimatedMinutes ?? existing.estimatedMinutes;
      existing.checklist = checklist;

      const updated = await existing.save();
      return res.json({ success: true, data: updated });
    }

    return res.status(404).json({ success: false, error: 'Task not found' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/tasks/:id/checklist/:subId/toggle - Toggle subtask completed status
router.patch('/:id/checklist/:subId/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, subId } = req.params;
    const userId = req.userId;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const task = await TaskModel.findOne({ _id: id, userId });
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      
      const subItem = task.checklist.find(item => item.id === subId);
      if (subItem) {
        subItem.completed = !subItem.completed;
        await task.save();
      }
      return res.json({ success: true, data: task });
    }

    return res.status(404).json({ success: false, error: 'Task not found' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      const deleted = await TaskModel.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ success: false, error: 'Task not found' });
      return res.json({ success: true, message: 'Task deleted successfully' });
    }

    return res.status(404).json({ success: false, error: 'Task not found' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
