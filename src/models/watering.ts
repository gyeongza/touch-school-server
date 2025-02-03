import { PrismaClient, Watering as PrismaWatering } from '@prisma/client';
import Tree from './tree';

interface WateringResponse {
  success: boolean;
  message: string;
}

const prisma = new PrismaClient();

class Watering {
  static async water(
    treeId: number,
    userId: number
  ): Promise<WateringResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          message: '사용자를 찾을 수 없습니다.',
        };
      }

      if (user.waterCount <= 0) {
        return {
          success: false,
          message:
            '물주기 가능 횟수를 모두 사용했습니다. 미니게임을 통해 추가 기회를 얻어보세요!',
        };
      }

      // 트랜잭션으로 물주기 처리
      const result = await prisma.$transaction(async (tx) => {
        // 물주기 기록 생성
        await tx.watering.create({
          data: { treeId, userId },
        });

        // 유저의 물주기 횟수 감소
        await tx.user.update({
          where: { id: userId },
          data: { waterCount: user.waterCount - 1 },
        });

        // 나무 경험치 증가
        const tree = await tx.tree.findUnique({ where: { id: treeId } });
        if (!tree) throw new Error('나무를 찾을 수 없습니다.');

        const treeInstance = new Tree(tree);
        treeInstance.addExperience(15);

        await tx.tree.update({
          where: { id: treeId },
          data: {
            experience: treeInstance.getExperience(),
            level: treeInstance.getTreeLevel(),
            lastWateredAt: new Date(),
          },
        });

        return {
          success: true,
          message: `물주기 성공! 경험치 +15 (남은 물주기 횟수: ${user.waterCount - 1}회)`,
        };
      });

      return result;
    } catch (error) {
      console.error('물주기 처리 실패:', error);
      throw new Error('물주기 처리 중 오류가 발생했습니다.');
    }
  }

  static async getTodayWaterings(treeId: number): Promise<PrismaWatering[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.watering.findMany({
      where: {
        treeId,
        createdAt: {
          gte: today,
        },
      },
      include: {
        user: true,
      },
    });
  }

  static async getUserWaterings(userId: number): Promise<PrismaWatering[]> {
    return await prisma.watering.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default Watering;
export type { WateringResponse };
