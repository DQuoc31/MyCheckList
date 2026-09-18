/**
 * ==============================================================================================
 * MODULE: Auth Middleware Unit Tests
 * SUMMARY:
 * Bộ test này kiểm thử tầng Middleware xác thực JWT (authMiddleware) của Backend:
 * 1. Chặn các request không có header Authorization hoặc không đúng định dạng 'Bearer <token>'.
 * 2. Chặn các request có token sai chữ ký, hết hạn hoặc bị giả mạo (trả về mã lỗi 401 Unauthorized).
 * 3. Cho phép các request có token hợp lệ đi tiếp và giải mã đúng thông tin userId, userEmail gán vào Request object.
 * ==============================================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getJwtSecret } from '../config/jwt';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: any;
  let nextFunction: any;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    nextFunction = vi.fn();
  });

  it('summary: Nên trả về 401 nếu request không có header Authorization', () => {
    mockRequest.headers = {};

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('No token provided')
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('summary: Nên trả về 401 nếu header Authorization không bắt đầu bằng Bearer', () => {
    mockRequest.headers = {
      authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
    };

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('No token provided')
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('summary: Nên trả về 401 nếu token bị sai hoặc không hợp lệ', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid.token.value'
    };

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid token.'
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('summary: Nên xác thực thành công, gán userId và gọi next() khi token hợp lệ', () => {
    const payload = { userId: 'user-id-12345', email: 'test@example.com' };
    const validToken = jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' });

    mockRequest.headers = {
      authorization: `Bearer ${validToken}`
    };

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse, nextFunction);

    expect(mockRequest.userId).toBe('user-id-12345');
    expect(mockRequest.userEmail).toBe('test@example.com');
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
