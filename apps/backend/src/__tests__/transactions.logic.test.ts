/**
 * ==============================================================================================
 * MODULE: Transaction & Finance Calculation Logic Unit Tests
 * SUMMARY:
 * Kiểm thử các thuật toán quản lý thu chi theo khung giờ trong ngày:
 * 1. Tự động nhận diện khung giờ (Sáng, Trưa/Chiều, Tối, Đêm) theo giờ HH:mm.
 * 2. Tính toán tổng thu, tổng chi, số dư ròng cho từng khung giờ và toàn bộ giao dịch.
 * 3. Tổng hợp tỷ lệ % chi tiêu/thu nhập theo từng danh mục.
 * 4. Xử lý trường hợp biên (danh sách giao dịch rỗng, không phát sinh lỗi).
 * ==============================================================================================
 */

import { describe, it, expect } from 'vitest';
import { calculateFinanceSummary, autoDetectTimeSlot } from '../routes/transactions';
import { ITransaction } from '@mychecklist/shared';

describe('Transaction Time-slot & Calculation Logic', () => {
  it('autoDetectTimeSlot: Nhận diện chính xác khung giờ theo chuỗi thời gian HH:mm', () => {
    expect(autoDetectTimeSlot('06:30')).toBe('MORNING');
    expect(autoDetectTimeSlot('10:59')).toBe('MORNING');
    expect(autoDetectTimeSlot('11:00')).toBe('AFTERNOON');
    expect(autoDetectTimeSlot('16:45')).toBe('AFTERNOON');
    expect(autoDetectTimeSlot('17:00')).toBe('EVENING');
    expect(autoDetectTimeSlot('21:30')).toBe('EVENING');
    expect(autoDetectTimeSlot('22:00')).toBe('NIGHT');
    expect(autoDetectTimeSlot('02:15')).toBe('NIGHT');
  });

  it('calculateFinanceSummary: Trả về kết quả mặc định an toàn khi không có giao dịch', () => {
    const summary = calculateFinanceSummary([]);

    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.netBalance).toBe(0);
    expect(summary.transactionCount).toBe(0);
    expect(summary.byCategory).toEqual([]);
    expect(summary.byTimeSlot.MORNING).toEqual({ income: 0, expense: 0, balance: 0, count: 0 });
    expect(summary.byTimeSlot.AFTERNOON).toEqual({ income: 0, expense: 0, balance: 0, count: 0 });
    expect(summary.byTimeSlot.EVENING).toEqual({ income: 0, expense: 0, balance: 0, count: 0 });
    expect(summary.byTimeSlot.NIGHT).toEqual({ income: 0, expense: 0, balance: 0, count: 0 });
  });

  it('calculateFinanceSummary: Tính toán chính xác tổng thu chi và số dư theo từng khung giờ', () => {
    const mockTransactions: Partial<ITransaction>[] = [
      {
        title: 'Ăn sáng phở bò',
        amount: 45000,
        type: 'EXPENSE',
        category: 'Ăn uống',
        timeSlot: 'MORNING',
        date: '2026-09-20'
      },
      {
        title: 'Cafe sáng',
        amount: 30000,
        type: 'EXPENSE',
        category: 'Ăn uống',
        timeSlot: 'MORNING',
        date: '2026-09-20'
      },
      {
        title: 'Lương Freelance',
        amount: 3000000,
        type: 'INCOME',
        category: 'Thu nhập',
        timeSlot: 'AFTERNOON',
        date: '2026-09-20'
      },
      {
        title: 'Cơm trưa văn phòng',
        amount: 50000,
        type: 'EXPENSE',
        category: 'Ăn uống',
        timeSlot: 'AFTERNOON',
        date: '2026-09-20'
      },
      {
        title: 'Xem phim rạp tối',
        amount: 120000,
        type: 'EXPENSE',
        category: 'Giải trí',
        timeSlot: 'EVENING',
        date: '2026-09-20'
      },
      {
        title: 'Ăn khuya',
        amount: 35000,
        type: 'EXPENSE',
        category: 'Ăn uống',
        timeSlot: 'NIGHT',
        date: '2026-09-20'
      }
    ];

    const summary = calculateFinanceSummary(mockTransactions);

    // Total metrics
    expect(summary.totalIncome).toBe(3000000);
    expect(summary.totalExpense).toBe(45000 + 30000 + 50000 + 120000 + 35000); // 280000
    expect(summary.netBalance).toBe(3000000 - 280000); // 2720000
    expect(summary.transactionCount).toBe(6);

    // Ca Sáng
    expect(summary.byTimeSlot.MORNING.expense).toBe(75000);
    expect(summary.byTimeSlot.MORNING.income).toBe(0);
    expect(summary.byTimeSlot.MORNING.balance).toBe(-75000);
    expect(summary.byTimeSlot.MORNING.count).toBe(2);

    // Ca Chiều
    expect(summary.byTimeSlot.AFTERNOON.income).toBe(3000000);
    expect(summary.byTimeSlot.AFTERNOON.expense).toBe(50000);
    expect(summary.byTimeSlot.AFTERNOON.balance).toBe(2950000);
    expect(summary.byTimeSlot.AFTERNOON.count).toBe(2);

    // Ca Tối
    expect(summary.byTimeSlot.EVENING.expense).toBe(120000);
    expect(summary.byTimeSlot.EVENING.balance).toBe(-120000);
    expect(summary.byTimeSlot.EVENING.count).toBe(1);

    // Ca Đêm
    expect(summary.byTimeSlot.NIGHT.expense).toBe(35000);
    expect(summary.byTimeSlot.NIGHT.balance).toBe(-35000);
    expect(summary.byTimeSlot.NIGHT.count).toBe(1);

    // Category breakdown
    const foodCat = summary.byCategory.find(c => c.category === 'Ăn uống' && c.type === 'EXPENSE');
    expect(foodCat).toBeDefined();
    expect(foodCat?.total).toBe(160000);
    // Percentage: 160000 / 280000 * 100 = 57%
    expect(foodCat?.percentage).toBe(57);
  });
});
