/**
 * ==============================================================================================
 * MODULE: Frontend API Helper & Storage Unit Tests
 * SUMMARY:
 * Bộ test này kiểm thử các tiện ích lưu trữ cục bộ và quản lý token trên Frontend:
 * 1. Lưu JWT token vào localStorage khi đăng nhập thành công.
 * 2. Đọc token từ localStorage để phục hồi phiên đăng nhập khi khởi tạo ứng dụng.
 * 3. Xóa token khỏi localStorage khi người dùng đăng xuất (Logout).
 * ==============================================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredToken, setStoredToken, removeStoredToken } from '../services/api';

describe('Frontend API Token Storage Helper', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      })
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  it('summary: Nên trả về null nếu chưa có token nào được lưu trong localStorage', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('summary: Nên lưu đúng chuỗi token vào localStorage khi gọi setStoredToken', () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ';
    setStoredToken(fakeToken);

    expect(getStoredToken()).toBe(fakeToken);
  });

  it('summary: Nên xóa hoàn toàn token khỏi localStorage khi gọi removeStoredToken', () => {
    const fakeToken = 'temporary_jwt_token_for_logout_test';
    setStoredToken(fakeToken);
    expect(getStoredToken()).toBe(fakeToken);

    removeStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
