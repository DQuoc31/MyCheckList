/**
 * ==============================================================================================
 * MODULE: Task 14-Day Auto Deletion & completedAt Lifecycle Unit Tests
 * SUMMARY:
 * Bộ test này kiểm tra toàn bộ cơ chế dọn dẹp tự động và chu trình trạng thái của task:
 * 1. Lọc và xóa các task DONE quá 14 ngày khỏi database.
 * 2. Bảo toàn các task DONE còn trong hạn 14 ngày và các task đang active (TODO, IN_PROGRESS).
 * 3. Chu trình cập nhật trường completedAt (gán timestamp khi hoàn thành, xóa khi hoàn tác).
 * 4. Xác thực định nghĩa TTL Index trên schema Mongoose.
 * ==============================================================================================
 */

import { describe, it, expect } from 'vitest';
import { ITask, TaskStatus } from '@mychecklist/shared';
import { TaskModel } from '../models/Task';

/**
 * ----------------------------------------------------------------------------------------------
 * SUMMARY FUNCTION: filterExpiredCompletedTasks
 * ----------------------------------------------------------------------------------------------
 * • Mục đích: Thuật toán quét và phân loại các task COMPLETED cần xóa vì đã quá hạn 14 ngày.
 * • Input: 
 *   - tasks: Danh sách các task cần kiểm tra (ITask[]).
 *   - referenceNow: Mốc thời gian đối chiếu (mặc định là Date.now()).
 * • Output: 
 *   - toDelete: Danh sách các task COMPLETED đã hoàn thành trước mốc 14 ngày.
 *   - toKeep: Danh sách các task cần giữ lại (gồm task active và task mới hoàn thành < 14 ngày).
 * ----------------------------------------------------------------------------------------------
 */
export const filterExpiredCompletedTasks = (tasks: ITask[], referenceNow: Date = new Date()): {
  toDelete: ITask[];
  toKeep: ITask[];
} => {
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  const cutoffTime = referenceNow.getTime() - FOURTEEN_DAYS_MS;

  const toDelete: ITask[] = [];
  const toKeep: ITask[] = [];

  tasks.forEach(task => {
    if (task.status === 'COMPLETED' && task.completedAt) {
      const completedTime = new Date(task.completedAt).getTime();
      if (completedTime < cutoffTime) {
        toDelete.push(task);
        return;
      }
    }
    toKeep.push(task);
  });

  return { toDelete, toKeep };
};

/**
 * ----------------------------------------------------------------------------------------------
 * SUMMARY FUNCTION: handleTaskStatusTransition
 * ----------------------------------------------------------------------------------------------
 * • Mục đích: Xử lý giá trị trường completedAt tương ứng khi trạng thái task thay đổi.
 * • Input:
 *   - currentStatus: Trạng thái hiện tại của task (TODO, IN_PROGRESS, ARCHIVED, COMPLETED).
 *   - newStatus: Trạng thái mới người dùng muốn cập nhật.
 *   - existingCompletedAt: Mốc completedAt trước đó nếu có.
 * • Output:
 *   - ISO String ngày giờ hoàn thành nếu newStatus === 'COMPLETED'.
 *   - null nếu task được chuyển về TODO / IN_PROGRESS / ARCHIVED.
 * ----------------------------------------------------------------------------------------------
 */
export const handleTaskStatusTransition = (
  currentStatus: TaskStatus,
  newStatus: TaskStatus,
  existingCompletedAt?: string
): string | null => {
  if (newStatus === 'COMPLETED') {
    if (currentStatus !== 'COMPLETED' || !existingCompletedAt) {
      return new Date().toISOString();
    }
    return existingCompletedAt;
  }
  return null;
};

describe('Task 14-Day Auto Deletion Logic', () => {
  const now = new Date('2026-10-08T12:00:00.000Z');

  /**
   * SUMMARY TEST: Lọc chính xác task COMPLETED > 14 ngày
   * • Kịch bản: Có 4 task gồm task hoàn thành cách đây 15 ngày, 10 ngày, hôm nay và task TODO tạo cách đây 20 ngày.
   * • Kỳ vọng: Chỉ có task hoàn thành 15 ngày trước bị đưa vào danh sách toDelete; 3 task còn lại được giữ nguyên.
   */
  it('cleanup: Nên lọc chính xác task COMPLETED đã hoàn thành hơn 14 ngày trước để xóa', () => {
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const justNow = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();

    const mockTasks: ITask[] = [
      {
        id: 'task-1',
        title: 'Old done task (15 days ago)',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        tags: [],
        checklist: [],
        completedAt: fifteenDaysAgo
      },
      {
        id: 'task-2',
        title: 'Recent done task (10 days ago)',
        status: 'COMPLETED',
        priority: 'HIGH',
        tags: [],
        checklist: [],
        completedAt: tenDaysAgo
      },
      {
        id: 'task-3',
        title: 'Done today',
        status: 'COMPLETED',
        priority: 'LOW',
        tags: [],
        checklist: [],
        completedAt: justNow
      },
      {
        id: 'task-4',
        title: 'Active task created 20 days ago',
        status: 'TODO',
        priority: 'URGENT',
        tags: [],
        checklist: []
      }
    ];

    const result = filterExpiredCompletedTasks(mockTasks, now);

    expect(result.toDelete).toHaveLength(1);
    expect(result.toDelete[0].id).toBe('task-1');

    expect(result.toKeep).toHaveLength(3);
    const keepIds = result.toKeep.map(t => t.id);
    expect(keepIds).toContain('task-2');
    expect(keepIds).toContain('task-3');
    expect(keepIds).toContain('task-4');
  });

  /**
   * SUMMARY TEST: Không xóa task đang active dù đã tạo lâu
   * • Kịch bản: Task TODO và IN_PROGRESS được tạo từ 20 ngày trước nhưng chưa xong.
   * • Kỳ vọng: toDelete rỗng (0 task bị xóa), bảo đảm không làm mất công việc đang làm dở của người dùng.
   */
  it('cleanup: Không xóa task ở trạng thái TODO, IN_PROGRESS hoặc ARCHIVED dù đã tạo lâu', () => {
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();

    const mockTasks: ITask[] = [
      {
        id: 'task-todo',
        title: 'Long standing TODO',
        status: 'TODO',
        priority: 'HIGH',
        tags: [],
        checklist: [],
        createdAt: twentyDaysAgo
      },
      {
        id: 'task-progress',
        title: 'Ongoing research',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        tags: [],
        checklist: [],
        createdAt: twentyDaysAgo
      }
    ];

    const result = filterExpiredCompletedTasks(mockTasks, now);

    expect(result.toDelete).toHaveLength(0);
    expect(result.toKeep).toHaveLength(2);
  });
});

describe('completedAt Lifecycle & Status Transitions', () => {
  /**
   * SUMMARY TEST: Gán completedAt khi hoàn thành
   * • Kịch bản: Người dùng đánh dấu task từ TODO sang COMPLETED.
   * • Kỳ vọng: Trả về timestamp hợp lệ thời điểm hiện tại (không null).
   */
  it('transition: Gán mốc thời gian khi chuyển task từ TODO sang COMPLETED', () => {
    const completedAt = handleTaskStatusTransition('TODO', 'COMPLETED');
    expect(completedAt).not.toBeNull();
    expect(new Date(completedAt!).getTime()).toBeLessThanOrEqual(Date.now());
  });

  /**
   * SUMMARY TEST: Xóa completedAt khi hoàn tác
   * • Kịch bản: Người dùng hoàn tác task đã xong về trạng thái TODO hoặc IN_PROGRESS.
   * • Kỳ vọng: Reset completedAt = null để tránh bị TTL index xóa nhầm.
   */
  it('transition: Xóa mốc completedAt (trả về null) khi chuyển từ COMPLETED về TODO hoặc IN_PROGRESS', () => {
    const existingDate = new Date().toISOString();
    const resultTodo = handleTaskStatusTransition('COMPLETED', 'TODO', existingDate);
    const resultProgress = handleTaskStatusTransition('COMPLETED', 'IN_PROGRESS', existingDate);

    expect(resultTodo).toBeNull();
    expect(resultProgress).toBeNull();
  });

  /**
   * SUMMARY TEST: Giữ nguyên mốc completedAt ban đầu nếu không đổi status
   * • Kịch bản: Người dùng chỉnh sửa tiêu đề hoặc mô tả của một task đã COMPLETED.
   * • Kỳ vọng: Giữ nguyên ngày giờ hoàn thành ban đầu, không bị reset lại mốc 14 ngày.
   */
  it('transition: Giữ nguyên mốc completedAt ban đầu nếu task vẫn ở trạng thái COMPLETED', () => {
    const initialDate = '2026-10-01T08:00:00.000Z';
    const result = handleTaskStatusTransition('COMPLETED', 'COMPLETED', initialDate);
    expect(result).toBe(initialDate);
  });
});

describe('TaskModel TTL Index Schema Verification', () => {
  /**
   * SUMMARY TEST: Xác thực cấu hình TTL Index Mongoose
   * • Kịch bản: Kiểm tra mảng index được khai báo trên TaskSchema.
   * • Kỳ vọng: Có index trên trường completedAt với expireAfterSeconds = 1209600s (14 ngày) và partialFilterExpression đúng.
   */
  it('schema: Model Task phải có định nghĩa TTL index với expireAfterSeconds = 14 ngày (1209600s)', () => {
    const indexes = TaskModel.schema.indexes();
    const ttlIndex = indexes.find(
      (idx: any) => idx[0]?.completedAt === 1 && idx[1]?.expireAfterSeconds === 14 * 24 * 60 * 60
    );

    expect(ttlIndex).toBeDefined();
    expect(ttlIndex![1].expireAfterSeconds).toBe(1209600);
    expect(ttlIndex![1].partialFilterExpression).toEqual({
      status: 'COMPLETED',
      completedAt: { $type: 'date' }
    });
  });
});
