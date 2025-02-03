import { PrismaClient, Tree as PrismaTree } from '@prisma/client';

// 타입 정의
interface TreeAttributes {
  id: number;
  level: number;
  experience: number;
  lastWateredAt: Date;
}

interface WateringResponse {
  success: boolean;
  message: string;
}

const prisma = new PrismaClient();

// 나무 데이터 생성

class Tree {
  private tree: TreeAttributes;

  constructor(prismaTree: PrismaTree) {
    this.tree = {
      id: prismaTree.id,
      level: prismaTree.level,
      experience: prismaTree.experience,
      lastWateredAt: prismaTree.lastWateredAt,
    };
  }

  getTreeLevel() {
    return this.tree.level;
  }

  getStatus(): TreeAttributes {
    return { ...this.tree };
  }

  private addExperience(amount: number) {
    this.tree.experience += amount;
    this.checkLevelUp();
  }

  private checkLevelUp() {
    const experienceNeeded = this.tree.level * 100;
    if (this.tree.experience >= experienceNeeded) {
      this.tree.level += 1;
      this.tree.experience -= experienceNeeded;
    }
  }

  async water(userId: number): Promise<WateringResponse> {
    try {
      // 유저의 물주기 가능 횟수 확인
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
          message: '물주기 가능 횟수를 모두 사용했습니다.',
        };
      }

      // 물주기 기록 생성 및 횟수 감소
      await prisma.$transaction([
        prisma.watering.create({
          data: {
            treeId: this.tree.id,
            userId: userId,
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { waterCount: user.waterCount - 1 },
        }),
      ]);

      this.addExperience(15);
      this.tree.lastWateredAt = new Date();

      const updatedTree = await prisma.tree.update({
        where: { id: this.tree.id },
        data: {
          experience: this.tree.experience,
          level: this.tree.level,
          lastWateredAt: this.tree.lastWateredAt,
        },
      });

      this.tree = {
        id: updatedTree.id,
        level: updatedTree.level,
        experience: updatedTree.experience,
        lastWateredAt: updatedTree.lastWateredAt,
      };

      return {
        success: true,
        message: `물주기 성공! 경험치 +15 (남은 물주기 횟수: ${user.waterCount - 1}회)`,
      };
    } catch (error) {
      console.error('물주기 업데이트 실패:', error);
      throw new Error('물주기 처리 중 오류 발생');
    }
  }
}

export default Tree;
export type { TreeAttributes, WateringResponse };
