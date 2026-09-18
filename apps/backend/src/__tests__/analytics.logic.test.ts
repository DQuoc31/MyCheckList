/**
 * ==============================================================================================
 * MODULE: Analytics Calculation Logic Unit Tests
 * SUMMARY:
 * Bộ test này kiểm thử các thuật toán thống kê và tính toán chỉ số hiệu suất trong hệ thống:
 * 1. Tính toán tỷ lệ hoàn thành công việc theo phần trăm (Completion Rate %).
 * 2. Tổng hợp số lượng sub-tasks và số sub-tasks đã hoàn thành trong toàn bộ danh sách.
 * 3. Đếm số lượng task có mức ưu tiên cao (HIGH, URGENT).
 * 4. Xử lý trường hợp biên (danh sách rỗng, không bị lỗi chia cho 0).
 * ==============================================================================================
 */

import { describe, it, expect } from 'vitest';
import { ITask, AnalyticsSummary } from '@mychecklist/shared';

// Pure function calculating analytics summary from tasks and events count
export const calculateAnalytics = (tasks: ITask[], eventsCount: number): AnalyticsSummary => {
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

describe('Analytics Calculations', () => {
  it('summary: Nên trả về tất cả chỉ số bằng 0 khi danh sách task rỗng (tránh lỗi chia cho 0)', () => {
    const summary = calculateAnalytics([], 0);

    expect(summary.totalTasks).toBe(0);
    expect(summary.completedTasks).toBe(0);
    expect(summary.completionRate).toBe(0);
    expect(summary.totalSubItems).toBe(0);
    expect(summary.completedSubItems).toBe(0);
    expect(summary.upcomingEventsCount).toBe(0);
    expect(summary.highPriorityTasksCount).toBe(0);
  });

  it('summary: Nên tính chính xác tỷ lệ hoàn thành % và phân loại trạng thái task', () => {
    const mockTasks: ITask[] = [
      {
        title: 'Task 1',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        tags: [],
        checklist: []
      },
      {
        title: 'Task 2',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        tags: [],
        checklist: []
      },
      {
        title: 'Task 3',
        priority: 'URGENT',
        status: 'TODO',
        tags: [],
        checklist: []
      },
      {
        title: 'Task 4',
        priority: 'LOW',
        status: 'COMPLETED',
        tags: [],
        checklist: []
      }
    ];

    const summary = calculateAnalytics(mockTasks, 5);

    expect(summary.totalTasks).toBe(4);
    expect(summary.completedTasks).toBe(2);
    expect(summary.inProgressTasks).toBe(1);
    expect(summary.todoTasks).toBe(1);
    expect(summary.completionRate).toBe(50); // 2/4 = 50%
    expect(summary.highPriorityTasksCount).toBe(2); // HIGH + URGENT
    expect(summary.upcomingEventsCount).toBe(5);
  });

  it('summary: Nên tính toán chính xác tổng số sub-tasks và số lượng sub-tasks đã hoàn thành', () => {
    const mockTasks: ITask[] = [
      {
        title: 'Task Complex',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        tags: ['Dev'],
        checklist: [
          { id: '1', title: 'Sub 1', completed: true },
          { id: '2', title: 'Sub 2', completed: true },
          { id: '3', title: 'Sub 3', completed: false }
        ]
      },
      {
        title: 'Task Simple',
        priority: 'LOW',
        status: 'TODO',
        tags: [],
        checklist: [
          { id: '4', title: 'Sub 4', completed: true },
          { id: '5', title: 'Sub 5', completed: false }
        ]
      }
    ];

    const summary = calculateAnalytics(mockTasks, 2);

    expect(summary.totalSubItems).toBe(5);
    expect(summary.completedSubItems).toBe(3);
  });
});
