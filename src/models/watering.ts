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
      const result = await prisma.$transaction(async (tx) => {
        const [user, tree] = await Promise.all([
          tx.user.findUnique({ where: { id: userId } }),
          tx.tree.findUnique({ where: { id: treeId } }),
        ]);

        if (!user) {
          return { success: false, message: '사용자를 찾을 수 없습니다.' };
        }

        if (!tree) {
          return { success: false, message: '나무를 찾을 수 없습니다.' };
        }

        if (user.waterCount <= 0) {
          return {
            success: false,
            message:
              '물주기 가능 횟수를 모두 사용했습니다. 미니게임을 통해 추가 기회를 얻어보세요!',
          };
        }

        const treeInstance = new Tree(tree);
        treeInstance.addExperience(15);

        await Promise.all([
          tx.watering.create({
            data: { treeId, userId },
          }),
          tx.user.update({
            where: { id: userId },
            data: { waterCount: user.waterCount - 1 },
          }),
          tx.tree.update({
            where: { id: treeId },
            data: {
              experience: treeInstance.getExperience(),
              level: treeInstance.getTreeLevel(),
              lastWateredAt: new Date(),
            },
          }),
        ]);

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
