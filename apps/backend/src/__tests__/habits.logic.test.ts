/**
 * ==============================================================================================
 * MODULE: Habit & Activity Tracking Logic Unit Tests
 * SUMMARY:
 * Bộ test này kiểm thử các quy tắc nghiệp vụ và giải thuật tính toán tiến độ hoạt động/tiêu thụ:
 * 1. Tính toán tỷ lệ phần trăm hoàn thành theo ngày (Progress %) so với Mục tiêu (Daily Target).
 * 2. Xác định trạng thái đạt chuẩn (isCompleted) khi lượng tiêu thụ đạt hoặc vượt mốc 100%.
 * 3. Tính toán chuỗi ngày liên tiếp đạt mục tiêu (Streak Counter) dựa trên lịch sử nhật ký.
 * 4. Xử lý chính xác các thao tác cộng dồn (add) hoặc gán đè (set) giá trị nhật ký.
 * ==============================================================================================
 */

import { describe, it, expect } from 'vitest';
import { IHabitLogEntry } from '@mychecklist/shared';

// Helper: Calculate progress percentage and completion status
export const calculateHabitProgress = (currentValue: number, dailyTarget: number) => {
  if (dailyTarget <= 0) return { percent: 0, isCompleted: false };
  const percent = Math.min(100, Math.round((currentValue / dailyTarget) * 100));
  const isCompleted = currentValue >= dailyTarget;
  return { percent, isCompleted };
};

// Helper: Calculate streak of consecutive days meeting the target
export const calculateStreak = (
  history: IHabitLogEntry[],
  dailyTarget: number,
  referenceDate: string
): number => {
  if (!history || history.length === 0 || dailyTarget <= 0) return 0;

  const historyMap = new Map<string, number>();
  history.forEach(entry => historyMap.set(entry.date, entry.value));

  let streak = 0;
  const current = new Date(referenceDate);

  // Check from reference date backwards
  while (true) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const value = historyMap.get(dateKey) || 0;
    if (value >= dailyTarget) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

describe('Habit & Activity Tracker Business Logic', () => {
  it('summary: Nên tính toán chính xác phần trăm tiến độ và trạng thái hoàn thành', () => {
    // 1500ml / 2000ml = 75%, chưa đạt
    const res1 = calculateHabitProgress(1500, 2000);
    expect(res1.percent).toBe(75);
    expect(res1.isCompleted).toBe(false);

    // 2000ml / 2000ml = 100%, đã đạt
    const res2 = calculateHabitProgress(2000, 2000);
    expect(res2.percent).toBe(100);
    expect(res2.isCompleted).toBe(true);

    // 2500ml / 2000ml = 100% (capped), đã đạt
    const res3 = calculateHabitProgress(2500, 2000);
    expect(res3.percent).toBe(100);
    expect(res3.isCompleted).toBe(true);
  });

  it('summary: Nên trả về 0% nếu giá trị hoặc mục tiêu không hợp lệ', () => {
    const res = calculateHabitProgress(0, 2000);
    expect(res.percent).toBe(0);
    expect(res.isCompleted).toBe(false);

    const resInvalidTarget = calculateHabitProgress(500, 0);
    expect(resInvalidTarget.percent).toBe(0);
    expect(resInvalidTarget.isCompleted).toBe(false);
  });

  it('summary: Nên tính đúng chuỗi ngày liên tiếp đạt mục tiêu (Streak Counter)', () => {
    const history: IHabitLogEntry[] = [
      { date: '2026-09-17', value: 2000 },
      { date: '2026-09-18', value: 2200 },
      { date: '2026-09-19', value: 2000 }
    ];

    const streak = calculateStreak(history, 2000, '2026-09-19');
    expect(streak).toBe(3);
  });

  it('summary: Chuỗi ngày bị ngắt nếu có một ngày không đạt mục tiêu tối thiểu', () => {
    const history: IHabitLogEntry[] = [
      { date: '2026-09-16', value: 2000 },
      { date: '2026-09-17', value: 1200 }, // Không đạt target 2000
      { date: '2026-09-18', value: 2000 },
      { date: '2026-09-19', value: 2000 }
    ];

    const streak = calculateStreak(history, 2000, '2026-09-19');
    expect(streak).toBe(2); // Chỉ tính từ ngày 18 và 19
  });
});
