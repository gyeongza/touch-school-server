import { PrismaClient, Game as PrismaGame } from '@prisma/client';

const prisma = new PrismaClient();

interface GameResult {
  message: string;
  waterCount?: number;
  gameCompleted?: boolean;
}

class Game {
  static readonly DAILY_LIMIT = 10;
  static readonly WATER_REWARD = 10;

  static async canPlayToday(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gamesPlayedToday = await prisma.game.count({
      where: {
        userId,
        playedAt: {
          gte: today,
        },
      },
    });

    return gamesPlayedToday < this.DAILY_LIMIT;
  }

  static async getTodayGameAvailableCount(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gamesPlayedToday = await prisma.game.count({
      where: {
        userId,
        playedAt: {
          gte: today,
        },
      },
    });

    return this.DAILY_LIMIT - gamesPlayedToday;
  }

  static async play(
    userId: number,
    completedLevels: number[],
    gameType: string = 'WATER_GAME'
  ): Promise<GameResult> {
    try {
      const canPlay = await this.canPlayToday(userId);
      if (!canPlay) {
        return {
          message:
            '오늘은 더 이상 게임을 플레이할 수 없습니다. 내일 다시 도전해주세요!',
        };
      }

      const result = await prisma.$transaction(async (tx) => {
        // 모든 레벨(1,2,3) 클리어 확인
        const allLevelsCompleted = [1, 2, 3].every((level) =>
          completedLevels.includes(level)
        );

        // 게임 세션 결과 기록
        const gameRecord = await tx.game.create({
          data: {
            userId,
            completedLevels,
            allCompleted: allLevelsCompleted,
            reward: allLevelsCompleted ? this.WATER_REWARD : 0,
            type: gameType,
          },
        });

        if (allLevelsCompleted) {
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              waterCount: {
                increment: this.WATER_REWARD,
              },
            },
          });

          return {
            message: `축하합니다! 모든 레벨을 클리어하여 물주기 기회 ${this.WATER_REWARD}회를 획득했습니다!`,
            waterCount: updatedUser.waterCount,
            gameCompleted: true,
          };
        }

        const remainingLevels = [1, 2, 3]
          .filter((level) => !completedLevels.includes(level))
          .join(', ');

        return {
          message: `아직 클리어하지 못한 레벨이 있습니다: ${remainingLevels}단계`,
          gameCompleted: false,
        };
      });

      return result;
    } catch (error) {
      console.error('게임 처리 실패:', error);
      throw new Error('게임 처리 중 오류가 발생했습니다.');
    }
  }

  static async getGameHistory(userId: number) {
    return await prisma.game.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: 10, // 최근 10개 기록만 가져오기
    });
  }

  static async getTodayGames(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.game.findMany({
      where: {
        userId,
        playedAt: {
          gte: today,
        },
      },
      orderBy: { playedAt: 'desc' },
    });
  }
}

export default Game;
export type { GameResult };
