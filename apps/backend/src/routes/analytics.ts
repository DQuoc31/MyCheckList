import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task';
import { ScheduleEventModel } from '../models/ScheduleEvent';
import { AnalyticsSummary } from '@mychecklist/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Protect analytics with authMiddleware
router.use(authMiddleware);

const isDbConnected = () => mongoose.connection.readyState === 1;

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (isDbConnected()) {
      const tasks = await TaskModel.find({ userId });
      const eventsCount = await ScheduleEventModel.countDocuments({ userId });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
      const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
      const todoTasks = tasks.filter(t => t.status === 'TODO').length;
      const highPriorityTasksCount = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;

      let totalSubItems = 0;
      let completedSubItems = 0;

      tasks.forEach(t => {
        if (t.checklist) {
          totalSubItems += t.checklist.length;
          completedSubItems += t.checklist.filter(item => item.completed).length;
        }
      });

      const summary: AnalyticsSummary = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalSubItems,
        completedSubItems,
        upcomingEventsCount: eventsCount,
        highPriorityTasksCount
      };

      return res.json({ success: true, data: summary });
    }

    const emptySummary: AnalyticsSummary = {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
      completionRate: 0,
      totalSubItems: 0,
      completedSubItems: 0,
      upcomingEventsCount: 0,
      highPriorityTasksCount: 0
    };

    return res.json({ success: true, data: emptySummary });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
