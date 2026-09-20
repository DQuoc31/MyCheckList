/**
 * ==============================================================================================
 * MODULE: Frontend Finances & Time Slot Helpers Unit Tests
 * SUMMARY:
 * Kiểm thử cấu hình 4 khung giờ trong ngày và định dạng tiền tệ VNĐ:
 * 1. Đảm bảo TIME_SLOTS có đầy đủ 4 ca (Sáng, Trưa/Chiều, Tối, Đêm).
 * 2. Kiểm tra nhãn tiếng Việt và khung giờ thời gian chuẩn xác.
 * ==============================================================================================
 */

import { describe, it, expect } from 'vitest';
import { TIME_SLOTS, TimeOfDaySlot } from '@mychecklist/shared';

describe('Frontend Finances Time Slot Configurations', () => {
  it('TIME_SLOTS: Phải chứa đầy đủ 4 khung giờ chuẩn trong ngày', () => {
    const slots: TimeOfDaySlot[] = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
    
    slots.forEach(slot => {
      expect(TIME_SLOTS[slot]).toBeDefined();
      expect(TIME_SLOTS[slot].id).toBe(slot);
      expect(TIME_SLOTS[slot].label).toBeTruthy();
      expect(TIME_SLOTS[slot].timeRange).toBeTruthy();
    });
  });

  it('TIME_SLOTS: Ca Sáng, Ca Chiều, Ca Tối, Ca Đêm có nhãn và khoảng giờ tương ứng', () => {
    expect(TIME_SLOTS.MORNING.label).toBe('Ca Sáng');
    expect(TIME_SLOTS.MORNING.timeRange).toBe('05:00 - 11:00');

    expect(TIME_SLOTS.AFTERNOON.label).toBe('Ca Trưa / Chiều');
    expect(TIME_SLOTS.AFTERNOON.timeRange).toBe('11:00 - 17:00');

    expect(TIME_SLOTS.EVENING.label).toBe('Ca Tối');
    expect(TIME_SLOTS.EVENING.timeRange).toBe('17:00 - 22:00');

    expect(TIME_SLOTS.NIGHT.label).toBe('Ca Đêm');
    expect(TIME_SLOTS.NIGHT.timeRange).toBe('22:00 - 05:00');
  });
});
