import { PrismaClient, Tree as PrismaTree } from '@prisma/client';
import { WateringResponse } from './watering';

// 타입 정의

const prisma = new PrismaClient();

// 나무 데이터 생성

class Tree {
  private tree: PrismaTree;

  constructor(prismaTree: PrismaTree) {
    this.tree = prismaTree;
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
    const experienceNeeded = this.tree.level * 100;
    if (this.tree.experience >= experienceNeeded) {
      this.tree.level += 1;
      this.tree.experience -= experienceNeeded;
    }
  }
}

export default Tree;
export type { WateringResponse };
