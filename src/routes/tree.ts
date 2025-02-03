// 나무 데이터 생성

import express, { Request, Response } from 'express';
import Tree from '../models/tree';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import Watering from '../models/watering';

const router = express.Router();
const prisma = new PrismaClient();

// 나무 상태 조회
router.get(
  '/status',
  authenticateToken,
  async (req: Request, res: Response) => {
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: '사용자의 학교 정보를 찾을 수 없습니다',
      });
    }

    try {
      // 트리 정보를 직접 조회
      const tree = await prisma.tree.findUnique({
        where: { schoolId },
      });

      if (!tree) {
        return res.status(404).json({
          success: false,
          message: '해당 학교의 나무를 찾을 수 없습니다',
        });
      }

      const treeInstance = new Tree(tree);
      return res.json(treeInstance.getStatus());
    } catch (error: any) {
      console.error('나무 상태 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '서버 오류 발생',
      });
    }
  }
);

// 물주기 요청
router.post(
  '/water',
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id: userId, schoolId } = req.user!;

    if (!schoolId || !userId) {
      return res.status(400).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다',
      });
    }

    try {
      const tree = await prisma.tree.findUnique({
        where: { schoolId },
      });

      if (!tree) {
        return res.status(404).json({
          success: false,
          message: '나무를 찾을 수 없습니다',
        });
      }

      const result = await Watering.water(tree.id, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          data: tree,
        });
      }

      // 업데이트된 나무 정보 조회
      const updatedTree = await prisma.tree.findUnique({
        where: { id: tree.id },
      });

      res.json({
        success: true,
        message: result.message,
        data: updatedTree,
      });
    } catch (error) {
      console.error('물주기 처리 오류:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '서버 오류 발생',
      });
    }
  }
);

export default router;
