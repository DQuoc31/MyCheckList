/**
 * ==============================================================================================
 * MODULE: Checklist Status Filtering & Auto-Sorting by Deadline Unit Tests
 * SUMMARY:
 * Bộ test này kiểm thử:
 * 1. Chức năng lọc danh sách task theo trạng thái (status: ALL, TODO, IN_PROGRESS, ARCHIVED, COMPLETED).
 * 2. Tự động sắp xếp task theo thời gian Deadline tăng dần (hạn chót gần nhất xếp trước).
 * 3. Kết hợp bộ lọc trạng thái cùng tìm kiếm từ khóa (search query), ưu tiên (priority) và nhãn (tag).
 * 4. Tính toán số lượng task theo từng trạng thái (statusCounts) trong thời gian thực.
 * 5. Helper hiển thị nhãn và màu sắc badge trạng thái.
 * ==============================================================================================
 */

import { describe, it, expect } from 'vitest';
import { ITask, Priority, TaskStatus } from '@mychecklist/shared';

/**
 * ----------------------------------------------------------------------------------------------
 * SUMMARY FUNCTION: filterTasks
 * ----------------------------------------------------------------------------------------------
 * • Mục đích: Thuật toán lọc danh sách task đồng bộ với ChecklistView và tự động sắp xếp
 *             theo hạn chót (Deadline) gần nhất lên đầu.
 * • Input:
 *   - tasks: Mảng danh sách công việc (ITask[]).
 *   - options:
 *     + searchQuery: Từ khóa tìm kiếm theo tiêu đề, mô tả hoặc tags.
 *     + statusFilter: Trạng thái cần lọc (ALL | TODO | IN_PROGRESS | ARCHIVED | COMPLETED).
 *     + priorityFilter: Mức độ ưu tiên (ALL | LOW | MEDIUM | HIGH | URGENT).
 *     + tagFilter: Nhãn cần lọc (ALL | string).
 * • Output:
 *   - Danh sách task đã được lọc và tự động sắp xếp theo deadline tăng dần (gần nhất lên đầu).
 * ----------------------------------------------------------------------------------------------
 */
export const filterTasks = (
  tasks: ITask[],
  options: {
    searchQuery?: string;
    statusFilter?: string;
    priorityFilter?: string;
    tagFilter?: string;
  }
): ITask[] => {
  const {
    searchQuery = '',
    statusFilter = 'ALL',
    priorityFilter = 'ALL',
    tagFilter = 'ALL'
  } = options;

  const matched = tasks.filter(task => {
    // 1. Search text query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchTags = (task.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }

    // 2. Status filter
    if (statusFilter !== 'ALL') {
      const taskStatus = task.status || 'TODO';
      if (taskStatus !== statusFilter) {
        return false;
      }
    }

    // 3. Priority filter
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
      return false;
    }

    // 4. Tag filter
    if (tagFilter !== 'ALL' && !(task.tags || []).includes(tagFilter)) {
      return false;
    }

    return true;
  });

  // Tự động sắp xếp: Task có deadline gần nhất lên đầu, task không có deadline xếp sau cùng
  return [...matched].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bCreated - aCreated;
  });
};

/**
 * ----------------------------------------------------------------------------------------------
 * SUMMARY FUNCTION: calculateStatusCounts
 * ----------------------------------------------------------------------------------------------
 * • Mục đích: Tính toán số lượng task thuộc từng trạng thái theo thời gian thực (realtime)
 *             để hiển thị badge đếm số lượng trên các nút tab lọc (Tất cả, To Do, In Progress, Done, Lưu trữ).
 * • Input:
 *   - tasks: Danh sách toàn bộ task.
 *   - options: Các filter phụ đang kích hoạt (searchQuery, priorityFilter, tagFilter).
 * • Output:
 *   - Object chứa số lượng task: { ALL, TODO, IN_PROGRESS, ARCHIVED, COMPLETED }.
 * ----------------------------------------------------------------------------------------------
 */
export const calculateStatusCounts = (
  tasks: ITask[],
  options: {
    searchQuery?: string;
    priorityFilter?: string;
    tagFilter?: string;
  }
): Record<string, number> => {
  const baseFiltered = filterTasks(tasks, {
    ...options,
    statusFilter: 'ALL'
  });

  const counts: Record<string, number> = {
    ALL: baseFiltered.length,
    TODO: 0,
    IN_PROGRESS: 0,
    ARCHIVED: 0,
    COMPLETED: 0
  };

  baseFiltered.forEach(t => {
    const st = t.status || 'TODO';
    if (counts[st] !== undefined) {
      counts[st]++;
    }
  });

  return counts;
};

/**
 * ----------------------------------------------------------------------------------------------
 * SUMMARY FUNCTION: getStatusBadgeInfo
 * ----------------------------------------------------------------------------------------------
 * • Mục đích: Định dạng thông tin hiển thị (nhãn tiếng Việt/tiêu chuẩn, mã màu) cho từng trạng thái.
 * • Input: status (TaskStatus: TODO | IN_PROGRESS | ARCHIVED | COMPLETED).
 * • Output: { label: string, color: string }.
 * ----------------------------------------------------------------------------------------------
 */
export const getStatusBadgeInfo = (status: TaskStatus) => {
  switch (status) {
    case 'TODO':
      return { label: 'To Do', color: '#15803d' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: '#d97706' };
    case 'ARCHIVED':
      return { label: 'Lưu trữ', color: '#64748b' };
    case 'COMPLETED':
      return { label: 'Done', color: '#16a34a' };
    default:
      return { label: status, color: '#64748b' };
  }
};

describe('Checklist Status Filtering', () => {
  const mockTasks: ITask[] = [
    {
      id: '1',
      title: 'Fix auth bug',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: '2026-10-10T10:00:00.000Z',
      tags: ['Backend', 'Bug'],
      checklist: []
    },
    {
      id: '2',
      title: 'Design UI for heatmap',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: '2026-10-09T08:00:00.000Z',
      tags: ['Frontend', 'UI'],
      checklist: []
    },
    {
      id: '3',
      title: 'Old meeting notes',
      status: 'ARCHIVED',
      priority: 'LOW',
      tags: ['General'],
      checklist: []
    },
    {
      id: '4',
      title: 'Deploy to production',
      status: 'COMPLETED',
      priority: 'URGENT',
      dueDate: '2026-10-08T15:00:00.000Z',
      tags: ['DevOps'],
      checklist: []
    },
    {
      id: '5',
      title: 'Write unit tests for filter',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: '2026-10-12T18:00:00.000Z',
      tags: ['Frontend', 'Test'],
      checklist: []
    }
  ];

  /**
   * SUMMARY TEST: Lọc tất cả (statusFilter = ALL)
   * • Kịch bản: Người dùng chọn tab "Tất cả".
   * • Kỳ vọng: Trả về đầy đủ 5/5 task trong danh sách.
   */
  it('filter: Trả về tất cả các task khi statusFilter = ALL', () => {
    const result = filterTasks(mockTasks, { statusFilter: 'ALL' });
    expect(result).toHaveLength(5);
  });

  /**
   * SUMMARY TEST: Lọc trạng thái COMPLETED
   * • Kịch bản: Người dùng chọn tab "Done".
   * • Kỳ vọng: Chỉ trả về 2 task có status === 'COMPLETED' (task id '4' và '5').
   */
  it('filter: Lọc chính xác các task ở trạng thái COMPLETED (Done)', () => {
    const result = filterTasks(mockTasks, { statusFilter: 'COMPLETED' });
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toEqual(['4', '5']);
  });

  /**
   * SUMMARY TEST: Lọc trạng thái IN_PROGRESS
   * • Kịch bản: Người dùng chọn tab "In Progress".
   * • Kỳ vọng: Chỉ trả về 1 task có status === 'IN_PROGRESS' (task id '2').
   */
  it('filter: Lọc chính xác các task ở trạng thái IN_PROGRESS', () => {
    const result = filterTasks(mockTasks, { statusFilter: 'IN_PROGRESS' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  /**
   * SUMMARY TEST: Lọc trạng thái ARCHIVED
   * • Kịch bản: Người dùng chọn tab "Lưu trữ".
   * • Kỳ vọng: Chỉ trả về 1 task có status === 'ARCHIVED' (task id '3').
   */
  it('filter: Lọc chính xác các task ở trạng thái ARCHIVED', () => {
    const result = filterTasks(mockTasks, { statusFilter: 'ARCHIVED' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  /**
   * SUMMARY TEST: Kết hợp đa điều kiện lọc
   * • Kịch bản: Lọc task COMPLETED + Priority HIGH + Từ khóa "unit tests".
   * • Kỳ vọng: Chỉ khớp duy nhất task id '5' ("Write unit tests for filter").
   */
  it('filter: Kết hợp đồng thời statusFilter, search query và priorityFilter', () => {
    const result = filterTasks(mockTasks, {
      statusFilter: 'COMPLETED',
      priorityFilter: 'HIGH',
      searchQuery: 'unit tests'
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('5');
  });
});

describe('Checklist Auto-Sorting by Deadline', () => {
  /**
   * SUMMARY TEST: Tự động sắp xếp deadline gần nhất lên đầu
   * • Kịch bản: Danh sách gồm các task có deadline vào ngày 12, ngày 9, ngày 8 và task không có deadline.
   * • Kỳ vọng: Thứ tự trả về phải là Ngày 8 -> Ngày 9 -> Ngày 12 -> Task không có deadline.
   */
  it('sorting: Sắp xếp các task theo deadline tăng dần (hạn chót gần nhất xếp trước)', () => {
    const tasksWithDeadlines: ITask[] = [
      { id: 't-far', title: 'Due late', priority: 'LOW', status: 'TODO', dueDate: '2026-10-15T00:00:00.000Z', tags: [], checklist: [] },
      { id: 't-soon', title: 'Due soon', priority: 'HIGH', status: 'TODO', dueDate: '2026-10-09T00:00:00.000Z', tags: [], checklist: [] },
      { id: 't-overdue', title: 'Due earliest', priority: 'URGENT', status: 'TODO', dueDate: '2026-10-08T00:00:00.000Z', tags: [], checklist: [] },
      { id: 't-no-due', title: 'No deadline', priority: 'MEDIUM', status: 'TODO', tags: [], checklist: [], createdAt: '2026-10-01T00:00:00.000Z' }
    ];

    const sorted = filterTasks(tasksWithDeadlines, {});

    expect(sorted[0].id).toBe('t-overdue'); // 2026-10-08
    expect(sorted[1].id).toBe('t-soon');    // 2026-10-09
    expect(sorted[2].id).toBe('t-far');     // 2026-10-15
    expect(sorted[3].id).toBe('t-no-due');  // No deadline -> xếp cuối cùng
  });

  /**
   * SUMMARY TEST: Task không có deadline được sắp xếp theo thời gian tạo mới nhất
   * • Kịch bản: Có nhiều task không có deadline được tạo vào các thời điểm khác nhau.
   * • Kỳ vọng: Các task không có deadline được xếp sau các task có deadline, và task tạo mới hơn xếp trước task tạo cũ hơn.
   */
  it('sorting: Task không có deadline được sắp xếp theo createdAt mới nhất', () => {
    const tasks: ITask[] = [
      { id: 'no-due-old', title: 'Old task', priority: 'LOW', status: 'TODO', tags: [], checklist: [], createdAt: '2026-10-01T00:00:00.000Z' },
      { id: 'has-due', title: 'Due task', priority: 'MEDIUM', status: 'TODO', dueDate: '2026-10-10T00:00:00.000Z', tags: [], checklist: [] },
      { id: 'no-due-new', title: 'New task', priority: 'HIGH', status: 'TODO', tags: [], checklist: [], createdAt: '2026-10-05T00:00:00.000Z' }
    ];

    const sorted = filterTasks(tasks, {});

    expect(sorted[0].id).toBe('has-due');      // Có deadline -> lên đầu
    expect(sorted[1].id).toBe('no-due-new');   // Tạo 05/10 -> xếp trước 01/10
    expect(sorted[2].id).toBe('no-due-old');   // Tạo 01/10 -> xếp cuối
  });
});

describe('Checklist Status Counts Calculation', () => {
  const mockTasks: ITask[] = [
    { title: 'T1', status: 'TODO', priority: 'HIGH', tags: ['FE'], checklist: [] },
    { title: 'T2', status: 'TODO', priority: 'LOW', tags: ['FE'], checklist: [] },
    { title: 'T3', status: 'IN_PROGRESS', priority: 'HIGH', tags: ['BE'], checklist: [] },
    { title: 'T4', status: 'COMPLETED', priority: 'HIGH', tags: ['FE'], checklist: [] },
    { title: 'T5', status: 'ARCHIVED', priority: 'MEDIUM', tags: ['BE'], checklist: [] }
  ];

  /**
   * SUMMARY TEST: Đếm số lượng task theo từng tab trạng thái
   * • Kịch bản: Tính toán số lượng task khi không có bộ lọc phụ nào được áp dụng.
   * • Kỳ vọng: ALL: 5, TODO: 2, IN_PROGRESS: 1, COMPLETED: 1, ARCHIVED: 1.
   */
  it('counts: Đếm chính xác số lượng task cho từng tab trạng thái khi không có filter phụ', () => {
    const counts = calculateStatusCounts(mockTasks, {});

    expect(counts.ALL).toBe(5);
    expect(counts.TODO).toBe(2);
    expect(counts.IN_PROGRESS).toBe(1);
    expect(counts.COMPLETED).toBe(1);
    expect(counts.ARCHIVED).toBe(1);
  });

  /**
   * SUMMARY TEST: Đếm số lượng task khi đang có filter Tag phụ
   * • Kịch bản: Người dùng chọn nhãn 'FE' trong menu filter.
   * • Kỳ vọng: Các con số thống kê trên từng tab tự động phản ánh đúng số lượng task có tag 'FE' (ALL: 3, TODO: 2, COMPLETED: 1, các tab khác: 0).
   */
  it('counts: Tự động cập nhật số lượng khi có filter tag hoặc priority', () => {
    const counts = calculateStatusCounts(mockTasks, { tagFilter: 'FE' });

    expect(counts.ALL).toBe(3); // T1, T2, T4
    expect(counts.TODO).toBe(2);
    expect(counts.IN_PROGRESS).toBe(0);
    expect(counts.COMPLETED).toBe(1);
    expect(counts.ARCHIVED).toBe(0);
  });
});

describe('Status Badge Mapping', () => {
  /**
   * SUMMARY TEST: Ánh xạ nhãn hiển thị của từng trạng thái
   * • Kịch bản: Kiểm tra giá trị nhãn hiển thị của các trạng thái.
   * • Kỳ vọng: TODO -> 'To Do', IN_PROGRESS -> 'In Progress', ARCHIVED -> 'Lưu trữ', COMPLETED -> 'Done'.
   */
  it('badge: Trả về đúng nhãn hiển thị cho từng trạng thái', () => {
    expect(getStatusBadgeInfo('TODO').label).toBe('To Do');
    expect(getStatusBadgeInfo('IN_PROGRESS').label).toBe('In Progress');
    expect(getStatusBadgeInfo('ARCHIVED').label).toBe('Lưu trữ');
    expect(getStatusBadgeInfo('COMPLETED').label).toBe('Done');
  });
});
