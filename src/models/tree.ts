import { Tree as PrismaTree } from '@prisma/client';
import { WateringResponse } from './watering';

// 타입 정의

// 나무 데이터 생성

class Tree {
  private tree: PrismaTree;
  private onLevelUp?: (oldLevel: number, newLevel: number) => void;

  constructor(
    prismaTree: PrismaTree,
    onLevelUp?: (oldLevel: number, newLevel: number) => void
  ) {
    this.tree = prismaTree;
    this.onLevelUp = onLevelUp;
  }

  private static calculateExperienceNeeded(level: number): number {
    return level * 100;
  }

  getTreeLevel() {
    return this.tree.level;
  }

  getExperience() {
    return this.tree.experience;
  }

  getStatus(): PrismaTree {
    return { ...this.tree };
  }

  addExperience(amount: number) {
    this.tree.experience += amount;
    this.checkLevelUp();
  }

  private checkLevelUp() {
    while (true) {
      const experienceNeeded = Tree.calculateExperienceNeeded(this.tree.level);
      if (this.tree.experience < experienceNeeded) break;

      const oldLevel = this.tree.level;
      this.tree.level += 1;
      this.tree.experience -= experienceNeeded;

      this.onLevelUp?.(oldLevel, this.tree.level);
    }
  }
}

export default Tree;
export type { WateringResponse };
