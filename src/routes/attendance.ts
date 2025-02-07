import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 오늘 날짜 범위 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 오늘 출석 여부 확인
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: '오늘은 이미 출석체크를 하셨습니다',
        errorMessageKey: 'ALREADY_ATTENDED',
      });
    }

    // 출석체크 및 물주기 횟수 증가 트랜잭션
    const [_, updatedUser] = await prisma.$transaction([
      prisma.attendance.create({
        data: { userId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          waterCount: {
            increment: 3,
          },
        },
      }),
    ]);

    res.status(200).json({
      message: `출석체크 완료! 물주기 ${updatedUser.waterCount}회가 지급되었습니다`,
      waterCount: updatedUser.waterCount,
    });
  } catch (error) {
    console.error('출석체크 중 오류 발생:', error);
    res.status(500).json({
      message: '출석체크 처리 중 오류가 발생했습니다',
      errorMessageKey: 'ATTENDANCE_ERROR',
    });
  }
});

// 출석 기록 조회 API
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 오늘 날짜 범위 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 오늘 출석 여부 확인
    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const attendances = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30, // 최근 30일
    });

    res.status(200).json({
      attendances,
      canAttendance: !todayAttendance, // 오늘 출석하지 않았으면 true
    });
  } catch (error) {
    console.error('출석 기록 조회 중 오류 발생:', error);
    res.status(500).json({
      message: '출석 기록 조회 중 오류가 발생했습니다',
      errorMessageKey: 'ATTENDANCE_HISTORY_ERROR',
    });
  }
});

export default router;
