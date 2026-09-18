/**
 * ==============================================================================================
 * MODULE: JWT Config Helper Unit Tests
 * SUMMARY:
 * Bộ test này kiểm thử các hàm tiện ích cấu hình JWT (JSON Web Token), đảm bảo:
 * 1. Đọc đúng giá trị JWT_SECRET từ biến môi trường (environment variables).
 * 2. Cung cấp giá trị mặc định an toàn khi biến môi trường chưa được thiết lập.
 * 3. Đọc đúng cấu hình thời gian hết hạn token (JWT_EXPIRES_IN).
 * ==============================================================================================
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getJwtSecret, getJwtExpiresIn } from '../config/jwt';

describe('JWT Config Helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('summary: Nên trả về JWT_SECRET từ biến môi trường nếu đã cấu hình', () => {
    process.env.JWT_SECRET = 'test_custom_secret_key_123';
    expect(getJwtSecret()).toBe('test_custom_secret_key_123');
  });

  it('summary: Nên trả về giá trị secret mặc định nếu biến môi trường bị trống', () => {
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).toBe('mychecklist_secret_jwt_key_2026');
  });

  it('summary: Nên trả về JWT_EXPIRES_IN từ biến môi trường nếu có', () => {
    process.env.JWT_EXPIRES_IN = '14d';
    expect(getJwtExpiresIn()).toBe('14d');
  });

  it('summary: Nên trả về 7d mặc định cho thời hạn token nếu không cấu hình', () => {
    delete process.env.JWT_EXPIRES_IN;
    expect(getJwtExpiresIn()).toBe('7d');
  });
});
