import {
  PrismaClient,
  Watering as PrismaWatering,
  Tree as PrismaTree,
} from '@prisma/client';
import Tree from './tree';

interface WateringResponse {
  success: boolean;
  message: string;
}

const prisma = new PrismaClient();

class Watering {
  static async water(
    treeId: number,
    userId: number,
    waterCount: number = 1,
    treeInstance: Tree
  ): Promise<WateringResponse & { tree: PrismaTree }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const [user, tree] = await Promise.all([
          tx.user.findUnique({ where: { id: userId } }),
          tx.tree.findUnique({ where: { id: treeId } }),
        ]);

        if (!user) {
          return {
            success: false,
            message: '사용자를 찾을 수 없습니다.',
            tree: tree!,
          };
        }

        if (!tree) {
          throw new Error('나무를 찾을 수 없습니다.');
        }

        if (user.waterCount < waterCount) {
          return {
            success: false,
            message: `물주기 가능 횟수가 부족합니다. (보유: ${user.waterCount}회, 필요: ${waterCount}회)`,
            tree: tree,
          };
        }

        const expGain = 15 * waterCount;
        treeInstance.addExperience(expGain);

        const updatedTree = await tx.tree.update({
          where: { id: treeId },
          data: {
            experience: treeInstance.getExperience(),
            level: treeInstance.getTreeLevel(),
            lastWateredAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { waterCount: user.waterCount - waterCount },
        });

        await tx.watering.create({
          data: {
            treeId,
            userId,
            amount: waterCount,
          },
        });

        return {
          success: true,
          message: `물주기 성공! (남은 물주기 횟수: ${user.waterCount - waterCount}회)`,
          tree: updatedTree,
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

  static async getUserWaterings(
    userId: number
  ): Promise<{ waterings: PrismaWatering[]; totalAmount: number }> {
    const waterings = await prisma.watering.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = waterings.reduce(
      (sum, watering) => sum + watering.amount,
      0
    );

    return {
      waterings,
      totalAmount,
    };
  }
}

export default Watering;
export type { WateringResponse };
