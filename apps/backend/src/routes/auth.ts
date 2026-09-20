import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { RegisterDto, LoginDto, AuthResponse, ApiResponse, IUser } from '@mychecklist/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getJwtSecret, getJwtExpiresIn } from '../config/jwt';

const router = Router();

// Generate Token helper
const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: getJwtExpiresIn() as any });
};

// Format User helper
const formatUser = (userDoc: any): IUser => ({
  id: userDoc._id?.toString() || userDoc.id,
  name: userDoc.name,
  email: userDoc.email,
  avatarUrl: userDoc.avatarUrl || '',
  createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : undefined
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  try {
    const { name, email, password }: RegisterDto = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = generateToken(newUser.id, newUser.email);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        user: formatUser(newUser),
        token
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi đăng ký.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
  try {
    const { email, password }: LoginDto = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ email và mật khẩu.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không chính xác.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không chính xác.'
      });
    }

    const token = generateToken(user.id, user.email);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: formatUser(user),
        token
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi đăng nhập.'
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<IUser>>) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng.'
      });
    }

    return res.json({
      success: true,
      data: formatUser(user)
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi lấy thông tin người dùng.'
    });
  }
});

export default router;
