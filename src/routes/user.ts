import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { GetUserResponse } from '../types/user';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { school: true },
    });

    if (!user) {
      return res.status(404).json({
        message: '등록되지 않은 사용자입니다',
        errorMessageKey: 'USER_NOT_FOUND',
      });
    }

    const userResponse: GetUserResponse = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      grade: user.grade,
      class: user.class,
      schoolId: user.schoolId,
      waterCount: user.waterCount,
      createdAt: user.createdAt,
      school: user.school
        ? {
            id: user.school.id,
            name: user.school.name,
            address: user.school.address || null,
          }
        : null,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('사용자 조회 중 오류 발생:', error);
    res.status(500).json({
      message: '사용자 조회 중 오류가 발생했습니다',
      errorMessageKey: 'USER_SEARCH_ERROR',
    });
  }
});

router.get('/my', authenticateToken, async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    const school = await prisma.school.findUnique({
      where: {
        id: schoolId,
      },
      select: {
        id: true,
        name: true,
        tree: {
          select: {
            id: true,
            level: true,
            experience: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!school) {
      return res.status(404).json({ message: '학교를 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      school: {
        id: school.id,
        name: school.name,
        totalUser: school._count.users,
      },
      tree: {
        id: school.tree?.id,
        level: school.tree?.level,
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
