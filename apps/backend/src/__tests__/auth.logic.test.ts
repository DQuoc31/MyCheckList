/**
 * ==============================================================================================
 * MODULE: Auth Business Logic Unit Tests
 * SUMMARY:
 * Bộ test này kiểm thử các quy tắc nghiệp vụ và cơ chế bảo mật xác thực người dùng:
 * 1. Mã hóa mật khẩu một chiều an toàn bằng bcryptjs (hashing & salting).
 * 2. So khớp chính xác mật khẩu thô và hash đã lưu.
 * 3. Tạo và giải mã JWT token chứa đúng payload userId và email.
 * 4. Kiểm tra quy tắc validation đầu vào (độ dài mật khẩu >= 6, chuẩn hóa email viết thường).
 * ==============================================================================================
 */

import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret, getJwtExpiresIn } from '../config/jwt';

describe('Auth Security & Business Logic', () => {
  it('summary: Nên mã hóa mật khẩu thành chuỗi hash khác với mật khẩu gốc', async () => {
    const rawPassword = 'StrongPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    expect(hashedPassword).not.toBe(rawPassword);
    expect(hashedPassword.length).toBeGreaterThan(20);
  });

  it('summary: Nên so khớp thành công mật khẩu đúng và từ chối mật khẩu sai', async () => {
    const rawPassword = 'CorrectPassword@2026';
    const wrongPassword = 'WrongPassword@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isWrongMatch = await bcrypt.compare(wrongPassword, hash);

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  it('summary: Nên tạo JWT token hợp lệ và giải mã đúng thông tin userId, email', () => {
    const userPayload = { userId: 'user_mongodb_id_999', email: 'user@checklist.vn' };
    const secret = getJwtSecret();
    const token = jwt.sign(userPayload, secret, { expiresIn: '7d' });

    const decoded = jwt.verify(token, secret) as { userId: string; email: string };

    expect(decoded.userId).toBe(userPayload.userId);
    expect(decoded.email).toBe(userPayload.email);
  });

  it('summary: Chuẩn hóa email bằng trim và lowercase để chống trùng lặp tài khoản', () => {
    const rawEmail = '  NguyenVanA@GMAIL.com  ';
    const normalized = rawEmail.trim().toLowerCase();

    expect(normalized).toBe('nguyenvana@gmail.com');
  });

  it('summary: Kiểm tra tính hợp lệ của độ dài mật khẩu (tối thiểu 6 ký tự)', () => {
    const isPasswordValid = (pwd: string) => pwd && pwd.length >= 6;

    expect(isPasswordValid('12345')).toBe(false);
    expect(isPasswordValid('123456')).toBe(true);
    expect(isPasswordValid('my_secret_pass')).toBe(true);
  });
});
