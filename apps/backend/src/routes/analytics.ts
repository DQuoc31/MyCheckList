import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task';
import { ScheduleEventModel } from '../models/ScheduleEvent';
import { TransactionModel } from '../models/Transaction';
import { HabitModel } from '../models/Habit';
import { 
  AnalyticsSummary, 
  FinanceSummary, 
  HabitAnalyticsSummary, 
  ComprehensiveAnalytics,
  HabitItemStat,
  ITask
} from '@mychecklist/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { calculateFinanceSummary } from './transactions';

const router = Router();

// Protect analytics with authMiddleware
router.use(authMiddleware);

const isDbConnected = () => mongoose.connection.readyState === 1;

export const calculateTaskAnalytics = (tasks: ITask[] | any[], eventsCount: number): AnalyticsSummary => {
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
      completedSubItems += t.checklist.filter((item: any) => item.completed).length;
    }
  });

  return {
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
};

export const calculateHabitAnalytics = (habits: any[], todayDateStr: string): HabitAnalyticsSummary => {
  const totalHabits = habits.length;
  let todayCompletedCount = 0;
  let totalLoggedEntries = 0;

  const habitsStats: HabitItemStat[] = habits.map(h => {
    const todayLog = (h.history || []).find((entry: any) => entry.date === todayDateStr);
    const todayValue = todayLog ? Number(todayLog.value) || 0 : 0;
    const dailyTarget = Number(h.dailyTarget) || 1;
    const completionRate = Math.min(100, Math.round((todayValue / dailyTarget) * 100));
    if (todayValue >= dailyTarget) {
      todayCompletedCount += 1;
    }

    const totalLoggedDays = (h.history || []).filter((e: any) => Number(e.value) > 0).length;
    totalLoggedEntries += (h.history || []).length;

    // Calculate current streak
    let streak = 0;
    const completedDates = (h.history || [])
      .filter((e: any) => Number(e.value) >= dailyTarget)
      .map((e: any) => e.date);

    const checkDate = new Date();
    let checkStr = checkDate.toISOString().split('T')[0];
    if (todayValue < dailyTarget) {
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0];
    }
    while (completedDates.includes(checkStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0];
    }

    return {
      id: h.id || (h._id ? h._id.toString() : ''),
      title: h.title,
      unit: h.unit,
      dailyTarget,
      todayValue,
      completionRate,
      totalLoggedDays,
      currentStreak: streak
    };
  });

  const todayCompletionRate = totalHabits > 0 ? Math.round((todayCompletedCount / totalHabits) * 100) : 0;

  return {
    totalHabits,
    todayCompletedCount,
    todayCompletionRate,
    totalLoggedEntries,
    habitsStats
  };
};

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const todayDateStr = new Date().toISOString().split('T')[0];

    if (isDbConnected()) {
      const [tasks, eventsCount, transactions, habits] = await Promise.all([
        TaskModel.find({ userId }),
        ScheduleEventModel.countDocuments({ userId }),
        TransactionModel.find({ userId }),
        HabitModel.find({ userId })
      ]);

      const tasksSummary = calculateTaskAnalytics(tasks, eventsCount);
      const financeSummary = calculateFinanceSummary(transactions);
      const habitsSummary = calculateHabitAnalytics(habits, todayDateStr);

      const comprehensive: ComprehensiveAnalytics & AnalyticsSummary = {
        tasks: tasksSummary,
        finances: financeSummary,
        habits: habitsSummary,
        ...tasksSummary
      };

      return res.json({ success: true, data: comprehensive });
    }

    const emptyTasks = calculateTaskAnalytics([], 0);
    const emptyFinances = calculateFinanceSummary([]);
    const emptyHabits = calculateHabitAnalytics([], todayDateStr);

    const emptyComprehensive: ComprehensiveAnalytics & AnalyticsSummary = {
      tasks: emptyTasks,
      finances: emptyFinances,
      habits: emptyHabits,
      ...emptyTasks
    };

    return res.json({ success: true, data: emptyComprehensive });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
